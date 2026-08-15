import React, { createContext, useContext } from 'react';
import { useAuth as useAuthHook, User } from '@/hooks/useAuth';

interface AuthContextType {
  user: User | null;
  role: string | null;
  isLoading: boolean;
  login: (email: string, password: any, role?: string) => Promise<boolean>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthHook();

  return (
    <AuthContext.Provider value={auth}>
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
