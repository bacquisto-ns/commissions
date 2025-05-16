// Use type directly since it's a simple string union
export type UserRole = 'admin' | 'system_admin' | 'agency_admin' | 'broker';

// This is a simple permanent user system for the application
// In a real application, these users would be stored in a database

export interface SystemUser {
  id: number;
  username: string;
  password: string;  // In a real app, this would be hashed
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

// Pre-defined system users (admin only for now)
export const SYSTEM_USERS: SystemUser[] = [
  {
    id: 999,  // Use a unique ID that won't conflict with broker IDs
    username: "admin", 
    password: "admin123",  // This would be hashed in a real application
    firstName: "System",
    lastName: "Administrator",
    email: "admin@example.com",
    role: "admin",
    isActive: true
  }
];

// Authenticate against the system users
export function authenticateSystemUser(username: string, password: string): SystemUser | null {
  // Make username case-insensitive
  const normalizedUsername = username.toLowerCase();
  
  // Find user with matching username
  const user = SYSTEM_USERS.find(u => 
    u.username.toLowerCase() === normalizedUsername && 
    u.isActive
  );
  
  // Check if user exists and password matches
  if (user && user.password === password) {
    return user;
  }
  
  // Authentication failed
  return null;
}

// Validate a user exists by ID
export function getSystemUserById(id: number): SystemUser | null {
  return SYSTEM_USERS.find(u => u.id === id && u.isActive) || null;
}

// Check if a user has specific permission
export function hasPermission(user: SystemUser, permission: string): boolean {
  // Admin has all permissions
  if (user.role === 'admin') {
    return true;
  }
  
  // System admin has most permissions
  if (user.role === 'system_admin') {
    return permission !== 'manage_system_settings';
  }
  
  // Agency admin has agency-related permissions
  if (user.role === 'agency_admin') {
    return [
      'view_dashboard',
      'view_commissions',
      'edit_commissions',
      'view_brokers',
      'view_agencies',
      'edit_agencies'
    ].includes(permission);
  }
  
  // Regular broker has limited permissions
  if (user.role === 'broker') {
    return [
      'view_dashboard',
      'view_commissions'
    ].includes(permission);
  }
  
  return false;
}