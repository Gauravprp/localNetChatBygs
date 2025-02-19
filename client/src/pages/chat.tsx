import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageBubble } from "@/components/message-bubble";
import { ChatRequestDialog } from "@/components/chat-request-dialog";
import { socketClient } from "@/lib/socket";
import type { User, Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const username = localStorage.getItem("username");

  useEffect(() => {
    if (!username) {
      setLocation("/");
      return;
    }

    socketClient.connect(username);

    socketClient.onUsers((updatedUsers) => {
      // Filter out the current user but keep Notes user
      setUsers(updatedUsers.filter((u) => u.username !== username));
    });

    socketClient.onMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketClient.onChatRequest((request) => {
      setPendingRequest(request.from);
    });

    socketClient.onChatResponse((response) => {
      if (response.accepted) {
        setSelectedUser(response.from);
        toast({
          title: "Chat accepted",
          description: `${response.from} accepted your chat request`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Chat declined",
          description: `${response.from} declined your chat request`,
        });
      }
    });
  }, [username, setLocation]);

  function handleUserSelect(selectedUsername: string) {
    if (selectedUsername === "📝 Notes") {
      // For Notes, directly start the chat without request
      setSelectedUser(selectedUsername);
      toast({
        title: "Personal Notes",
        description: "You can store your important notes here",
      });
    } else {
      socketClient.sendChatRequest({ from: username!, to: selectedUsername });
      toast({
        title: "Chat request sent",
        description: `Waiting for ${selectedUsername} to accept...`,
      });
    }
  }

  function handleAcceptChat() {
    if (pendingRequest && username) {
      socketClient.sendChatResponse(username, pendingRequest, true);
      setSelectedUser(pendingRequest);
      setPendingRequest(null);
    }
  }

  function handleRejectChat() {
    if (pendingRequest && username) {
      socketClient.sendChatResponse(username, pendingRequest, false);
      setPendingRequest(null);
    }
  }

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (newMessage.trim() && selectedUser && username) {
      const message: Message = {
        from: username,
        to: selectedUser,
        content: newMessage,
        timestamp: Date.now(),
      };

      if (selectedUser === "📝 Notes") {
        // For Notes, just add to local messages
        setMessages((prev) => [...prev, message]);
      } else {
        socketClient.sendMessage(message);
        setMessages((prev) => [...prev, message]);
      }
      setNewMessage("");
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="w-80 border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Available Users</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-73px)]">
          <div className="p-4 space-y-2">
            {users.map((user) => (
              <Button
                key={user.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleUserSelect(user.username)}
                disabled={!user.online && user.username !== "📝 Notes"}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      user.username === "📝 Notes"
                        ? "bg-yellow-500"
                        : user.online
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  />
                  {user.username}
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Chat with {selectedUser}</h2>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages
                  .filter(
                    (m) =>
                      (m.from === selectedUser && m.to === username) ||
                      (m.from === username && m.to === selectedUser),
                  )
                  .map((message, i) => (
                    <MessageBubble
                      key={i}
                      content={message.content}
                      timestamp={message.timestamp}
                      isSelf={message.from === username}
                    />
                  ))}
              </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <Button type="submit">Send</Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="p-6">
              <p className="text-muted-foreground">
                Select a user to start chatting
              </p>
            </Card>
          </div>
        )}
      </div>

      {pendingRequest && (
        <ChatRequestDialog
          username={pendingRequest}
          onAccept={handleAcceptChat}
          onReject={handleRejectChat}
        />
      )}
    </div>
  );
}