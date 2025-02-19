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
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileUpload } from "@/components/file-upload";

export default function Chat() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const username = localStorage.getItem("username");

  useEffect(() => {
    if (!username) {
      setLocation("/");
      return;
    }

    socketClient.connect(username);

    socketClient.onUsers((updatedUsers) => {
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

    socketClient.onReaction(({ messageTimestamp, from, emoji }) => {
      setMessages(prev => prev.map(msg => {
        if (msg.timestamp === messageTimestamp) {
          const existingReaction = msg.reactions.find(r => r.emoji === emoji);
          if (existingReaction) {
            if (!existingReaction.users.includes(from)) {
              existingReaction.users.push(from);
            }
            return { ...msg };
          } else {
            return {
              ...msg,
              reactions: [...msg.reactions, { emoji, users: [from] }]
            };
          }
        }
        return msg;
      }));
    });
  }, [username, setLocation]);

  function handleUserSelect(selectedUsername: string) {
    if (selectedUsername === "📝 Notes" || selectedUsername === "🤖 AI Assistant") {
      setSelectedUser(selectedUsername);
      toast({
        title: selectedUsername === "📝 Notes" ? "Personal Notes" : "AI Chat",
        description: selectedUsername === "📝 Notes"
          ? "You can store your important notes here"
          : "Chat with our AI assistant",
      });
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
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

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (newMessage.trim() && selectedUser && username) {
      const message: Message = {
        from: username,
        to: selectedUser,
        content: newMessage,
        timestamp: Date.now(),
        reactions: [],
        attachments: [], // Added attachments array
      };

      if (selectedUser === "📝 Notes") {
        setMessages((prev) => [...prev, message]);
      } else if (selectedUser === "🤖 AI Assistant") {
        setMessages((prev) => [...prev, message]);
        const aiResponse: Message = {
          from: "🤖 AI Assistant",
          to: username,
          content: "I am a simple AI assistant. In the future, I will be connected to an AI API to provide more meaningful responses!",
          timestamp: Date.now(),
          reactions: [],
          attachments: [], // Added attachments array
        };
        setTimeout(() => setMessages(prev => [...prev, aiResponse]), 1000);
      } else {
        socketClient.sendMessage(message);
        setMessages((prev) => [...prev, message]);
      }
      setNewMessage("");
    }
  }

  function handleReaction(messageTimestamp: number, to: string, emoji: string) {
    if (!username) return;

    socketClient.sendReaction(messageTimestamp, username, to, emoji);
    setMessages(prev => prev.map(msg => {
      if (msg.timestamp === messageTimestamp) {
        const existingReaction = msg.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          if (!existingReaction.users.includes(username)) {
            existingReaction.users.push(username);
          }
          return { ...msg };
        } else {
          return {
            ...msg,
            reactions: [...msg.reactions, { emoji, users: [username] }]
          };
        }
      }
      return msg;
    }));
  }

  return (
    <div className="flex h-screen bg-background">
      <button
        className="md:hidden fixed top-4 left-4 z-20 p-2 bg-primary text-primary-foreground rounded-md"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div
        className={`${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static z-10 w-80 h-full bg-background border-r transition-transform duration-200 ease-in-out`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Available Users</h2>
          <ThemeToggle />
        </div>
        <ScrollArea className="h-[calc(100vh-73px)]">
          <div className="p-4 space-y-2">
            {users.map((user) => (
              <Button
                key={user.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleUserSelect(user.username)}
                disabled={!user.online && !["📝 Notes", "🤖 AI Assistant"].includes(user.username)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      user.username === "📝 Notes"
                        ? "bg-yellow-500"
                        : user.username === "🤖 AI Assistant"
                        ? "bg-blue-500"
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

      <div className="flex-1 flex flex-col relative">
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
                      reactions={message.reactions}
                      username={username!}
                      onAddReaction={(emoji) => handleReaction(message.timestamp, message.from, emoji)}
                      attachments={message.attachments}
                    />
                  ))}
              </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <FileUpload 
                  onFileSelect={(file) => {
                    if (selectedUser && username) {
                      socketClient.sendFile(file, selectedUser, selectedUser.startsWith('group_'));
                    }
                  }} 
                />
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
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="p-6">
              <p className="text-muted-foreground text-center">
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