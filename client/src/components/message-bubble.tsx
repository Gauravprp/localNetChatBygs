import { cn } from "@/lib/utils";
import { format } from "date-fns";

type MessageBubbleProps = {
  content: string;
  timestamp: number;
  isSelf: boolean;
};

export function MessageBubble({ content, timestamp, isSelf }: MessageBubbleProps) {
  return (
    <div className={cn("flex", isSelf ? "justify-end" : "justify-start")}>
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
    </div>
  );
}
