import { UserRole } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Building2, Key } from "lucide-react";

interface RoleBadgeProps {
  role: UserRole | string;
  className?: string;
}

export default function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  switch (role) {
    case UserRole.ADMIN:
      return (
        <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
          <Key className="h-3 w-3 mr-1" /> Administrator
        </Badge>
      );
    case UserRole.SYSTEM_ADMIN:
      return (
        <Badge variant="default" className="bg-red-500 hover:bg-red-600">
          <Shield className="h-3 w-3 mr-1" /> System Admin
        </Badge>
      );
    case UserRole.AGENCY_ADMIN:
      return (
        <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">
          <Building2 className="h-3 w-3 mr-1" /> Agency Admin
        </Badge>
      );
    case UserRole.BROKER:
    default:
      return (
        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
          <User className="h-3 w-3 mr-1" /> Broker
        </Badge>
      );
  }
}