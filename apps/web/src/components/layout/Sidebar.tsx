import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  User,
  Settings,
  Sparkles,
  GraduationCap,
  ChevronLeft,
  LogOut,
  Atom,
  Plus,
  LineChart,
  BarChart3,
  Users,
  BookOpen,
  FlaskConical,
  FileText,
  Calendar,
  ClipboardList,
  Building,
  MessageSquare,
  ClipboardCheck,
  Activity,
  CalendarDays,
} from "lucide-react";
import { useSidebarStore } from "@/store/useSidebarStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/useAuthStore";
import { meetsMinTier } from "@edusim/rbac";

interface SidebarItem {
  to: string;
  label: string;
  icon: any;
  roles: string[];
}

const navItems: SidebarItem[] = [
  // EduSim features
  { to: '/dashboard', label: 'Dashboard', icon: Home, roles: ['student', 'faculty', 'teacher', 'educator', 'admin', 'parent'] },
  { to: '/class-feed', label: 'Class Feed', icon: MessageSquare, roles: ['student', 'faculty', 'teacher', 'educator', 'admin'] },
  { to: '/simulations', label: 'Simulations', icon: Atom, roles: ['student', 'faculty', 'teacher', 'educator', 'admin'] },
  { to: '/simulations/create', label: 'Create Simulation', icon: Plus, roles: ['faculty', 'teacher', 'educator', 'admin'] },
  { to: '/formula-lab', label: 'Formula Lab', icon: FlaskConical, roles: ['student', 'faculty', 'teacher', 'educator', 'admin'] },
  { to: '/tutor', label: 'AI Tutor', icon: GraduationCap, roles: ['student', 'faculty', 'educator', 'admin'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['faculty', 'teacher', 'educator', 'admin'] },
  
  // Teacher Portal features (merged)
  { to: '/teacher/assignments', label: 'Create Assignment', icon: Plus, roles: ['faculty', 'teacher', 'educator', 'admin'] },
  { to: '/teacher/grading', label: 'Grading Center', icon: ClipboardCheck, roles: ['faculty', 'teacher', 'educator', 'admin'] },
  { to: '/teacher/monitoring', label: 'Class Monitor', icon: Activity, roles: ['faculty', 'teacher', 'educator', 'admin'] },
  { to: '/teacher/feed', label: 'Teacher Feed', icon: MessageSquare, roles: ['faculty', 'teacher', 'educator', 'admin'] },
  { to: '/teacher/attendance', label: 'Mark Attendance', icon: CalendarDays, roles: ['faculty', 'teacher', 'educator', 'admin'] },

  // SSH features
  { to: '/resources', label: 'Resources', icon: BookOpen, roles: ['student', 'faculty', 'teacher', 'educator', 'admin', 'parent'] },
  { to: '/notes', label: 'Notes', icon: FileText, roles: ['student', 'faculty', 'educator', 'admin'] },
  { to: '/attendance', label: 'Attendance', icon: Calendar, roles: ['faculty', 'teacher', 'admin', 'parent'] },
  { to: '/curriculum', label: 'Curriculum', icon: ClipboardList, roles: ['faculty', 'teacher', 'admin'] },
  
  // Admin only
  { to: '/admin/users', label: 'User Management', icon: Users, roles: ['admin'] },
  { to: '/institutions', label: 'Institutions', icon: Building, roles: ['admin'] },
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { isCollapsed, toggleSidebar, isMobileOpen, setMobileOpen } = useSidebarStore();
  const { logout, user } = useAuthStore();
  
  const userRole = user?.role || "student";
  let items = navItems.filter((item) => item.roles.includes(userRole));
  if (userRole === "student" && user?.age_tier) {
    if (!meetsMinTier(user.age_tier, "middle")) {
      items = items.filter((item) => item.to !== "/class-feed");
    }
  }

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 },
  };

  return (
    <TooltipProvider delayDuration={0}>
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-[35] bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className={`fixed inset-y-0 left-0 z-[60] flex flex-col bg-background/80 backdrop-blur-2xl border-r border-border/20 shadow-2xl overflow-hidden transition-colors duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center h-20 px-5 mb-4 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-blue)] flex items-center justify-center glow-purple">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold tracking-tight text-gradient whitespace-nowrap"
              >
                EduSim
              </motion.span>
            )}
          </Link>
        </div>

        {user && !isCollapsed && (
          <div className="px-5 mb-6">
            <div className="p-3.5 rounded-2xl bg-secondary/35 border border-border/10 flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-blue)] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : "?")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground truncate">
                  {user.name || (user.email ? user.email.split("@")[0] : "User")}
                </div>
                <div className="flex mt-1">
                  <span className={`text-[10px] uppercase font-mono font-extrabold px-2 py-0.5 rounded-full ${
                    user.role === "admin"
                      ? "bg-red-500/10 text-red-500 border border-red-500/20"
                      : user.role === "educator" || user.role === "faculty" || user.role === "teacher"
                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4">
          {items.map((it) => {
            const active = it.to === "/dashboard" ? (path === "/" || path === "/dashboard") : path.startsWith(it.to);
            const Icon = it.icon;

            const NavLink = (
              <Link
                key={it.to}
                to={it.to}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center h-12 rounded-2xl transition-all duration-300 ${
                  active
                    ? "bg-secondary text-primary font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                   <Icon className={`w-5 h-5 transition-all duration-300 ${active ? "text-primary scale-110 drop-shadow-[0_0_8px_var(--primary)]" : "group-hover:scale-110"}`} />
                </div>
                
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[15px] font-medium whitespace-nowrap overflow-hidden pr-4"
                  >
                    {it.label}
                  </motion.span>
                )}

                {active && (
                  <motion.div 
                    layoutId="active-nav-indicator"
                    className="absolute right-2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]"
                  />
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={it.to}>
                  <TooltipTrigger asChild>
                    <div className="w-full">{NavLink}</div>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={15} className="font-medium text-sm bg-card border border-border text-foreground shadow-md px-3 py-1.5">
                    {it.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavLink;
          })}
        </nav>

        <div className="p-4 mt-auto space-y-2 border-t border-border/10">
           {isCollapsed ? (
             <Tooltip>
               <TooltipTrigger asChild>
                 <button 
                   onClick={toggleSidebar}
                   className="w-full flex items-center h-12 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-300 group"
                 >
                   <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                     <ChevronLeft className="w-5 h-5 rotate-180" />
                   </div>
                 </button>
               </TooltipTrigger>
               <TooltipContent side="right" sideOffset={15} className="font-medium text-sm bg-card border border-border text-foreground shadow-md px-3 py-1.5">
                 Expand
               </TooltipContent>
             </Tooltip>
           ) : (
             <button 
               onClick={toggleSidebar}
               className="w-full flex items-center h-12 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-300 group"
             >
               <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                 <ChevronLeft className="w-5 h-5" />
               </div>
               <span className="text-[15px] font-medium">Collapse</span>
             </button>
           )}

           {isCollapsed ? (
             <Tooltip>
               <TooltipTrigger asChild>
                 <button 
                   onClick={logout}
                   className="w-full flex items-center h-12 rounded-2xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group"
                 >
                   <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                     <LogOut className="w-5 h-5" />
                   </div>
                 </button>
               </TooltipTrigger>
               <TooltipContent side="right" sideOffset={15} className="font-medium text-sm bg-card border border-border text-foreground shadow-md px-3 py-1.5">
                 Logout
               </TooltipContent>
             </Tooltip>
           ) : (
             <button 
               onClick={logout}
               className="w-full flex items-center h-12 rounded-2xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group"
             >
               <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                 <LogOut className="w-5 h-5" />
               </div>
               <span className="text-[15px] font-medium">Logout</span>
             </button>
           )}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
