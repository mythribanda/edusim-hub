import { supabase } from '@/institutional/lib-ssh/supabase';
import type { Database } from '@/institutional/lib-ssh/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];

const isMockMode = () =>
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co';

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', user_id: 'mock', title: 'New assignment posted', message: 'Mathematics – Due in 3 days', type: 'info', read: false, action_url: null, created_at: new Date(Date.now() - 2 * 60000).toISOString() },
  { id: '2', user_id: 'mock', title: 'Grade updated', message: 'Physics Lab Report – A+', type: 'success', read: false, action_url: null, created_at: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: '3', user_id: 'mock', title: 'Attendance warning', message: 'Low attendance – Operating Systems (67%)', type: 'warning', read: false, action_url: '/attendance/student', created_at: new Date(Date.now() - 3 * 60 * 60000).toISOString() },
];

export const notificationService = {
  /** Fetch all notifications for the current user. */
  async getNotifications(userId: string): Promise<Notification[]> {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 300));
      return MOCK_NOTIFICATIONS;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /** Count unread notifications. */
  async getUnreadCount(userId: string): Promise<number> {
    if (isMockMode()) return MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  /** Mark a single notification as read. */
  async markAsRead(notificationId: string): Promise<void> {
    if (isMockMode()) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw new Error(error.message);
  },

  /** Mark all notifications as read for a user. */
  async markAllAsRead(userId: string): Promise<void> {
    if (isMockMode()) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw new Error(error.message);
  },

  /**
   * Subscribe to real-time notifications for a user.
   * Returns an unsubscribe function.
   */
  subscribeToNotifications(userId: string, onNew: (n: Notification) => void): () => void {
    if (isMockMode()) return () => {};

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => onNew(payload.new as Notification)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },
};
