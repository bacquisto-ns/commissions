import { ReactNode } from 'react';
import { hasPermission, canAccessBroker, canAccessAgency } from '@/lib/permissions';
import { useAuth } from '@/context/auth-context';

interface PermissionGateProps {
  permission?: string;
  brokerId?: number;
  agencyId?: number;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGate({
  permission,
  brokerId,
  agencyId,
  children,
  fallback = null,
}: PermissionGateProps) {
  // Get the current user from the auth context
  const { user } = useAuth();
  
  // If there's no user or the auth is loading, render fallback
  if (!user) return <>{fallback}</>;

  // Check if the user has the required permission
  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(user.role, permission);
  }

  // Check if the user can access the broker
  if (hasAccess && brokerId !== undefined) {
    hasAccess = canAccessBroker(user, brokerId);
  }

  // Check if the user can access the agency
  if (hasAccess && agencyId !== undefined) {
    hasAccess = canAccessAgency(user, agencyId);
  }

  // Render children if the user has access, otherwise render fallback
  return <>{hasAccess ? children : fallback}</>;
}