import { type User, type Message, type ChatRequest } from "@shared/schema";

type MessageCallback = (message: Message) => void;
type UsersCallback = (users: User[]) => void;
type ChatRequestCallback = (request: ChatRequest) => void;
type ChatResponseCallback = (response: { from: string, accepted: boolean }) => void;

class SocketClient {
  private socket: WebSocket | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private usersCallbacks: UsersCallback[] = [];
  private chatRequestCallbacks: ChatRequestCallback[] = [];
  private chatResponseCallbacks: ChatResponseCallback[] = [];

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
      }
    };
  }

  sendMessage(message: Message) {
    this.socket?.send(JSON.stringify({ type: "message", data: message }));
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
}

export const socketClient = new SocketClient();
