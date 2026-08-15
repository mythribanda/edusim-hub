import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setRole(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await api.get<User>('/api/me');
      setUser(data);
      setRole(data.role);
    } catch (err) {
      console.error('Failed to fetch current user profile:', err);
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: any, role?: string) => {
    setIsLoading(true);
    try {
      const response = await api.post<{ access_token: string; refresh_token: string; user: User }>(
        '/api/auth/login',
        { email, password }
      );
      
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);
      
      setUser(response.user);
      setRole(response.user.role);
      setIsLoading(false);
      return true;
    } catch (err) {
      setIsLoading(false);
      console.error('Login failed:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('edusim-auth');
    setUser(null);
    setRole(null);
    window.location.href = '/login';
  };

  return {
    user,
    role,
    isLoading,
    login,
    logout,
    fetchUser
  };
}
