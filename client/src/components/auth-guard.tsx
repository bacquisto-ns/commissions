import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";

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
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login page
      window.location.href = "/api/login";
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // If we're still loading the auth state, don't render children yet
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is not authenticated, don't render children
  if (!isAuthenticated) {
    return null;
  }

  // If we require a specific permission, check if the user has it
  if (requiredPermission && user) {
    // For now, we'll just check if the user's role matches the required permission
    // This can be extended later to support more complex permission checks
    const hasPermission = user.role === requiredPermission;
    
    if (!hasPermission) {
      return (
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-center mb-6">
            You do not have the required permissions to access this page.
          </p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => setLocation("/")}
          >
            Return to Dashboard
          </button>
        </div>
      );
    }
  }

  // Otherwise, render the children
  return <>{children}</>;
}