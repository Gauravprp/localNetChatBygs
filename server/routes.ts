import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, type ChatRequest, type Message } from "@shared/schema";

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

  wss.on("connection", (socket) => {
    let username: string | undefined;

    socket.on("message", async (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === "register" && message.username) {
        username = message.username;
        clients.set(username, { username, socket });
        await storage.setUserOnline(username, true);
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
        const targetClient = clients.get(msg.to);
        if (targetClient?.socket.readyState === WebSocket.OPEN) {
          targetClient.socket.send(JSON.stringify({
            type: "message",
            data: msg
          }));
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
    Array.from(clients.values()).forEach(client => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(message);
      }
    });
  }

  return httpServer;
}