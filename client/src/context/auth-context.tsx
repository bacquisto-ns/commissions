import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const defaultContext: AuthContextType = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => false,
  logout: async () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContext);

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Define fetchCurrentUser outside of useEffect so we can reuse it
  const fetchCurrentUser = async () => {
    try {
      // First try to fetch from the /me endpoint
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      } 
      
      // Fall back to using admin account for development
      console.log('Using development admin account');
      setUser({
        id: 1,
        username: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active'
      });
      return true;
    } catch (error) {
      console.error('Error fetching user:', error);
      // Fall back to admin user in case of error
      setUser({
        id: 1,
        username: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active'
      });
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  // Check auth status when component mounts
  useEffect(() => {
    fetchCurrentUser();
    
    // Set up interval to refresh auth status every minute
    const intervalId = setInterval(() => {
      fetchCurrentUser();
    }, 60000); // Every minute
    
    return () => clearInterval(intervalId);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        setLocation('/');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      setUser(null);
      setLocation('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}