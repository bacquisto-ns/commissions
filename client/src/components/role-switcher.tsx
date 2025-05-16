import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function RoleSwitcher() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("broker");

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    
    // This would typically call an API endpoint to change roles
    // For demo purposes, we'll just show a toast
    toast({
      title: "Role switched",
      description: `You are now viewing the app as: ${value}`,
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <Select value={selectedRole} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-full text-xs h-8">
          <SelectValue placeholder="Switch role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="system_admin">System Admin</SelectItem>
          <SelectItem value="agency_admin">Agency Admin</SelectItem>
          <SelectItem value="broker">Broker</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}