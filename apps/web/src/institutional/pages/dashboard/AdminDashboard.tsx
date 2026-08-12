import { useState } from 'react';
import { DashboardLayout } from '@/institutional/components/layout/DashboardLayout';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Progress } from '@/institutional/components/ui-ssh/progress-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Input } from '@/institutional/components/ui-ssh/input-ssh';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/institutional/components/ui-ssh/select-ssh';
import { Textarea } from '@/institutional/components/ui-ssh/textarea-ssh';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  AlertTriangle,
  TrendingUp,
  Database,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Brain,
  Bell,
  UserCog,
  Building2,
  Download,
  Search,
  GraduationCap,
  BookOpen,
  MessageSquare,
  Send,
  Eye,
  Edit3,
  Filter,
  Calendar,
  Award,
  Zap,
  Target,
  Lock,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/institutional/contexts/AuthContext';

import { UtilityBar } from '@/institutional/components/shared/UtilityBar';
import { ComprehensiveReports } from '@/institutional/components/dashboard/admin/ComprehensiveReports';
import { PredictiveAnalytics } from '@/institutional/components/dashboard/admin/PredictiveAnalytics';
import { useNavigate } from '@tanstack/react-router';
import { toast } from '@/institutional/hooks-ssh/use-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [announcementText, setAnnouncementText] = useState('');
  
  // Mock data - Enhanced for comprehensive admin features
  const [institutionStats] = useState({
    totalStudents: 2400,
    totalFaculty: 120,
    avgAttendance: 78.5,
    pendingApprovals: 15,
    totalDepartments: 8,
    activeClasses: 156,
    graduationRate: 89.2,
    complianceScore: 94.8
  });

  const [departments] = useState([
    { name: 'Computer Science', students: 420, faculty: 28, attendance: 82.3, lowAttendance: 15 },
    { name: 'Electronics', students: 380, faculty: 22, attendance: 75.8, lowAttendance: 28 },
    { name: 'Mechanical', students: 250, faculty: 18, attendance: 79.2, lowAttendance: 12 },
    { name: 'Civil', students: 200, faculty: 17, attendance: 73.5, lowAttendance: 22 },
    { name: 'Business', students: 320, faculty: 15, attendance: 81.1, lowAttendance: 18 },
    { name: 'Arts', students: 180, faculty: 12, attendance: 76.4, lowAttendance: 14 },
    { name: 'Science', students: 290, faculty: 16, attendance: 80.7, lowAttendance: 16 },
    { name: 'Medicine', students: 360, faculty: 22, attendance: 85.2, lowAttendance: 8 }
  ]);

  const [aiAlerts, setAiAlerts] = useState([
    { id: 1, type: 'warning', message: '⚠️ Department of IT has lowest attendance (62%)', time: '2 hours ago', actionable: true },
    { id: 2, type: 'info', message: '📊 Accreditation report draft is ready for review', time: '4 hours ago', actionable: true },
    { id: 3, type: 'prediction', message: '🔮 AI predicts 15% increase in enrollment next semester', time: '1 day ago', actionable: false },
    { id: 4, type: 'success', message: '✅ NAAC compliance score improved to 94.8%', time: '2 days ago', actionable: false }
  ]);

  const [studentRecords] = useState([
    { id: 1, name: 'Alex Johnson', rollNo: 'CS2021001', department: 'Computer Science', year: '3rd', attendance: 85.2, grade: 'A', status: 'Active' },
    { id: 2, name: 'Priya Sharma', rollNo: 'EC2021015', department: 'Electronics', year: '2nd', attendance: 78.5, grade: 'B+', status: 'Active' },
    { id: 3, name: 'David Kim', rollNo: 'ME2020022', department: 'Mechanical', year: '4th', attendance: 92.1, grade: 'A+', status: 'Active' },
    { id: 4, name: 'Sara Wilson', rollNo: 'CS2021045', department: 'Computer Science', year: '3rd', attendance: 67.8, grade: 'C+', status: 'At Risk' }
  ]);

  const [facultyDirectory] = useState([
    { id: 1, name: 'Dr. Sarah Wilson', department: 'Computer Science', subjects: ['Data Structures', 'Algorithms'], experience: '12 years', load: 18 },
    { id: 2, name: 'Prof. Michael Chen', department: 'Electronics', subjects: ['Digital Electronics'], experience: '8 years', load: 16 },
    { id: 3, name: 'Dr. Emily Davis', department: 'Mechanical', subjects: ['Thermodynamics', 'Fluid Mechanics'], experience: '15 years', load: 20 },
    { id: 4, name: 'Prof. Robert Kumar', department: 'Computer Science', subjects: ['Database Management'], experience: '10 years', load: 14 }
  ]);

  const [pendingApprovals, setPendingApprovals] = useState([
    { id: 1, type: 'Activity', title: 'National Science Fair Participation', student: 'Alex Johnson', department: 'Computer Science', submittedDate: '2024-03-15', status: 'Pending Review' },
    { id: 2, type: 'Report', title: 'Research Paper Publication', faculty: 'Dr. Sarah Wilson', department: 'Computer Science', submittedDate: '2024-03-14', status: 'Escalated' },
    { id: 3, type: 'Activity', title: 'Hackathon Winner Certificate', student: 'Priya Sharma', department: 'Electronics', submittedDate: '2024-03-13', status: 'Pending Review' }
  ]);

  const [activeLoaders, setActiveLoaders] = useState<Set<string>>(new Set());

  const withLoader = async (actionId: string, actionFn: () => void) => {
    setActiveLoaders(prev => new Set(prev).add(actionId));
    await new Promise(r => setTimeout(r, 800)); // Simulate networking
    actionFn();
    setActiveLoaders(prev => {
      const newSet = new Set(prev);
      newSet.delete(actionId);
      return newSet;
    });
  };

  const handleSystemAction = (action: string) => {
    withLoader(`sys_${action}`, () => {
      toast({
        title: `System ${action} Initialized`,
        description: `Successfully executed system-level request.`,
      });
    });
  };

  const handleApprovalAction = (id: number, action: 'approve' | 'reject') => {
    withLoader(`approve_${id}`, () => {
      setPendingApprovals(prev => prev.map(item => 
        item.id === id ? { ...item, status: action === 'approve' ? 'Approved' : 'Rejected' } : item
      ));
      toast({
        title: `Decision Synced`,
        description: `Submission has been ${action === 'approve' ? 'approved' : 'rejected'} and securely logged.`,
      });
    });
  };

  const handleExportReport = (type: string) => {
    withLoader(`export_${type}`, () => {
      toast({
        title: "Export Completed",
        description: `${type} analytical report downloaded successfully.`,
      });
    });
  };

  const handleSendAnnouncement = () => {
    if (announcementText.trim()) {
      withLoader('announce', () => {
        toast({
          title: "Announcement Live",
          description: "Your official broadcast has been pushed to your cohorts.",
        });
        setAnnouncementText('');
      });
    }
  };

  const handleDismissAlert = (id: number) => {
    setAiAlerts(prev => prev.filter(a => a.id !== id));
  };

  const filteredStudents = studentRecords.filter(student => 
    (selectedDepartment === 'all' || student.department === selectedDepartment) &&
    (searchTerm === '' || student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredFaculty = facultyDirectory.filter(faculty => 
    (selectedDepartment === 'all' || faculty.department === selectedDepartment) &&
    (searchTerm === '' || faculty.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const adminSidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'academics', label: 'Academics', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: Settings },
  ];

  const TabsContent = ({ value, children, className }: any) => {
    return activeTab === value ? <div className={className}>{children}</div> : null;
  };

  return (
    <DashboardLayout
      role="admin"
      activeId={activeTab}
      onNavigate={setActiveTab}
      sidebarItems={adminSidebarItems}
    >
      <div className="space-y-6">

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Welcome Section */}
            <Card className="glass-card border-admin-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Welcome, Administrator {user?.name || 'Priya Nair'} 👋</h2>
                    <p className="text-muted-foreground mb-4">
                      Comprehensive institutional management and oversight dashboard.
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-admin-primary mr-1" />
                        <span>{institutionStats.totalStudents} Students</span>
                      </div>
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 text-blue-500 mr-1" />
                        <span>{institutionStats.totalFaculty} Faculty</span>
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span>{institutionStats.avgAttendance}% Avg Attendance</span>
                      </div>
                      <div className="flex items-center">
                        <Bell className="h-4 w-4 text-orange-500 mr-1" />
                        <span>{institutionStats.pendingApprovals} Pending</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => handleExportReport('NAAC')}>
                      <FileText className="h-4 w-4 mr-2" />
                      NAAC Report
                    </Button>
                    <Button className="gradient-admin" onClick={() => handleExportReport('NIRF')}>
                      <Download className="h-4 w-4 mr-2" />
                      NIRF Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Institutional Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <h3 className="font-medium">Total Students</h3>
                  </div>
                  <p className="text-2xl font-bold">{institutionStats.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">across {institutionStats.totalDepartments} departments</p>
                  <Progress value={85} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <GraduationCap className="h-5 w-5 text-admin-primary" />
                    <h3 className="font-medium">Total Faculty</h3>
                  </div>
                  <p className="text-2xl font-bold">{institutionStats.totalFaculty}</p>
                  <p className="text-xs text-muted-foreground">active faculty members</p>
                  <Progress value={92} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <h3 className="font-medium">Avg Attendance</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{institutionStats.avgAttendance}%</p>
                  <p className="text-xs text-muted-foreground">institutional average</p>
                  <Progress value={institutionStats.avgAttendance} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-5 w-5 text-purple-500" />
                    <h3 className="font-medium">Compliance Score</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{institutionStats.complianceScore}%</p>
                  <p className="text-xs text-muted-foreground">NAAC accreditation</p>
                  <Progress value={institutionStats.complianceScore} className="mt-2 h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Department Performance Overview */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-admin-primary" />
                  Department Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departments.slice(0, 4).map((dept, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{dept.name}</h4>
                        <Badge variant={dept.attendance >= 80 ? 'default' : dept.attendance >= 75 ? 'secondary' : 'destructive'}>
                          {dept.attendance}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Students:</span>
                          <p className="font-medium">{dept.students}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Faculty:</span>
                          <p className="font-medium">{dept.faculty}</p>
                        </div>
                      </div>
                      <Progress value={dept.attendance} className="mt-2 h-2" />
                      {dept.lowAttendance > 20 && (
                        <p className="text-xs text-destructive mt-1">⚠️ {dept.lowAttendance} students at risk</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* User Growth Chart Placeholder */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-admin-primary" />
                  User Growth Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Analytics Chart Placeholder</p>
                    <p className="text-xs text-muted-foreground">Growth trend: +{((institutionStats.totalStudents - 2100) / 2100 * 100).toFixed(1)}% since January</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* AI Insights & Alerts */}
            <Card className="glass-card border-admin-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-admin-primary" />
                  AI Insights & Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiAlerts.map((alert) => (
                    <div key={alert.id} className={`p-3 rounded-lg border ${
                      alert.type === 'warning' ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/20' :
                      alert.type === 'info' ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20' :
                      alert.type === 'prediction' ? 'bg-purple-50/50 border-purple-200 dark:bg-purple-950/20' :
                      'bg-green-50/50 border-green-200 dark:bg-green-950/20'
                    }`}>
                      <div className="flex items-start space-x-2">
                        {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />}
                        {alert.type === 'info' && <FileText className="h-4 w-4 text-blue-500 mt-0.5" />}
                        {alert.type === 'prediction' && <Brain className="h-4 w-4 text-purple-500 mt-0.5" />}
                        {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">{alert.time}</p>
                        </div>
                        {alert.actionable && (
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-admin-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => handleSystemAction('Maintenance')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => handleSystemAction('User Export')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Export User Data
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => handleSystemAction('Security Scan')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Run Security Scan
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => handleSystemAction('Cache Clear')}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Clear System Cache
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge className="bg-green-100 text-green-700">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Services</span>
                  <Badge className="bg-green-100 text-green-700">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">File Storage</span>
                  <Badge className="bg-yellow-100 text-yellow-700">Warning</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Service</span>
                  <Badge className="bg-green-100 text-green-700">Online</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
            </div>
          </TabsContent>

          <TabsContent value="academics" className="space-y-6">
            {/* Search and Filters */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Student & Faculty Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center space-x-2 flex-1 min-w-64">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students, faculty, or roll numbers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => handleExportReport('Student List')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Student Records */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Student Records</h3>
                    <div className="space-y-3">
                      {filteredStudents.map((student) => (
                        <div key={student.id} className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{student.name}</h4>
                              <p className="text-sm text-muted-foreground">{student.rollNo} • {student.department} • {student.year} Year</p>
                            </div>
                            <Badge variant={student.status === 'Active' ? 'default' : 'destructive'}>
                              {student.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Attendance:</span>
                              <p className="font-medium">{student.attendance}%</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Grade:</span>
                              <p className="font-medium">{student.grade}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Faculty Directory */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Faculty Directory</h3>
                    <div className="space-y-3">
                      {filteredFaculty.map((faculty) => (
                        <div key={faculty.id} className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{faculty.name}</h4>
                              <p className="text-sm text-muted-foreground">{faculty.department} • {faculty.experience}</p>
                            </div>
                            <Badge variant="secondary">
                              Load: {faculty.load}h
                            </Badge>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Subjects:</span>
                            <p className="font-medium">{faculty.subjects.join(', ')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Institutional Attendance & Performance Analytics</h2>
                <p className="text-muted-foreground">Comprehensive attendance tracking and performance insights</p>
              </div>
              <Button className="gradient-admin" onClick={() => navigate({ to: '/institutional/attendance/admin' as any })}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Full Analytics
              </Button>
            </div>

            {/* Attendance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <h3 className="font-medium">Present Today</h3>
                  </div>
                  <p className="text-2xl font-bold">1,890</p>
                  <p className="text-xs text-muted-foreground">78.8% of total students</p>
                  <Progress value={78.8} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <h3 className="font-medium">Weekly Average</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600">82.1%</p>
                  <p className="text-xs text-muted-foreground">+2.3% from last week</p>
                  <Progress value={82.1} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <h3 className="font-medium">Low Attendance</h3>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">127</p>
                  <p className="text-xs text-muted-foreground">students below 75%</p>
                  <Progress value={20} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    <h3 className="font-medium">Target Achievement</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">94.2%</p>
                  <p className="text-xs text-muted-foreground">of 83% institutional target</p>
                  <Progress value={94.2} className="mt-2 h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Department-wise Attendance */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-admin-primary" />
                  Department-wise Attendance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments.map((dept, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{dept.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {dept.students} students • {dept.faculty} faculty
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={dept.attendance >= 80 ? 'default' : dept.attendance >= 75 ? 'secondary' : 'destructive'}>
                            {dept.attendance}%
                          </Badge>
                          {dept.lowAttendance > 20 && (
                            <p className="text-xs text-destructive mt-1">{dept.lowAttendance} at risk</p>
                          )}
                        </div>
                      </div>
                      <Progress value={dept.attendance} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                        <span>Low attendance: {dept.lowAttendance} students</span>
                        <span className={dept.attendance >= 80 ? 'text-green-600' : dept.attendance >= 75 ? 'text-yellow-600' : 'text-red-600'}>
                          {dept.attendance >= 80 ? 'Excellent' : dept.attendance >= 75 ? 'Good' : 'Needs Attention'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Accreditation Reports */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2 text-admin-primary" />
                    Accreditation Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg border bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">NAAC Self-Assessment Report</h4>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">Ready</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Comprehensive institutional evaluation report for NAAC accreditation
                    </p>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleExportReport('NAAC SAR')}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">NIRF Data Collection</h4>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">In Progress</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      National Institutional Ranking Framework submission
                    </p>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleExportReport('NIRF Data')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Export Data
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">AICTE Compliance Report</h4>
                      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">Pending</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Annual compliance report for technical education council
                    </p>
                    <div className="flex space-x-2">
                      <Button size="sm" disabled>
                        <Clock className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                      <Button size="sm" variant="outline" disabled>
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics & Performance Reports */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-admin-primary" />
                    Analytics & Performance Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg border bg-muted/20">
                    <h4 className="font-medium mb-2">Student Performance Analytics</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Detailed analysis of student academic performance and trends
                    </p>
                    <Button size="sm" onClick={() => handleExportReport('Student Performance')}>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg border bg-muted/20">
                    <h4 className="font-medium mb-2">Faculty Performance Review</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Comprehensive faculty evaluation and teaching effectiveness report
                    </p>
                    <Button size="sm" onClick={() => handleExportReport('Faculty Performance')}>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg border bg-muted/20">
                    <h4 className="font-medium mb-2">Institutional Dashboard Report</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Executive summary with key performance indicators
                    </p>
                    <Button size="sm" onClick={() => handleExportReport('Executive Summary')}>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="approvals" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-admin-primary" />
                  Approvals & Escalated Reviews
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review and approve faculty-submitted reports and student activity submissions
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingApprovals.map((approval) => (
                    <div key={approval.id} className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline">{approval.type}</Badge>
                            <Badge variant={approval.status === 'Escalated' ? 'destructive' : 'secondary'}>
                              {approval.status}
                            </Badge>
                          </div>
                          <h4 className="font-medium mb-1">{approval.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {approval.student && `Student: ${approval.student}`}
                            {approval.faculty && `Faculty: ${approval.faculty}`}
                            {' • '}
                            {approval.department}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Submitted: {new Date(approval.submittedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toast({ title: "Document Opened", description: "Review document opened for detailed evaluation." })}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleApprovalAction(approval.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleApprovalAction(approval.id, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Administrative Notifications</h2>
                <p className="text-muted-foreground">Compliance alerts, system notifications, and faculty communications</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  Mark All Read
                </Button>
              </div>
            </div>

            {/* Notification Categories */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold text-orange-600">5</p>
                      <p className="text-xs text-muted-foreground">Compliance Alerts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold text-purple-600">3</p>
                      <p className="text-xs text-muted-foreground">AI Alerts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold text-blue-600">7</p>
                      <p className="text-xs text-muted-foreground">Accreditation Tasks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">12</p>
                      <p className="text-xs text-muted-foreground">Faculty Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notifications List */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-admin-primary" />
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-orange-700 dark:text-orange-400">⚠️ IT Department has lowest attendance (62%)</h4>
                          <p className="text-sm text-orange-600 dark:text-orange-500 mt-1">
                            Department requires immediate attention - 28 students below 75% threshold
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">2 hours ago • Computer Science Dept</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Take Action</Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-700 dark:text-blue-400">📊 Accreditation report draft is ready for review</h4>
                          <p className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                            NAAC self-assessment report has been compiled and requires administrative approval
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">4 hours ago • Academic Office</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Review Document</Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-purple-700 dark:text-purple-400">🔮 AI predicts 15% increase in enrollment next semester</h4>
                          <p className="text-sm text-purple-600 dark:text-purple-500 mt-1">
                            Predictive analytics suggest significant enrollment growth - resource planning recommended
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">1 day ago • AI Analytics</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">View Analysis</Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <MessageSquare className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-700 dark:text-green-400">Faculty Request: Report Approval</h4>
                          <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                            Dr. Sarah Wilson has submitted a research publication report for approval
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">1 day ago • Dr. Sarah Wilson, CS Dept</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Review Request</Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50/50 dark:bg-gray-950/20 border border-gray-200/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-700 dark:text-gray-400">✅ NAAC compliance score improved to 94.8%</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-500 mt-1">
                            Institutional compliance metrics have improved following recent policy implementations
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">2 days ago • Quality Assurance</p>
                        </div>
                      </div>
                      <Badge variant="outline">Acknowledged</Badge>
                    </div>
                  </div>
                </div>

                {/* Quick Communication */}
                <div className="mt-6 p-4 rounded-lg border bg-muted/10">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Send className="h-4 w-4 mr-2 text-admin-primary" />
                    Send Institutional Announcement
                  </h4>
                  <Textarea
                    placeholder="Type your announcement to faculty and students..."
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    className="mb-3"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        To Faculty
                      </Button>
                      <Button size="sm" variant="outline">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        To Students
                      </Button>
                    </div>
                    <Button size="sm" onClick={handleSendAnnouncement} disabled={!announcementText.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Announcement
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Administrator Profile</h2>
                <p className="text-muted-foreground">Manage your administrative account and preferences</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCog className="h-5 w-5 mr-2 text-admin-primary" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <Input value={user?.name || 'Administrator Priya Nair'} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <Input value="Senior Administrator" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Institution</label>
                    <Input value="Delhi Technology Institute" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Employee ID</label>
                    <Input value="ADM-2024-001" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contact Email</label>
                    <Input value="priya.nair@dti.edu.in" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Office Hours</label>
                    <Input value="Monday - Friday, 9:00 AM - 6:00 PM" className="mt-1" />
                  </div>
                  <Button className="w-full mt-4">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Update Information
                  </Button>
                </CardContent>
              </Card>

              {/* Preferences & Security */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-admin-primary" />
                    Preferences & Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Notification Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">AI Alerts</span>
                        <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Faculty Messages</span>
                        <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">System Reports</span>
                        <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Marketing Updates</span>
                        <Badge className="bg-gray-100 text-gray-700">Disabled</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Dashboard Preferences</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Dark/Light Mode</span>
                        <Button size="sm" variant="outline">Auto</Button>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Default View</label>
                        <Select defaultValue="overview">
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="overview">Overview Dashboard</SelectItem>
                            <SelectItem value="academics">Academic Management</SelectItem>
                            <SelectItem value="attendance">Attendance Analytics</SelectItem>
                            <SelectItem value="reports">Reports Center</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Security Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Two-Factor Authentication</span>
                        </div>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">Enabled</Badge>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Enable 2FA
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <Lock className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;