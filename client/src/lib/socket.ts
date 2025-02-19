import { type User, type Message, type ChatRequest, type GroupChat, type UserStatus } from "@shared/schema";

type MessageCallback = (message: Message) => void;
type UsersCallback = (users: User[]) => void;
type ChatRequestCallback = (request: ChatRequest) => void;
type ChatResponseCallback = (response: { from: string, accepted: boolean }) => void;
type ReactionCallback = (data: { messageTimestamp: number, from: string, to: string, emoji: string }) => void;
type GroupUpdateCallback = (group: GroupChat) => void;

class SocketClient {
  private socket: WebSocket | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private usersCallbacks: UsersCallback[] = [];
  private chatRequestCallbacks: ChatRequestCallback[] = [];
  private chatResponseCallbacks: ChatResponseCallback[] = [];
  private reactionCallbacks: ReactionCallback[] = [];
  private groupUpdateCallbacks: GroupUpdateCallback[] = [];

  connect(username: string) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.socket?.send(JSON.stringify({ type: "register", username }));
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "message":
          this.messageCallbacks.forEach(cb => cb(message.data));
          break;
        case "users":
          this.usersCallbacks.forEach(cb => cb(message.data));
          break;
        case "chatRequest":
          this.chatRequestCallbacks.forEach(cb => cb(message.data));
          break;
        case "chatResponse":
          this.chatResponseCallbacks.forEach(cb => cb(message.data));
          break;
        case "reaction":
          this.reactionCallbacks.forEach(cb => cb(message.data));
          break;
        case "groupUpdate":
          this.groupUpdateCallbacks.forEach(cb => cb(message.data));
          break;
      }
    };
  }

  sendMessage(message: Message) {
    this.socket?.send(JSON.stringify({ type: "message", data: message }));
  }

  sendReaction(messageTimestamp: number, from: string, to: string, emoji: string) {
    this.socket?.send(JSON.stringify({
      type: "reaction",
      data: { messageTimestamp, from, to, emoji }
    }));
  }

  sendChatRequest(request: ChatRequest) {
    this.socket?.send(JSON.stringify({ type: "chatRequest", data: request }));
  }

  sendChatResponse(from: string, to: string, accepted: boolean) {
    this.socket?.send(JSON.stringify({
      type: "chatResponse",
      data: { from, to, accepted }
    }));
  }

  setStatus(status: UserStatus) {
    this.socket?.send(JSON.stringify({
      type: "setStatus",
      data: { status }
    }));
  }

  createGroup(name: string, members: string[]) {
    this.socket?.send(JSON.stringify({
      type: "createGroup",
      data: { name, members }
    }));
  }

  sendFile(file: File, to: string, isGroup: boolean = false) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.socket?.send(JSON.stringify({
        type: "file",
        data: {
          name: file.name,
          type: file.type,
          data: base64,
          to,
          isGroup
        }
      }));
    };
    reader.readAsDataURL(file);
  }

  onMessage(callback: MessageCallback) {
    this.messageCallbacks.push(callback);
  }

  onUsers(callback: UsersCallback) {
    this.usersCallbacks.push(callback);
  }

  onChatRequest(callback: ChatRequestCallback) {
    this.chatRequestCallbacks.push(callback);
  }

  onChatResponse(callback: ChatResponseCallback) {
    this.chatResponseCallbacks.push(callback);
  }

  onReaction(callback: ReactionCallback) {
    this.reactionCallbacks.push(callback);
  }

  onGroupUpdate(callback: GroupUpdateCallback) {
    this.groupUpdateCallbacks.push(callback);
  }
}

export const socketClient = new SocketClient();