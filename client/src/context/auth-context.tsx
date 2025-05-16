import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserRole, Permissions, hasPermission } from '@/lib/permissions';
import { useLocation, useRoute } from 'wouter';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (brokerId: number) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isAuthenticated: boolean;
}

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  agencyId: number | null;
  agencyName?: string;
  image?: string;
  permissions?: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get stored auth from localStorage
const getStoredAuth = (): User | null => {
  const stored = localStorage.getItem('auth_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored auth', e);
      localStorage.removeItem('auth_user');
    }
  }
  return null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage
  const [user, setUser] = useState<User | null>(getStoredAuth());
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Use this query to check if the session is valid on page load
  const { data, isLoading, error } = useQuery<User>({
    queryKey: ['/api/brokers/me'],
    retry: false,
    // Only run if we already have a user (to verify token validity) or if we're loading from localStorage
    enabled: !!user || !!getStoredAuth(),
    // Handle 401 Unauthorized errors
    onError: () => {
      // If there's an auth error, clear the user state and localStorage
      setUser(null);
      localStorage.removeItem('auth_user');
    }
  });

  // Store auth state in localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }, [user]);

  // Update user when data changes (backend verification)
  useEffect(() => {
    if (data) {
      // Determine role based on broker ID
      let role = UserRole.BROKER;
      
      // Admin (ID 13)
      if (data.id === 13) {
        role = UserRole.ADMIN;
      }
      // System admin (ID 10)
      else if (data.id === 10) {
        role = UserRole.SYSTEM_ADMIN;
      } 
      // Agency admin (ID 7)
      else if (data.id === 7) {
        role = UserRole.AGENCY_ADMIN;
      }
      
      const userWithRole = {
        ...data,
        role,
      };
      setUser(userWithRole);
    }
  }, [data]);

  // Login function that authenticates the user
  const login = async (username: string, password: string) => {
    console.log("Login attempted with:", username);
    
    try {
      // Clear any existing user data first to ensure clean state
      setUser(null);
      localStorage.removeItem('auth_user');
      
      // Make API request to backend
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Include cookies for session
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.user) {
        throw new Error('Invalid response from server');
      }
      
      console.log("Login successful:", data.user);
      
      // Transform server role to UserRole enum
      let role = UserRole.BROKER;
      switch (data.user.role) {
        case 'admin':
          role = UserRole.ADMIN;
          break;
        case 'system_admin':
          role = UserRole.SYSTEM_ADMIN;
          break;
        case 'agency_admin':
          role = UserRole.AGENCY_ADMIN;
          break;
        default:
          role = UserRole.BROKER;
      }
      
      const userData: User = {
        ...data.user,
        role
      };
      
      // Update user state
      console.log("Setting user data:", userData);
      setUser(userData);
      
      // Store in localStorage
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      // Redirect to dashboard
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    console.log("Logging out");
    
    try {
      // Call logout endpoint
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error("Logout API error:", error);
    }
    
    // Always clear client-side data regardless of API success
    // Clear user data
    setUser(null);
    
    // Clear localStorage
    localStorage.removeItem('auth_user');
    
    // Clear cached queries
    queryClient.clear();
    
    // Redirect to login after a small delay to ensure state updates
    setTimeout(() => {
      console.log("Redirecting to login");
      navigate("/login");
    }, 100);
  };

  // Check if user has a specific permission
  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  // Switch to a different broker ID (for demo purposes)
  const switchRole = async (brokerId: number) => {
    try {
      // Fetch broker info based on ID
      const response = await fetch(`/api/brokers/${brokerId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch broker with ID ${brokerId}`);
      }
      
      const brokerData = await response.json();
      
      // Determine role based on broker ID
      let role = UserRole.BROKER;
      if (brokerId === 13) {
        role = UserRole.ADMIN;
      } else if (brokerId === 10) {
        role = UserRole.SYSTEM_ADMIN;
      } else if (brokerId === 7) {
        role = UserRole.AGENCY_ADMIN;
      }
      
      // Set user with proper role
      setUser({
        ...brokerData,
        role,
      });
      
      // Redirect to dashboard
      navigate("/");
    } catch (error) {
      console.error("Error switching roles:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      error, 
      login, 
      logout, 
      switchRole,
      hasPermission: checkPermission,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}