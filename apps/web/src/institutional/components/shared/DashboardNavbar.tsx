import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { ThemeToggle } from '@/institutional/components/ThemeToggle';
import { 
  BookOpen, 
  Users, 
  Shield, 
  Building, 
  LogOut,
  Bell,
  Settings,
  BarChart3,
  Calendar,
  GraduationCap,
  Trophy,
  Briefcase,
  User,
  FileText,
  CheckSquare,
  TrendingUp,
  Globe,
  Award,
  Database
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { toast } from '@/institutional/hooks-ssh/use-toast';
import { cn } from '@/lib/utils';

interface DashboardNavbarProps {
  role: 'student' | 'faculty' | 'admin' | 'government';
}

const roleConfig = {
  student: {
    icon: BookOpen,
    title: 'Student Portal',
    gradient: 'gradient-student',
    textGradient: 'text-gradient-student',
    navItems: [
      { label: 'Dashboard', path: '/student/dashboard', icon: BarChart3 },
      { label: 'Academics', path: '/student/academics', icon: BookOpen },
      { label: 'Attendance', path: '/student/attendance', icon: Calendar },
      { label: 'Skills & Activities', path: '/student/activities', icon: Trophy },
      { label: 'Career Twin', path: '/student/career', icon: Briefcase },
      { label: 'Portfolio', path: '/student/portfolio', icon: User },
      { label: 'Notifications', path: '/student/notifications', icon: Bell }
    ]
  },
  faculty: {
    icon: Users,
    title: 'Faculty Dashboard',
    gradient: 'gradient-faculty',
    textGradient: 'text-gradient-faculty',
    navItems: [
      { label: 'Dashboard', path: '/faculty/dashboard', icon: BarChart3 },
      { label: 'Class Reports', path: '/faculty/reports', icon: FileText },
      { label: 'Attendance', path: '/faculty/attendance', icon: Calendar },
      { label: 'Approvals', path: '/faculty/approvals', icon: CheckSquare },
      { label: 'Notifications', path: '/faculty/notifications', icon: Bell }
    ]
  },
  admin: {
    icon: Shield,
    title: 'Admin Dashboard',
    gradient: 'gradient-admin',
    textGradient: 'text-gradient-admin',
    navItems: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: BarChart3 },
      { label: 'Institution Reports', path: '/admin/reports', icon: FileText },
      { label: 'Attendance Analytics', path: '/admin/attendance', icon: Calendar },
      { label: 'Submissions Approval', path: '/admin/submissions', icon: CheckSquare },
      { label: 'Faculty Performance', path: '/admin/faculty', icon: TrendingUp },
      { label: 'Notifications', path: '/admin/notifications', icon: Bell }
    ]
  },
  government: {
    icon: Building,
    title: 'Government Portal',
    gradient: 'gradient-government',
    textGradient: 'text-gradient-government',
    navItems: [
      { label: 'Dashboard', path: '/government/dashboard', icon: BarChart3 },
      { label: 'Multi-Institution Reports', path: '/government/reports', icon: Globe },
      { label: 'Attendance Monitoring', path: '/government/attendance', icon: Calendar },
      { label: 'Compliance Reports', path: '/government/compliance', icon: Award },
      { label: 'Institution Registry', path: '/government/registry', icon: Database },
      { label: 'Notifications', path: '/government/notifications', icon: Bell }
    ]
  }
};

export function DashboardNavbar({ role }: DashboardNavbarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const config = roleConfig[role];
  const IconComponent = config.icon;

  const handleLogout = () => {
    logout();
    navigate({ to: '/institutional' });
    toast({
      title: "Logged out successfully",
      description: "See you next time!",
    });
  };

  const handleNavigation = (path: string) => {
    navigate({ to: ('/institutional' + path) as any });
  };

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      {/* Top Header */}
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 rounded-xl ${config.gradient} flex items-center justify-center`}>
            <IconComponent className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${config.textGradient}`}>{config.title}</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="border-t bg-muted/20">
        <div className="container mx-auto px-4">
          <nav className="flex items-center space-x-1 overflow-x-auto">
            {config.navItems.map((item) => {
              const NavItemIcon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "text-primary border-b-2 border-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <NavItemIcon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}