import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: any;
  className?: string;
}

export default function UserAvatar({ user, className }: UserAvatarProps) {
  // Get user initials for fallback
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.username?.substring(0, 2).toUpperCase() || "?";

  return (
    <Avatar className={cn("border border-border", className)}>
      {user?.profileImageUrl && (
        <AvatarImage src={user.profileImageUrl} alt={`${user?.firstName} ${user?.lastName}`} />
      )}
      <AvatarFallback>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}