// User role type
export type UserRole = 'admin' | 'system_admin' | 'agency_admin' | 'broker';

// Permission type
export type Permission = 
  | 'view_dashboard'
  | 'view_commissions'
  | 'edit_commissions'
  | 'view_brokers'
  | 'edit_brokers'
  | 'view_agencies'
  | 'edit_agencies'
  | 'manage_products'
  | 'manage_commission_structures'
  | 'view_reports'
  | 'manage_system_settings';

// Permission mapping by role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view_dashboard',
    'view_commissions',
    'edit_commissions',
    'view_brokers', 
    'edit_brokers',
    'view_agencies',
    'edit_agencies',
    'manage_products',
    'manage_commission_structures',
    'view_reports',
    'manage_system_settings'
  ],
  system_admin: [
    'view_dashboard',
    'view_commissions',
    'edit_commissions',
    'view_brokers', 
    'edit_brokers',
    'view_agencies',
    'edit_agencies',
    'manage_products',
    'manage_commission_structures',
    'view_reports'
  ],
  agency_admin: [
    'view_dashboard',
    'view_commissions',
    'edit_commissions',
    'view_brokers',
    'view_agencies',
    'edit_agencies',
    'view_reports'
  ],
  broker: [
    'view_dashboard',
    'view_commissions',
    'view_reports'
  ]
};

// Helper function to check if a role has a specific permission
export function hasRolePermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}