import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import UserAvatar from "@/components/user-avatar";
import { LayoutDashboard, DollarSign, Users, BarChart3, Settings, Menu, Package } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const isMobile = useMobile();
  
  // Fetch authenticated user
  const { data: broker } = useQuery({
    queryKey: ["/api/brokers/me"],
  });

  const routes = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="mr-3 h-5 w-5" />,
      href: "/",
    },
    {
      label: "Commissions",
      icon: <DollarSign className="mr-3 h-5 w-5" />,
      href: "/commissions",
    },
    {
      label: "Brokers",
      icon: <Users className="mr-3 h-5 w-5" />,
      href: "/brokers",
    },
    {
      label: "Products",
      icon: <Package className="mr-3 h-5 w-5" />,
      href: "/products",
    },
    {
      label: "Reports",
      icon: <BarChart3 className="mr-3 h-5 w-5" />,
      href: "/reports",
    },
    {
      label: "Settings",
      icon: <Settings className="mr-3 h-5 w-5" />,
      href: "/settings",
    },
  ];

  const sidebarContent = (
    <>
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary">
        <h1 className="text-xl font-semibold text-white">BrokerCommissions</h1>
      </div>
      <div className="flex flex-col flex-grow overflow-y-auto">
        <ScrollArea className="flex-1">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {routes.map((route) => (
              <Link
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
              </Link>
            ))}
          </nav>
        </ScrollArea>
        
        <Separator />
        
        <div className="p-4">
          <div className="flex items-center">
            <UserAvatar user={broker} className="h-9 w-9" />
            <div className="ml-3">
              <p className="text-sm font-medium text-foreground">
                {broker?.firstName} {broker?.lastName}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Broker #{broker?.id}
              </p>
            </div>
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
