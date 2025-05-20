import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import UserAvatar from "@/components/user-avatar";
import RoleBadge from "@/components/role-badge";
import { 
  LayoutDashboard, 
  DollarSign, 
  Users, 
  BarChart3, 
  Settings, 
  Menu, 
  Package, 
  Building2, 
  Shield,
  LogOut,
  Upload
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/auth-context";
import { Permissions, hasPermission } from "@/lib/permissions";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const isMobile = useMobile();
  
  // Get authenticated user from auth context
  const { user, logout } = useAuth();

  const routes = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="mr-3 h-5 w-5" />,
      href: "/",
      permission: Permissions.VIEW_DASHBOARD,
    },
    {
      label: "Commissions",
      icon: <DollarSign className="mr-3 h-5 w-5" />,
      href: "/commissions",
      permission: Permissions.VIEW_COMMISSIONS,
    },
    {
      label: "Brokers",
      icon: <Users className="mr-3 h-5 w-5" />,
      href: "/brokers",
      permission: Permissions.VIEW_BROKERS,
    },
    {
      label: "Agencies",
      icon: <Building2 className="mr-3 h-5 w-5" />,
      href: "/agencies",
      permission: Permissions.VIEW_AGENCIES,
    },
    {
      label: "Products",
      icon: <Package className="mr-3 h-5 w-5" />,
      href: "/products",
      permission: Permissions.MANAGE_PRODUCTS,
    },
    {
      label: "Commission Structures",
      icon: <Shield className="mr-3 h-5 w-5" />,
      href: "/commission-structures",
      permission: Permissions.MANAGE_COMMISSION_STRUCTURES,
    },
    {
      label: "Import Data",
      icon: <Upload className="mr-3 h-5 w-5" />,
      href: "/import",
      permission: Permissions.EDIT_COMMISSIONS,
    },
    {
      label: "Reports",
      icon: <BarChart3 className="mr-3 h-5 w-5" />,
      href: "/reports",
      permission: Permissions.VIEW_DASHBOARD,
    },
    {
      label: "Agency Reports",
      icon: <BarChart3 className="mr-3 h-5 w-5" />,
      href: "/agency-reports",
      permission: Permissions.VIEW_AGENCIES,
    },
    {
      label: "Settings",
      icon: <Settings className="mr-3 h-5 w-5" />,
      href: "/settings",
      permission: Permissions.MANAGE_SYSTEM_SETTINGS,
    },
  ];

  const sidebarContent = (
    <>
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary">
        <h1 className="text-xl font-semibold text-white">NueSynergy Commissions</h1>
      </div>
      <div className="flex flex-col flex-grow overflow-y-auto">
        <ScrollArea className="flex-1">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {routes.map((route) => {
              // Show all routes if user is admin
              if (user?.role === 'admin') {
                // Admin can see all routes
              } 
              // For other roles, check permissions
              else if (route.permission && user?.role && !hasPermission(user.role, route.permission)) {
                return null;
              }
              
              return (
                <a
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                    location === route.href
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {route.icon}
                  {route.label}
                </a>
              );
            })}
          </nav>
        </ScrollArea>
        
        <Separator />
        
        <div className="p-4">
          <div className="flex items-center mb-3">
            <UserAvatar user={user} className="h-9 w-9" />
            <div className="ml-3">
              <p className="text-sm font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="mt-1">
                {user?.role && <RoleBadge role={user.role} />}
              </div>
            </div>
          </div>
          
          {/* Logout Button */}
          <div className="mt-3 space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center gap-2"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground">
            <p>ID: {user?.id} | For testing only</p>
          </div>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <div className="flex flex-col h-full">{sidebarContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className={cn("hidden md:flex md:flex-shrink-0", className)}>
      <div className="flex flex-col w-64 border-r border-border bg-card">
        {sidebarContent}
      </div>
    </div>
  );
}
