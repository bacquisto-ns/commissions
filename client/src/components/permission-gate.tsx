import { ReactNode } from "react";
import { useAuth } from "@/context/auth-context";
import { hasPermission, canAccessBroker, canAccessAgency } from "@/lib/permissions";

interface PermissionGateProps {
  permission?: string;
  brokerId?: number;
  agencyId?: number;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that renders its children only if the current user has the specified permission
 * or access to the specified broker or agency
 */
export default function PermissionGate({
  permission,
  brokerId,
  agencyId,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { user } = useAuth();

  // No user, deny access
  if (!user) {
    return <>{fallback}</>;
  }

  // Check permission if specified
  if (permission && !hasPermission(user.role, permission)) {
    return <>{fallback}</>;
  }

  // Check broker access if specified
  if (brokerId !== undefined && !canAccessBroker(user, brokerId)) {
    return <>{fallback}</>;
  }

  // Check agency access if specified
  if (agencyId !== undefined && !canAccessAgency(user, agencyId)) {
    return <>{fallback}</>;
  }

  // If all checks pass or no specific checks requested, allow access
  return <>{children}</>;
}