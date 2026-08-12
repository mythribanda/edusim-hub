import { supabase } from '@/institutional/lib-ssh/supabase';
import type { UserRole } from '@/institutional/lib-ssh/database.types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// ─── Mock users (used when Supabase is not configured) ───────────────────────
const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
  'student@example.com': {
    password: 'student123',
    user: { id: '1', email: 'student@example.com', name: 'Alex Johnson', role: 'student' },
  },
  'faculty@example.com': {
    password: 'faculty123',
    user: { id: '2', email: 'faculty@example.com', name: 'Dr. Sarah Wilson', role: 'faculty' },
  },
  'admin@example.com': {
    password: 'admin123',
    user: { id: '3', email: 'admin@example.com', name: 'Michael Chen', role: 'admin' },
  },
  'government@example.com': {
    password: 'govt123',
    user: { id: '4', email: 'government@example.com', name: 'Jennifer Davis', role: 'government' },
  },
};

const isMockMode = () =>
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co';

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Sign in with email and password.
   * Falls back to mock mode when Supabase is not configured.
   */
  async login(email: string, password: string, role: UserRole): Promise<AuthUser> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 800)); // simulate latency
      const record = MOCK_USERS[email.toLowerCase()];
      if (!record) throw new Error('Invalid email or password.');
      if (record.user.role !== role)
        throw new Error(`This email is not registered as a ${role}.`);
      return record.user;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    // Fetch the profile to get role & name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) throw new Error('Could not load user profile.');
    if (profile.role !== role) {
      await supabase.auth.signOut();
      throw new Error(`This account is registered as ${profile.role}, not ${role}.`);
    }

    return profile as AuthUser;
  },

  /**
   * Sign out the current user.
   */
  async logout(): Promise<void> {
    if (!isMockMode()) {
      await supabase.auth.signOut();
    }
  },

  /**
   * Get the currently authenticated user from Supabase session.
   * Returns null if not authenticated.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    if (isMockMode()) {
      // In mock mode, read from localStorage
      const stored = localStorage.getItem('ssh_mock_user');
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    }

    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', data.user.id)
      .single();

    return (profile as AuthUser) ?? null;
  },

  /**
   * Persist mock user to localStorage.
   */
  saveMockUser(user: AuthUser | null) {
    if (user) {
      localStorage.setItem('ssh_mock_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ssh_mock_user');
    }
  },
};
