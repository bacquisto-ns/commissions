import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/auth-context';
import { Spinner } from '@/components/ui/spinner';

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
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Removed the auto-redirect to login
  // Only show protected content when authenticated

  // If we're still loading, show a spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // If not authenticated, we'll redirect in the useEffect
  if (!isAuthenticated) {
    return null;
  }

  // If a specific permission is required, check it
  if (requiredPermission && user) {
    // Simple role-based permission check
    // In a real app, this would be more sophisticated
    const hasPermission = checkPermission(user.role, requiredPermission);
    
    if (!hasPermission) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => setLocation('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }
  }

  // If all checks pass, render the children
  return <>{children}</>;
}

// Simple permission check function
function checkPermission(role: string, permission: string): boolean {
  // Define role-permission mapping
  const rolePermissions: Record<string, string[]> = {
    admin: ['all', 'view_dashboard', 'manage_brokers', 'manage_agencies', 'manage_commissions', 'view_reports'],
    system_admin: ['view_dashboard', 'manage_brokers', 'manage_agencies', 'manage_commissions', 'view_reports'],
    agency_admin: ['view_dashboard', 'manage_brokers', 'view_reports'],
    broker: ['view_dashboard', 'view_commissions'],
  };

  // Admin has access to everything
  if (role === 'admin') return true;
  
  // Check if the role exists in our mapping
  if (role in rolePermissions) {
    return rolePermissions[role].includes(permission);
  }
  
  return false;
}