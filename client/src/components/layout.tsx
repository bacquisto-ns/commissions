import { ReactNode } from "react";
import Sidebar from "@/components/sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { Bell } from "lucide-react";
import UserAvatar from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useMobile();
  
  // Fetch authenticated user
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });
  
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="w-full bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 md:px-6">
            <div className="flex items-center md:hidden">
              <Sidebar />
              <h1 className="ml-3 text-lg font-medium text-primary">BrokerCommissions</h1>
            </div>
            
            <div className="flex items-center ml-auto space-x-4">
              <div className="relative">
                <Button size="icon" variant="ghost">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </div>
              <div className="hidden md:flex md:items-center">
                <UserAvatar user={user} className="h-8 w-8" />
                <span className="ml-2 text-sm font-medium text-foreground">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
