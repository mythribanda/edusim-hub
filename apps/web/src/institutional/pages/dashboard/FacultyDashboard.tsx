import { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  FileCheck, 
  MessageCircle, 
  BarChart3,
  Bell,
  User,
  GraduationCap,
  CalendarCheck,
  ClipboardList
} from 'lucide-react';

import { DashboardLayout } from '@/institutional/components/layout/DashboardLayout';
import { AttendanceManagement } from '@/institutional/components/dashboard/faculty/AttendanceManagement';
import { SubmissionApprovalPanel } from '@/institutional/components/dashboard/faculty/SubmissionApprovalPanel';
import { ClassAnalytics } from '@/institutional/components/dashboard/faculty/ClassAnalytics';
import { WelcomeOverview } from '@/institutional/components/dashboard/faculty/WelcomeOverview';
import { MyClasses } from '@/institutional/components/dashboard/faculty/MyClasses';
import { CommunicationTools } from '@/institutional/components/dashboard/faculty/CommunicationTools';
import { FacultyProfile } from '@/institutional/components/dashboard/faculty/FacultyProfile';
import { Card, CardContent } from '@/institutional/components/ui-ssh/card-ssh';

const facultySidebarItems = [
  { id: 'overview', label: 'Overview', icon: Users },
  { id: 'academics', label: 'Academics', icon: BookOpen },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'approvals', label: 'Approvals', icon: FileCheck },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const TopKPIs = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="glass-card hover:-translate-y-1 transition-transform duration-300">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Students</p>
            <h3 className="text-3xl font-bold text-foreground">145</h3>
          </div>
          <div className="h-12 w-12 bg-faculty-primary/10 rounded-full flex items-center justify-center text-faculty-primary">
            <Users className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
      <Card className="glass-card hover:-translate-y-1 transition-transform duration-300">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Pending Approvals</p>
            <h3 className="text-3xl font-bold text-foreground">12</h3>
          </div>
          <div className="h-12 w-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
            <ClipboardList className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
      <Card className="glass-card hover:-translate-y-1 transition-transform duration-300">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Avg Class Attendance</p>
            <h3 className="text-3xl font-bold text-foreground">88%</h3>
          </div>
          <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
            <BarChart3 className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardLayout
      role="faculty"
      activeId={activeTab}
      onNavigate={setActiveTab}
      sidebarItems={facultySidebarItems}
    >
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Faculty Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your classes, students, and institutional responsibilities.</p>
            </div>
            <TopKPIs />
            <WelcomeOverview />
          </>
        )}

        {activeTab === 'academics' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
              <p className="text-muted-foreground mt-1">Schedules, curriculum planning, and active teaching loads.</p>
            </div>
            <MyClasses />
          </>
        )}

        {activeTab === 'attendance' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
              <p className="text-muted-foreground mt-1">Record and track student presence in real-time.</p>
            </div>
            <AttendanceManagement />
          </>
        )}

        {activeTab === 'approvals' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Action Items</h1>
              <p className="text-muted-foreground mt-1">Pending student submissions requiring your review.</p>
            </div>
            <SubmissionApprovalPanel />
          </>
        )}

        {activeTab === 'reports' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Class Analytics</h1>
              <p className="text-muted-foreground mt-1">Deep insights into student performance and aggregated metrics.</p>
            </div>
            <ClassAnalytics />
          </>
        )}

        {activeTab === 'notifications' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
              <p className="text-muted-foreground mt-1">Broadcast announcements to your classes and manage alerts.</p>
            </div>
            <CommunicationTools />
          </>
        )}

        {activeTab === 'profile' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Faculty Profile</h1>
              <p className="text-muted-foreground mt-1">Manage your academic credentials and preferences.</p>
            </div>
            <FacultyProfile />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}