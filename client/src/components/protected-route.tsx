import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { hasPermission } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  permission?: string;
  redirectTo?: string;
}

/**
 * A wrapper component that protects routes based on user permissions
 * Redirects unauthorized users and shows a toast notification
 */
export default function ProtectedRoute({
  component: Component,
  permission,
  redirectTo = "/"
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Wait until auth is loaded
    if (isLoading) return;

    // If no user or missing permission, redirect
    if (!user || (permission && !hasPermission(user.role, permission))) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive"
      });
      setLocation(redirectTo);
    }
  }, [user, isLoading, permission, redirectTo, setLocation, toast]);

  // While loading, return null
  if (isLoading) {
    return null;
  }

  // If user has permission, render the component
  if (user && (!permission || hasPermission(user.role, permission))) {
    return <Component />;
  }

  // Otherwise return null (redirect will happen in useEffect)
  return null;
}