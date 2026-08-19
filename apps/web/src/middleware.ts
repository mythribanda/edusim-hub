import { supabase } from '@/lib/supabase';

export async function middleware(pathname: string, navigate: (opts: { to: string }) => void) {
  const { data: { session } } = await supabase.auth.getSession();

  const isPublicRoute = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname);

  if (!session) {
    if (!isPublicRoute) {
      navigate({ to: '/login' });
    }
    return null;
  }

  // Retrieve user metadata (role + age_tier) and attach to user
  if (session.user) {
    const role = session.user.user_metadata?.role || 'student';
    const ageTier = session.user.user_metadata?.age_tier || 'primary';

    // Attach user role & age_tier to user context session
    (session.user as any).role = role;
    (session.user as any).age_tier = ageTier;

    if (isPublicRoute) {
      navigate({ to: '/dashboard' });
    }
  }

  return session;
}
