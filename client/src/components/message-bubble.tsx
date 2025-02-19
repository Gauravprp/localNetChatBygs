import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ReactionPicker } from "./reaction-picker";
import type { Reaction } from "@shared/schema";

type MessageBubbleProps = {
  content: string;
  timestamp: number;
  isSelf: boolean;
  reactions: Reaction[];
  username: string;
  onAddReaction: (emoji: string) => void;
};

export function MessageBubble({ 
  content, 
  timestamp, 
  isSelf, 
  reactions,
  username,
  onAddReaction 
}: MessageBubbleProps) {
  return (
    <div className={cn("flex flex-col gap-1", isSelf ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-4 py-2",
          isSelf
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        <p className="break-words">{content}</p>
        <p className="mt-1 text-xs opacity-70">
          {format(timestamp, "HH:mm")}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {reactions.length > 0 && (
          <div className="flex gap-1 px-2 py-1 bg-muted rounded-full text-sm">
            {reactions.map((reaction, index) => (
              <button
                key={index}
                className="hover:opacity-80 transition-opacity"
                onClick={() => onAddReaction(reaction.emoji)}
                title={reaction.users.join(", ")}
              >
                {reaction.emoji} {reaction.users.length}
              </button>
            ))}
          </div>
        )}
        <ReactionPicker onSelect={onAddReaction} />
      </div>
    </div>
  );
}