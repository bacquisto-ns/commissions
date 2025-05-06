import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user?: {
    firstName?: string;
    lastName?: string;
    image?: string;
  } | null;
  className?: string;
}

export default function UserAvatar({ user, className }: UserAvatarProps) {
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  return (
    <Avatar className={cn("bg-primary/10", className)}>
      {user?.image ? (
        <AvatarImage src={user.image} alt={`${user.firstName} ${user.lastName}`} />
      ) : null}
      <AvatarFallback className="bg-primary/10 text-primary">
        {user ? getInitials(user.firstName, user.lastName) : <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}
