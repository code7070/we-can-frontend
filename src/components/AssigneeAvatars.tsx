import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColor } from "@/lib/avatar-colors";
import type { User } from "@/api/types";

interface Props {
  assignees: User[];
  max?: number;
}

export function AssigneeAvatars({ assignees, max = 3 }: Props) {
  const visible = assignees.slice(0, max);
  const overflow = assignees.length - max;

  return (
    <div className="flex -space-x-1.5">
      {visible.map((user) => (
        <Avatar key={user.id} className="w-5 h-5 border border-surface text-[9px]">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback
            className="text-[9px] text-white"
            style={{ backgroundColor: getAvatarColor(user.name) }}
          >
            {user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <div className="w-5 h-5 rounded-full bg-border border border-surface flex items-center justify-center text-[9px] text-text-secondary font-medium">
          +{overflow}
        </div>
      )}
    </div>
  );
}
