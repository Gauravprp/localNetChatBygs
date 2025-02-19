import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, type ChatRequest, type Message, type UserStatus } from "@shared/schema";

type Client = {
  username: string;
  socket: WebSocket;
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const clients = new Map<string, Client>();

  app.post("/api/users", async (req, res) => {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid username" });
    }

    const existing = await storage.getUserByUsername(result.data.username);
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const user = await storage.createUser(result.data);
    res.json(user);
  });

  app.get("/api/users", async (req, res) => {
    const users = await storage.listUsers();
    res.json(users);
  });

  app.get("/api/groups", async (req, res) => {
    const groups = await storage.listGroups();
    res.json(groups);
  });

  wss.on("connection", (socket) => {
    let username: string | undefined;

    socket.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "register" && message.username) {
          username = message.username;
          clients.set(username, { username, socket });
          await storage.setUserOnline(username, true);
          broadcastUsers();
        } else if (message.type === "setStatus" && username) {
          const status = message.data.status as UserStatus;
          await storage.setUserStatus(username, status);
          broadcastUsers();
        } else if (message.type === "chatRequest") {
          const request = message.data as ChatRequest;
          const targetClient = clients.get(request.to);
          if (targetClient?.socket.readyState === WebSocket.OPEN) {
            targetClient.socket.send(JSON.stringify({
              type: "chatRequest",
              data: request
            }));
          }
        } else if (message.type === "chatResponse") {
          const { from, to, accepted } = message.data;
          const targetClient = clients.get(to);
          if (targetClient?.socket.readyState === WebSocket.OPEN) {
            targetClient.socket.send(JSON.stringify({
              type: "chatResponse",
              data: { from, accepted }
            }));
          }
        } else if (message.type === "message") {
          const msg = message.data as Message;
          if (msg.isGroupMessage) {
            const group = await storage.getGroup(msg.to);
            if (group) {
              group.members.forEach(member => {
                const client = clients.get(member);
                if (client?.socket.readyState === WebSocket.OPEN && member !== msg.from) {
                  client.socket.send(JSON.stringify({
                    type: "message",
                    data: msg
                  }));
                }
              });
            }
          } else {
            const targetClient = clients.get(msg.to);
            if (targetClient?.socket.readyState === WebSocket.OPEN) {
              targetClient.socket.send(JSON.stringify({
                type: "message",
                data: msg
              }));
            }
          }
        } else if (message.type === "reaction") {
          const { messageTimestamp, from, to, emoji } = message.data;
          const targetClient = clients.get(to);
          if (targetClient?.socket.readyState === WebSocket.OPEN) {
            targetClient.socket.send(JSON.stringify({
              type: "reaction",
              data: { messageTimestamp, from, emoji }
            }));
          }
        } else if (message.type === "createGroup") {
          const { name, members } = message.data;
          if (username) {
            const group = await storage.createGroup({
              name,
              members: [...members, username],
              createdBy: username,
              createdAt: Date.now()
            });
            broadcastGroupUpdate(group);
          }
        } else if (message.type === "file") {
          const { name, type, data: fileData, to, isGroup } = message.data;
          const attachment = {
            name,
            url: fileData,
            type
          };

          const msg: Message = {
            from: username!,
            to,
            content: `Sent file: ${name}`,
            timestamp: Date.now(),
            reactions: [],
            isGroupMessage: isGroup,
            attachments: [attachment]
          };

          if (isGroup) {
            const group = await storage.getGroup(to);
            if (group) {
              group.members.forEach(member => {
                const client = clients.get(member);
                if (client?.socket.readyState === WebSocket.OPEN && member !== username) {
                  client.socket.send(JSON.stringify({
                    type: "message",
                    data: msg
                  }));
                }
              });
            }
          } else {
            const targetClient = clients.get(to);
            if (targetClient?.socket.readyState === WebSocket.OPEN) {
              targetClient.socket.send(JSON.stringify({
                type: "message",
                data: msg
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });

    socket.on("close", async () => {
      if (username) {
        await storage.setUserOnline(username, false);
        clients.delete(username);
        broadcastUsers();
      }
    });
  });

  async function broadcastUsers() {
    const users = await storage.listUsers();
    const message = JSON.stringify({ type: "users", data: users });
    for (const client of clients.values()) {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(message);
      }
    }
  }

  async function broadcastGroupUpdate(group: any) {
    const message = JSON.stringify({ type: "groupUpdate", data: group });
    group.members.forEach((member: string) => {
      const client = clients.get(member);
      if (client?.socket.readyState === WebSocket.OPEN) {
        client.socket.send(message);
      }
    });
  }

  return httpServer;
}