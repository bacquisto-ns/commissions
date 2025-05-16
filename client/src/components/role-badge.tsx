import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export default function RoleBadge({ role, className }: RoleBadgeProps) {
  const variants: Record<string, string> = {
    admin: "bg-red-100 text-red-800 border-red-200",
    system_admin: "bg-purple-100 text-purple-800 border-purple-200",
    agency_admin: "bg-blue-100 text-blue-800 border-blue-200",
    broker: "bg-green-100 text-green-800 border-green-200",
  };

  const labels: Record<string, string> = {
    admin: "Admin",
    system_admin: "System Admin",
    agency_admin: "Agency Admin",
    broker: "Broker",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded font-medium text-xs py-0.5 px-2",
        variants[role] || "bg-gray-100 text-gray-800 border-gray-200",
        className
      )}
    >
      {labels[role] || role}
    </Badge>
  );
}