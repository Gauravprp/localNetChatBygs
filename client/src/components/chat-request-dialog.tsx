import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MessageSquare } from "lucide-react";

type ChatRequestDialogProps = {
  username: string;
  onAccept: () => void;
  onReject: () => void;
};

export function ChatRequestDialog({ username, onAccept, onReject }: ChatRequestDialogProps) {
  return (
    <AlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <AlertDialogTitle>Chat Request</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {username} would like to start a chat with you. Do you accept?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onReject}>Reject</AlertDialogCancel>
          <AlertDialogAction onClick={onAccept}>Accept</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
