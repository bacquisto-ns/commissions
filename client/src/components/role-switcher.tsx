import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRole } from "@/lib/permissions";
import { Users, ChevronDown } from "lucide-react";
import RoleBadge from "./role-badge";

const roleOptions = [
  { id: 13, label: "Administrator", role: UserRole.ADMIN },
  { id: 10, label: "System Admin", role: UserRole.SYSTEM_ADMIN },
  { id: 7, label: "Agency Admin", role: UserRole.AGENCY_ADMIN },
  { id: 8, label: "Broker", role: UserRole.BROKER }
];

export default function RoleSwitcher() {
  const { user, switchRole } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Switch Role</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Current Role</DropdownMenuLabel>
        <div className="px-2 py-1.5">
          {user && <RoleBadge role={user.role} />}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Switch To</DropdownMenuLabel>
        {roleOptions.map((option) => (
          <DropdownMenuItem
            key={option.id}
            className="cursor-pointer"
            onClick={() => switchRole(option.id)}
          >
            <RoleBadge role={option.role} className="mr-2" /> {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}