import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

interface AuthGuardProps {
  children: ReactNode;
  requiredPermission?: string;
}

/**
 * A component that guards routes requiring authentication
 * Redirects to login if user is not authenticated
 * Can also check for specific permissions
 */
export default function AuthGuard({ children, requiredPermission }: AuthGuardProps) {
  const { isAuthenticated, hasPermission, user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Don't redirect while auth is loading
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page",
        variant: "destructive",
      });
      navigate("/login", { replace: true });
      return;
    }

    // If permission check is required
    if (requiredPermission && !hasPermission(requiredPermission)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      navigate("/", { replace: true });
      return;
    }
  }, [isAuthenticated, hasPermission, requiredPermission, location, navigate, toast, isLoading, user]);

  // Show nothing while checking auth
  if (isLoading || !isAuthenticated || (requiredPermission && !hasPermission(requiredPermission))) {
    return null;
  }

  return <>{children}</>;
}