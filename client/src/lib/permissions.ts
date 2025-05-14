// Define roles and their hierarchy
export enum UserRole {
  BROKER = 'broker',
  AGENCY_ADMIN = 'agency_admin',
  SYSTEM_ADMIN = 'system_admin',
}

// Define permissions as string constants
export const Permissions = {
  // Agency permissions
  VIEW_AGENCIES: 'view_agencies',
  CREATE_AGENCY: 'create_agency',
  EDIT_AGENCY: 'edit_agency',
  
  // Broker permissions
  VIEW_BROKERS: 'view_brokers',
  CREATE_BROKER: 'create_broker',
  EDIT_BROKER: 'edit_broker',
  EDIT_OWN_PROFILE: 'edit_own_profile',
  
  // Commission permissions
  VIEW_COMMISSIONS: 'view_commissions',
  CREATE_COMMISSION: 'create_commission',
  APPROVE_COMMISSION: 'approve_commission',
  
  // Product and Structure permissions
  MANAGE_PRODUCTS: 'manage_products',
  MANAGE_COMMISSION_STRUCTURES: 'manage_commission_structures',
  
  // Dashboard permissions
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_AGENCY_DASHBOARD: 'view_agency_dashboard',
  VIEW_SYSTEM_DASHBOARD: 'view_system_dashboard',
};

// Define what permissions each role has
const rolePermissions: Record<UserRole, string[]> = {
  [UserRole.BROKER]: [
    Permissions.VIEW_AGENCIES,
    Permissions.VIEW_BROKERS,
    Permissions.EDIT_OWN_PROFILE,
    Permissions.VIEW_COMMISSIONS,
    Permissions.CREATE_COMMISSION,
    Permissions.VIEW_DASHBOARD,
  ],
  [UserRole.AGENCY_ADMIN]: [
    Permissions.VIEW_AGENCIES,
    Permissions.VIEW_BROKERS,
    Permissions.CREATE_BROKER,
    Permissions.EDIT_BROKER,
    Permissions.EDIT_OWN_PROFILE,
    Permissions.VIEW_COMMISSIONS,
    Permissions.CREATE_COMMISSION,
    Permissions.APPROVE_COMMISSION,
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_AGENCY_DASHBOARD,
  ],
  [UserRole.SYSTEM_ADMIN]: [
    Permissions.VIEW_AGENCIES,
    Permissions.CREATE_AGENCY,
    Permissions.EDIT_AGENCY,
    Permissions.VIEW_BROKERS,
    Permissions.CREATE_BROKER,
    Permissions.EDIT_BROKER,
    Permissions.EDIT_OWN_PROFILE,
    Permissions.VIEW_COMMISSIONS,
    Permissions.CREATE_COMMISSION,
    Permissions.APPROVE_COMMISSION,
    Permissions.MANAGE_PRODUCTS,
    Permissions.MANAGE_COMMISSION_STRUCTURES,
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_AGENCY_DASHBOARD,
    Permissions.VIEW_SYSTEM_DASHBOARD,
  ],
};

// Check if a role has a specific permission
export function hasPermission(role: UserRole | string | null | undefined, permission: string): boolean {
  if (!role) return false;
  
  const userRole = role as UserRole;
  return rolePermissions[userRole]?.includes(permission) || false;
}

// Check if a user can access a specific broker's data
export function canAccessBroker(
  currentUser: { id: number; role: string; agencyId?: number | null },
  targetBrokerId: number,
  targetBrokerAgencyId?: number | null
): boolean {
  // System admins can access all brokers
  if (currentUser.role === UserRole.SYSTEM_ADMIN) {
    return true;
  }
  
  // Agency admins can access brokers in their agency
  if (
    currentUser.role === UserRole.AGENCY_ADMIN && 
    currentUser.agencyId && 
    targetBrokerAgencyId === currentUser.agencyId
  ) {
    return true;
  }
  
  // Brokers can only access themselves
  if (currentUser.role === UserRole.BROKER && currentUser.id === targetBrokerId) {
    return true;
  }
  
  return false;
}

// Check if a user can access a specific agency's data
export function canAccessAgency(
  currentUser: { role: string; agencyId?: number | null },
  targetAgencyId: number
): boolean {
  // System admins can access all agencies
  if (currentUser.role === UserRole.SYSTEM_ADMIN) {
    return true;
  }
  
  // Agency admins and brokers can only access their own agency
  if (
    (currentUser.role === UserRole.AGENCY_ADMIN || currentUser.role === UserRole.BROKER) && 
    currentUser.agencyId === targetAgencyId
  ) {
    return true;
  }
  
  return false;
}