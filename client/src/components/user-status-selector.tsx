import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Circle } from "lucide-react";
import type { UserStatus } from "@shared/schema";

const statusColors = {
  online: "text-green-500",
  away: "text-yellow-500",
  busy: "text-red-500",
  offline: "text-gray-500",
};

type UserStatusSelectorProps = {
  status: UserStatus;
  onStatusChange: (status: UserStatus) => void;
};

export function UserStatusSelector({ status, onStatusChange }: UserStatusSelectorProps) {
  return (
    <Select value={status} onValueChange={onStatusChange}>
      <SelectTrigger className="w-[120px]">
        <SelectValue>
          <div className="flex items-center gap-2">
            <Circle className={`h-3 w-3 ${statusColors[status]}`} />
            <span className="capitalize">{status}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.keys(statusColors).map((s) => (
          <SelectItem key={s} value={s}>
            <div className="flex items-center gap-2">
              <Circle className={`h-3 w-3 ${statusColors[s as UserStatus]}`} />
              <span className="capitalize">{s}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
