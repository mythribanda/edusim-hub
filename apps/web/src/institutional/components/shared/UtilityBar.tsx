import { useEffect, useState } from 'react';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { ThemeToggle } from '@/institutional/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/institutional/components/ui-ssh/dropdown-menu-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import {
  Bell,
  LogOut,
  User,
  ArrowLeft,
  Settings,
  UserCircle,
  CheckCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from '@tanstack/react-router';
import { toast } from '@/institutional/hooks-ssh/use-toast';
import { notificationService } from '@/institutional/services-ssh/notificationService';
import type { Database } from '@/institutional/lib-ssh/database.types';
import { formatDistanceToNow } from 'date-fns';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface UtilityBarProps {
  userRole: 'student' | 'faculty' | 'admin' | 'government';
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export const UtilityBar = ({ userRole, showBackButton = true, onBackClick }: UtilityBarProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  // ── Load notifications ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    notificationService.getNotifications(user.id).then(setNotifications).catch(() => {});

    // Subscribe to real-time notifications
    const unsub = notificationService.subscribeToNotifications(user.id, (n) =>
      setNotifications((prev) => [n, ...prev])
    );
    return unsub;
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    navigate({ to: '/institutional' });
    toast({ title: 'Logged out successfully', description: 'See you next time!' });
  };

  const handleBack = () => {
    if (onBackClick) { onBackClick(); } else { window.history.back(); }
  };

  // ── Role styling ──────────────────────────────────────────────────────────
  const roleColor: Record<string, string> = {
    student:    'text-student-primary',
    faculty:    'text-faculty-primary',
    admin:      'text-admin-primary',
    government: 'text-government-primary',
  };

  const roleGradient: Record<string, string> = {
    student:    'gradient-student',
    faculty:    'gradient-faculty',
    admin:      'gradient-admin',
    government: 'gradient-government',
  };

  const roleLabel: Record<string, string> = {
    student:    'Student Portal',
    faculty:    'Faculty Dashboard',
    admin:      'Admin Portal',
    government: 'Government Portal',
  };

  return (
    <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">

          {/* Left – back button + title */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="hover:bg-muted/50">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg ${roleGradient[userRole]} flex items-center justify-center`}>
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className={`text-lg font-bold ${roleColor[userRole]}`}>
                  {roleLabel[userRole]}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Right – notifications, profile, theme */}
          <div className="flex items-center space-x-2">

            {/* Notifications */}
            <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative hover:bg-muted/50" id="notification-bell">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-popover/95 backdrop-blur-sm border shadow-lg">
                <div className="p-3 border-b flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      {unreadCount} unread
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleMarkAllRead}
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className={`p-4 cursor-pointer flex items-start gap-2 ${!n.read ? 'bg-muted/30' : ''}`}
                        onClick={async () => {
                          await notificationService.markAsRead(n.id);
                          setNotifications((prev) =>
                            prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                          );
                          if (n.action_url) navigate({ to: n.action_url as any });
                          setNotifOpen(false);
                        }}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.type === 'warning' ? 'bg-warning' :
                          n.type === 'success' ? 'bg-success' :
                          n.type === 'error'   ? 'bg-destructive' : 'bg-student-primary'
                        }`} />
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>

                <div className="p-2 border-t">
                  <Button variant="ghost" size="sm" className="w-full justify-center text-xs">
                    View all notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-muted/50" id="user-profile-menu">
                  <UserCircle className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover/95 backdrop-blur-sm border shadow-lg">
                <div className="p-3 border-b">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{userRole}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuItem className="cursor-pointer">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                  id="logout-btn"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
};