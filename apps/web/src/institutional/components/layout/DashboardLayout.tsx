import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Menu, X, Bell, User, LayoutDashboard, ChevronRight } from 'lucide-react';
import { useAuth, UserRole } from '@/institutional/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/institutional/components/ui-ssh/avatar-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { ThemeToggle } from '@/institutional/components/ThemeToggle';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  role: UserRole;
  activeId: string;
  onNavigate: (id: string) => void;
  sidebarItems: SidebarItem[];
  children: React.ReactNode;
}

export function DashboardLayout({
  role,
  activeId,
  onNavigate,
  sidebarItems,
  children
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const handleNavClick = (id: string) => {
    onNavigate(id);
    if (isMobile) setSidebarOpen(false);
  };

  const activeLink = sidebarItems.find(item => item.id === activeId);

  // Theming colors based on role
  const roleThemes: Record<UserRole, string> = {
    student: 'bg-student-primary/10 text-student-primary',
    faculty: 'bg-faculty-primary/10 text-faculty-primary',
    admin: 'bg-admin-primary/10 text-admin-primary',
    government: 'bg-government-primary/10 text-government-primary',
    parent: 'bg-student-primary/10 text-student-primary'
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      
      {/* Dynamic Overlay for Mobile Sidebar */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
 
      {/* Sidebar Navigation */}
      <AnimatePresence>
        {(sidebarOpen || !isMobile) && (
          <motion.div
            initial={isMobile ? { x: -300 } : undefined}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -300 } : undefined}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={`
              fixed lg:static top-0 left-0 z-50 h-full w-[280px] shrink-0
              flex flex-col bg-card/60 backdrop-blur-2xl border-r border-border/40
              shadow-[4px_0_24px_rgba(0,0,0,0.02)]
            `}
          >
            {/* Sidebar Branding / Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-border/20">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl ${roleThemes[role]}`}>
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-bold text-lg tracking-tight">Holistic Hub</h2>
                  <p className="text-xs text-muted-foreground font-medium capitalize">{role} Portal</p>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Menu
              </p>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-primary text-primary-foreground font-semibold shadow-md translate-x-1' 
                        : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground font-medium'}
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-5 w-5 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sidebar Logout Footer */}
            <div className="p-4 border-t border-border/20">
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors font-medium"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        
        {/* Ambient Top Glow for modern SaaS feel */}
        <div className={`absolute top-0 left-0 right-0 h-64 opacity-5 pointer-events-none blur-3xl ${
          role === 'student' ? 'bg-blue-500' : 
          role === 'faculty' ? 'bg-purple-500' : 
          role === 'admin' ? 'bg-red-500' : 'bg-emerald-500'
        }`} />

        {/* Sticky Navbar (Glassmorphic) */}
        <header className="h-20 shrink-0 sticky top-0 z-30 flex items-center justify-between px-6 bg-background/70 backdrop-blur-xl border-b border-border/40">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center text-sm font-medium text-muted-foreground">
              <span className="capitalize">{role}</span>
              <ChevronRight className="h-4 w-4 mx-2 opacity-50" />
              <span className="text-foreground">{activeLink?.label}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-background" />
            </Button>

            <ThemeToggle />

            <div className="flex items-center space-x-3 pl-4 border-l border-border/40">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold">{user?.name || "Welcome Back"}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role || role}</p>
              </div>
              <Avatar className={`h-9 w-9 border ring-2 ring-background ring-offset-1 ${
                role === 'student' ? 'ring-offset-blue-500/20' : 
                role === 'faculty' ? 'ring-offset-purple-500/20' : 
                role === 'admin' ? 'ring-offset-rose-500/20' : 'ring-offset-emerald-500/20'
              }`}>
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || role}`} />
                <AvatarFallback>
                  <User className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content Wrapper */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto min-h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="pb-12"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
