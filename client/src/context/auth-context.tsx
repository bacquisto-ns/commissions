import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserRole } from '@/lib/permissions';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  const { data, isLoading, error } = useQuery<User>({
    queryKey: ['/api/brokers/me'],
    retry: false,
    // User this to control when the query is run
    // initialData: { role: UserRole.SYSTEM_ADMIN } as User,
  });

  // Update user when data changes
  useEffect(() => {
    if (data) {
      // Default to broker role if none is set
      const userWithRole = {
        ...data,
        role: data.role || UserRole.BROKER,
      };
      setUser(userWithRole);
    }
  }, [data]);

  // Login function
  const login = async (username: string, password: string) => {
    // In a real app, this would make a request to your backend
    // For now, we'll just set a demo user
    setUser({
      id: 7,
      username: 'sarahjohnson',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah@example.com',
      role: UserRole.BROKER,
      agencyId: 1,
    });
  };

  // Logout function
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
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