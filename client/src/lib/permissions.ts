// Define permissions as constants to avoid typos
export const Permissions = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_COMMISSIONS: 'view_commissions',
  EDIT_COMMISSIONS: 'edit_commissions',
  VIEW_BROKERS: 'view_brokers',
  EDIT_BROKERS: 'edit_brokers',
  VIEW_AGENCIES: 'view_agencies',
  EDIT_AGENCIES: 'edit_agencies',
  MANAGE_PRODUCTS: 'manage_products',
  MANAGE_COMMISSION_STRUCTURES: 'manage_commission_structures',
  VIEW_REPORTS: 'view_reports',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
};

// Map roles to their permissions
export const RolePermissions: Record<string, string[]> = {
  admin: Object.values(Permissions),
  system_admin: [
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_COMMISSIONS,
    Permissions.EDIT_COMMISSIONS,
    Permissions.VIEW_BROKERS,
    Permissions.EDIT_BROKERS,
    Permissions.VIEW_AGENCIES,
    Permissions.EDIT_AGENCIES,
    Permissions.MANAGE_PRODUCTS,
    Permissions.MANAGE_COMMISSION_STRUCTURES,
    Permissions.VIEW_REPORTS,
  ],
  agency_admin: [
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_COMMISSIONS,
    Permissions.VIEW_BROKERS,
    Permissions.VIEW_AGENCIES,
    Permissions.VIEW_REPORTS,
  ],
  broker: [
    Permissions.VIEW_DASHBOARD,
    Permissions.VIEW_COMMISSIONS,
  ],
};

// Check if a role has a specific permission
export function hasPermission(role: string, permission: string): boolean {
  if (!role || !permission) return false;
  
  // Admin has all permissions
  if (role === 'admin') return true;
  
  // Check if the role exists and has the permission
  return RolePermissions[role]?.includes(permission) || false;
}