import { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Clock, 
  Target, 
  Briefcase, 
  FolderCheck, 
  Medal,
  TrendingUp,
  Award,
  CalendarCheck
} from 'lucide-react';
import { DashboardLayout } from '@/institutional/components/layout/DashboardLayout';
import { AssignmentSubmissionForm } from '@/institutional/components/forms/AssignmentSubmissionForm';
import { WelcomeOverview } from '@/institutional/components/dashboard/student/WelcomeOverview';
import { AcademicsModule } from '@/institutional/components/dashboard/student/AcademicsModule';
import { ActivitySkillsTracker } from '@/institutional/components/dashboard/student/ActivitySkillsTracker';
import { CareerTwin } from '@/institutional/components/dashboard/student/CareerTwin';
import { Portfolio } from '@/institutional/components/dashboard/student/Portfolio';
import { Gamification } from '@/institutional/components/dashboard/student/Gamification';
import { StudentAttendance } from '@/institutional/pages/attendance/StudentAttendance';
import { Card, CardContent } from '@/institutional/components/ui-ssh/card-ssh';

const studentSidebarItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'academics', label: 'Academics', icon: BookOpen },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'activities', label: 'Skills & Activities', icon: Target },
  { id: 'career', label: 'Career Twin', icon: Briefcase },
  { id: 'portfolio', label: 'Portfolio', icon: FolderCheck },
  { id: 'gamification', label: 'Achievements', icon: Medal },
];

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  const handleFileUpload = () => {
    setShowSubmissionForm(true);
  };

  if (showSubmissionForm) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <AssignmentSubmissionForm onClose={() => setShowSubmissionForm(false)} />
      </div>
    );
  }

  // Quick KPI Cards to show at the top of the Overview tab
  const TopKPIs = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="glass-card hover:-translate-y-1 transition-transform duration-300">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Current GPA</p>
            <h3 className="text-3xl font-bold text-foreground">3.8<span className="text-lg text-muted-foreground">/4.0</span></h3>
          </div>
          <div className="h-12 w-12 bg-student-primary/10 rounded-full flex items-center justify-center text-student-primary">
            <TrendingUp className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
      <Card className="glass-card hover:-translate-y-1 transition-transform duration-300">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Attendance Rate</p>
            <h3 className="text-3xl font-bold text-foreground">94%</h3>
          </div>
          <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
            <CalendarCheck className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
      <Card className="glass-card hover:-translate-y-1 transition-transform duration-300">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Merits</p>
            <h3 className="text-3xl font-bold text-foreground">1,250</h3>
          </div>
          <div className="h-12 w-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
            <Award className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardLayout
      role="student"
      activeId={activeTab}
      onNavigate={setActiveTab}
      sidebarItems={studentSidebarItems}
    >
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Your holistic snapshot of academics, skills, and professional growth.
              </p>
            </div>
            <TopKPIs />
            <WelcomeOverview onUploadClick={handleFileUpload} />
          </>
        )}

        {activeTab === 'academics' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Academic Hub</h1>
              <p className="text-muted-foreground mt-1">Track specific courses, grades, and upcoming deadlines.</p>
            </div>
            <AcademicsModule />
          </>
        )}

        {activeTab === 'attendance' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Attendance Metrics</h1>
              <p className="text-muted-foreground mt-1">Detailed logs of your presence across all classes.</p>
            </div>
            <StudentAttendance />
          </>
        )}

        {activeTab === 'activities' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Skills & Activities</h1>
              <p className="text-muted-foreground mt-1">Log extracurriculars and watch your skill cluster grow.</p>
            </div>
            <ActivitySkillsTracker />
          </>
        )}

        {activeTab === 'career' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Career Twin</h1>
              <p className="text-muted-foreground mt-1">AI-driven insights analyzing your readiness against industry benchmarks.</p>
            </div>
            <CareerTwin />
          </>
        )}

        {activeTab === 'portfolio' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Verified Portfolio</h1>
              <p className="text-muted-foreground mt-1">Your indisputable proof-of-work, stored securely on-chain.</p>
            </div>
            <Portfolio />
          </>
        )}

        {activeTab === 'gamification' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
              <p className="text-muted-foreground mt-1">Unlock badges, climb leaderboards, and gather merits.</p>
            </div>
            <Gamification />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}