import { useState } from 'react';
import { DashboardLayout } from '@/institutional/components/layout/DashboardLayout';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Progress } from '@/institutional/components/ui-ssh/progress-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Input } from '@/institutional/components/ui-ssh/input-ssh';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/institutional/components/ui-ssh/select-ssh';
import { 
  Building2, 
  FileCheck, 
  BarChart3, 
  Globe, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Users,
  GraduationCap,
  Award,
  Calendar,
  Download,
  Shield,
  Lock,
  Database,
  MapPin,
  Search,
  Filter,
  Eye,
  FileText,
  Zap,
  Target,
  Map,
  BookOpen,
  School,
  Building,
  BadgeCheck,
  AlertTriangle,
  Brain,
  UserCog,
  Bell,
  Edit3,
  Settings
} from 'lucide-react';

import { UtilityBar } from '@/institutional/components/shared/UtilityBar';
import { useAuth } from '@/institutional/contexts/AuthContext';
import { useNavigate } from '@tanstack/react-router';
import { toast } from '@/institutional/hooks-ssh/use-toast';
import { AcademicPolicy } from "@/institutional/components/dashboard/government/AcademicPolicy";
import { NationalActivities } from "@/institutional/components/dashboard/government/NationalActivities";
import { CareerOversight } from "@/institutional/components/dashboard/government/CareerOversight";
import { PortfolioStandards } from "@/institutional/components/dashboard/government/PortfolioStandards";
import { AchievementRecognition } from "@/institutional/components/dashboard/government/AchievementRecognition";

const GovernmentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedInstituteType, setSelectedInstituteType] = useState('all');
  
  // Enhanced mock data for comprehensive government dashboard
  const [nationalStats] = useState({
    totalInstitutions: 1248,
    totalStudents: 2856743,
    totalFaculty: 183456,
    nationalAvgAttendance: 76.8,
    topPerformingInstitutions: 156,
    totalVerifiedAchievements: 45678,
    pendingComplianceReports: 23,
    blockchainVerifications: 156789
  });

  const [institutionComparison] = useState([
    { 
      id: 1,
      name: 'IIT Delhi', 
      state: 'Delhi', 
      type: 'Technical', 
      nirf: 2, 
      naac: 'A++', 
      students: 8500, 
      attendance: 85.2, 
      compliance: 98.5, 
      blockchainVerified: true,
      status: 'excellent',
      lastAudit: '2024-01-15'
    },
    { 
      id: 2,
      name: 'Delhi University', 
      state: 'Delhi', 
      type: 'University', 
      nirf: 12, 
      naac: 'A+', 
      students: 15200, 
      attendance: 78.9, 
      compliance: 94.2, 
      blockchainVerified: true,
      status: 'excellent',
      lastAudit: '2024-02-20'
    },
    { 
      id: 3,
      name: 'Mumbai Technical Institute', 
      state: 'Maharashtra', 
      type: 'Technical', 
      nirf: 28, 
      naac: 'A', 
      students: 6200, 
      attendance: 82.1, 
      compliance: 92.7, 
      blockchainVerified: true,
      status: 'good',
      lastAudit: '2024-03-10'
    },
    { 
      id: 4,
      name: 'Bangalore Arts College', 
      state: 'Karnataka', 
      type: 'Arts', 
      nirf: 45, 
      naac: 'B++', 
      students: 3800, 
      attendance: 74.5, 
      compliance: 89.3, 
      blockchainVerified: false,
      status: 'satisfactory',
      lastAudit: '2024-01-25'
    },
    { 
      id: 5,
      name: 'Chennai Medical College', 
      state: 'Tamil Nadu', 
      type: 'Medical', 
      nirf: 15, 
      naac: 'A+', 
      students: 4500, 
      attendance: 88.7, 
      compliance: 96.1, 
      blockchainVerified: true,
      status: 'excellent',
      lastAudit: '2024-02-15'
    }
  ]);

  const [statePerformance] = useState([
    { state: 'Delhi', institutions: 45, avgAttendance: 84.2, compliance: 96.8, rank: 1 },
    { state: 'Karnataka', institutions: 128, avgAttendance: 81.5, compliance: 94.3, rank: 2 },
    { state: 'Maharashtra', institutions: 156, avgAttendance: 79.8, compliance: 92.7, rank: 3 },
    { state: 'Tamil Nadu', institutions: 134, avgAttendance: 78.9, compliance: 91.5, rank: 4 },
    { state: 'Uttar Pradesh', institutions: 189, avgAttendance: 74.2, compliance: 87.9, rank: 8 },
    { state: 'West Bengal', institutions: 98, avgAttendance: 76.5, compliance: 89.2, rank: 6 }
  ]);

  const [complianceAlerts] = useState([
    { id: 1, type: 'audit', message: '📊 Audit report available for XYZ University', state: 'Karnataka', priority: 'medium', time: '2 hours ago' },
    { id: 2, type: 'warning', message: '⚠️ Attendance below 60% in 3 institutions in Karnataka', state: 'Karnataka', priority: 'high', time: '4 hours ago' },
    { id: 3, type: 'compliance', message: '🔍 NAAC accreditation due for 5 institutions', state: 'Tamil Nadu', priority: 'medium', time: '1 day ago' },
    { id: 4, type: 'blockchain', message: '✅ 156 new achievements verified on blockchain', state: 'All', priority: 'low', time: '2 days ago' }
  ]);

  const [blockchainReports] = useState([
    { id: 1, title: 'National Student Achievement Verification', records: 45678, verified: true, hash: '0x1a2b3c...', date: '2024-03-15' },
    { id: 2, title: 'Institution Compliance Records', records: 1248, verified: true, hash: '0x4d5e6f...', date: '2024-03-14' },
    { id: 3, title: 'Faculty Certification Database', records: 183456, verified: true, hash: '0x7g8h9i...', date: '2024-03-13' },
    { id: 4, title: 'Attendance Verification System', records: 2856743, verified: true, hash: '0xjk10l11...', date: '2024-03-12' }
  ]);

  const [nationalReports] = useState([
    { id: 1, title: 'National Education Report 2024', type: 'annual', scope: 'country', institutions: 1248, date: '2024-03-31', size: '15.4 MB', format: 'PDF' },
    { id: 2, title: 'State-wise Performance Analysis', type: 'analytical', scope: 'state', institutions: 'all', date: '2024-03-25', size: '8.7 MB', format: 'Excel' },
    { id: 3, title: 'NIRF Rankings Compilation', type: 'ranking', scope: 'national', institutions: 300, date: '2024-03-20', size: '3.2 MB', format: 'PDF' },
    { id: 4, title: 'Blockchain Verification Report', type: 'technology', scope: 'national', institutions: 1248, date: '2024-03-15', size: '2.1 MB', format: 'JSON' },
    { id: 5, title: 'Compliance Monitoring Dashboard', type: 'compliance', scope: 'regional', institutions: 156, date: '2024-03-10', size: '4.8 MB', format: 'Excel' }
  ]);


  const handleComplianceAction = (alertId: number, action: string) => {
    toast({
      title: `Compliance ${action}`,
      description: `The compliance matter has been ${action}d successfully.`,
    });
  };

  const handleDownloadReport = (reportTitle: string) => {
    toast({
      title: "Report Downloaded",
      description: `${reportTitle} has been downloaded.`,
    });
  };

  const handleInstitutionDrillDown = (institutionId: number) => {
    toast({
      title: "Institution Details",
      description: "Opening detailed institution analytics dashboard.",
    });
  };

  const filteredInstitutions = institutionComparison.filter(institution => 
    (selectedState === 'all' || institution.state === selectedState) &&
    (selectedInstituteType === 'all' || institution.type === selectedInstituteType) &&
    (searchTerm === '' || institution.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const governmentSidebarItems = [
    { id: 'overview', label: 'National Overview', icon: Globe },
    { id: 'institutions', label: 'Institutions', icon: School },
    { id: 'attendance', label: 'Attendance', icon: BarChart3 },
    { id: 'reports', label: 'National Reports', icon: FileText },
    { id: 'compliance', label: 'Compliance Audits', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile Settings', icon: Settings },
  ];

  const TabsContent = ({ value, children, className }: any) => {
    return activeTab === value ? <div className={className}>{children}</div> : null;
  };

  return (
    <DashboardLayout
      role="government"
      activeId={activeTab}
      onNavigate={setActiveTab}
      sidebarItems={governmentSidebarItems}
    >
      <div className="space-y-6">

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Welcome Section with Multi-Factor Authentication */}
            <Card className="glass-card border-government-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Welcome, Ministry Official – Education Dept 👋</h2>
                    <p className="text-muted-foreground mb-4">
                      Secure national education oversight with blockchain-backed data and comprehensive analytics.
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-government-primary mr-1" />
                        <span>{nationalStats.totalInstitutions} Institutions</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-blue-500 mr-1" />
                        <span>{nationalStats.totalStudents.toLocaleString()} Students</span>
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span>{nationalStats.nationalAvgAttendance}% Avg Attendance</span>
                      </div>
                      <div className="flex items-center">
                        <BadgeCheck className="h-4 w-4 text-purple-500 mr-1" />
                        <span>{nationalStats.totalVerifiedAchievements.toLocaleString()} Verified</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      <Lock className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-600">MFA Authenticated • Last login: Today, 9:30 AM</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => handleDownloadReport('National Audit')}>
                      <FileCheck className="h-4 w-4 mr-2" />
                      Audit Report
                    </Button>
                    <Button className="gradient-government" onClick={() => handleDownloadReport('National Report')}>
                      <Download className="h-4 w-4 mr-2" />
                      National Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* National Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <h3 className="font-medium">National Avg. Attendance</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{nationalStats.nationalAvgAttendance}%</p>
                  <p className="text-xs text-muted-foreground">across all institutions</p>
                  <Progress value={nationalStats.nationalAvgAttendance} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-5 w-5 text-government-primary" />
                    <h3 className="font-medium">Top Performing</h3>
                  </div>
                  <p className="text-2xl font-bold">{nationalStats.topPerformingInstitutions}</p>
                  <p className="text-xs text-muted-foreground">institutions above 90%</p>
                  <Progress value={85} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <BadgeCheck className="h-5 w-5 text-purple-500" />
                    <h3 className="font-medium">Blockchain Verified</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{nationalStats.blockchainVerifications.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">tamper-proof records</p>
                  <Progress value={92} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <h3 className="font-medium">Pending Compliance</h3>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{nationalStats.pendingComplianceReports}</p>
                  <p className="text-xs text-muted-foreground">reports requiring review</p>
                  <Progress value={15} className="mt-2 h-2" />
                </CardContent>
              </Card>
            </div>

            {/* State-wise Performance Heatmap */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Map className="h-5 w-5 mr-2 text-government-primary" />
                  State-wise Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statePerformance.map((state, index) => (
                    <div key={index} className="p-4 rounded-lg bg-government-primary/5 hover:bg-government-primary/10 transition-colors cursor-pointer"
                         onClick={() => toast({ title: "State Details", description: `Opening detailed analytics for ${state.state}` })}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{state.state}</h4>
                          <Badge variant="outline">Rank #{state.rank}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="secondary" 
                            className={`${
                              state.compliance >= 95 ? 'bg-green-100 text-green-700' :
                              state.compliance >= 90 ? 'bg-blue-100 text-blue-700' :
                              state.compliance >= 85 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}
                          >
                            {state.compliance}% Compliance
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Institutions:</span>
                          <p className="font-medium">{state.institutions}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Attendance:</span>
                          <p className="font-medium">{state.avgAttendance}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Performance:</span>
                          <p className="font-medium text-government-primary">
                            {state.compliance >= 95 ? 'Excellent' : 
                             state.compliance >= 90 ? 'Good' : 
                             state.compliance >= 85 ? 'Satisfactory' : 'Needs Improvement'}
                          </p>
                        </div>
                      </div>
                      <Progress value={state.compliance} className="mt-3 h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Blockchain-backed Data Integrity */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-purple-500" />
                  Blockchain-backed Data Integrity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {blockchainReports.slice(0, 3).map((report) => (
                    <div key={report.id} className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50">
                      <BadgeCheck className="h-4 w-4 text-purple-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{report.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {report.records.toLocaleString()} records • Hash: {report.hash}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          ✅ Verified
                        </Badge>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Audit
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-2">
                    <Button size="sm" variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      View All Blockchain Records
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* National Overview Stats */}
            <Card className="glass-card border-government-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">National Education Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Institutions</span>
                  <span className="font-bold text-government-primary">{nationalStats.totalInstitutions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Students</span>
                  <span className="font-bold">{nationalStats.totalStudents.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Faculty Members</span>
                  <span className="font-bold">{nationalStats.totalFaculty.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Blockchain Records</span>
                  <span className="font-bold text-purple-500">{nationalStats.blockchainVerifications.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Verified Achievements</span>
                  <span className="font-bold text-green-500">{nationalStats.totalVerifiedAchievements.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* National Compliance Alerts */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  National Compliance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complianceAlerts.map((alert) => (
                    <div key={alert.id} className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      alert.priority === 'high' ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20' :
                      alert.priority === 'medium' ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/20' :
                      'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20'
                    }`}
                         onClick={() => handleComplianceAction(alert.id, 'investigate')}>
                      <div className="flex items-start space-x-2">
                        {alert.type === 'audit' && <FileCheck className="h-4 w-4 text-blue-500 mt-0.5" />}
                        {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />}
                        {alert.type === 'compliance' && <Shield className="h-4 w-4 text-purple-500 mt-0.5" />}
                        {alert.type === 'blockchain' && <BadgeCheck className="h-4 w-4 text-green-500 mt-0.5" />}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {alert.state} • {alert.time} • Priority: {alert.priority}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  All Alerts Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-government-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => toast({ title: "Audit Scheduled", description: "Institution audit has been scheduled." })}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Schedule Audit
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => toast({ title: "Report Generated", description: "Compliance report is being generated." })}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Compliance Report
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => toast({ title: "Alert Sent", description: "Policy update notifications sent to all institutions." })}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Send Policy Alert
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => toast({ title: "Export Started", description: "Data export is being processed." })}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </div>
            </div>
          </TabsContent>

          <TabsContent value="academics" className="space-y-6">
            <AcademicPolicy />
          </TabsContent>

          {/* Duplicate stub removed — real attendance content is rendered below at value="attendance" */}

          <TabsContent value="activities" className="space-y-6">
            <NationalActivities />
          </TabsContent>

          <TabsContent value="career" className="space-y-6">
            <CareerOversight />
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <PortfolioStandards />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <AchievementRecognition />
          </TabsContent>

          <TabsContent value="institutions" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Institution Registry & Comparison</h2>
                <p className="text-muted-foreground">Comprehensive institution management and performance analysis</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => handleDownloadReport('Institution Registry')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Registry
                </Button>
              </div>
            </div>

            {/* Filters and Search */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2 flex-1 min-w-64">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search institutions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      <SelectItem value="Delhi">Delhi</SelectItem>
                      <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="Karnataka">Karnataka</SelectItem>
                      <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedInstituteType} onValueChange={setSelectedInstituteType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Institution Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="University">University</SelectItem>
                      <SelectItem value="Medical">Medical</SelectItem>
                      <SelectItem value="Arts">Arts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Institution List */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-government-primary" />
                  Registered Institutions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredInstitutions.map((institution) => (
                    <div key={institution.id} className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                         onClick={() => handleInstitutionDrillDown(institution.id)}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-lg">{institution.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {institution.state} • {institution.type} • {institution.students.toLocaleString()} students
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {institution.blockchainVerified && (
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                              <BadgeCheck className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          <Badge variant={
                            institution.status === 'excellent' ? 'default' :
                            institution.status === 'good' ? 'secondary' :
                            'destructive'
                          }>
                            {institution.status === 'excellent' ? '✅ Compliant' :
                             institution.status === 'good' ? '⚠️ Under Review' :
                             '❌ Non-Compliant'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">NIRF Rank:</span>
                          <p className="font-medium">#{institution.nirf}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">NAAC Grade:</span>
                          <p className="font-medium">{institution.naac}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Attendance:</span>
                          <p className="font-medium">{institution.attendance}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Compliance:</span>
                          <p className="font-medium">{institution.compliance}%</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Compliance Progress</span>
                          <span>{institution.compliance}%</span>
                        </div>
                        <Progress value={institution.compliance} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">National Attendance Monitoring</h2>
                <p className="text-muted-foreground">State-wise and institution-wise attendance analysis with AI insights</p>
              </div>
              <Button className="gradient-government" onClick={() => navigate({ to: '/institutional/attendance/government' as any })}>
                <Map className="h-4 w-4 mr-2" />
                Detailed Heatmap
              </Button>
            </div>

            {/* State-wise Heatmap */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Map className="h-5 w-5 mr-2 text-government-primary" />
                  State-wise Attendance Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statePerformance.map((state) => (
                    <div key={state.state} className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      state.avgAttendance >= 80 ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20' :
                      state.avgAttendance >= 75 ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20' :
                      state.avgAttendance >= 70 ? 'bg-yellow-50/50 border-yellow-200 dark:bg-yellow-950/20' :
                      'bg-red-50/50 border-red-200 dark:bg-red-950/20'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{state.state}</h4>
                        <Badge variant="outline">#{state.rank}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Institutions:</span>
                          <span className="font-medium">{state.institutions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Attendance:</span>
                          <span className="font-medium">{state.avgAttendance}%</span>
                        </div>
                        <Progress value={state.avgAttendance} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Compliance: {state.compliance}%</span>
                          <span>{state.avgAttendance >= 80 ? 'Excellent' : state.avgAttendance >= 75 ? 'Good' : 'Needs Attention'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Predictions */}
            <Card className="glass-card border-purple-200/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-500" />
                  AI Attendance Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50">
                    <h4 className="font-medium mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
                      Regional Trend Forecast
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      AI predicts 12% improvement in South Indian states' attendance by next semester
                    </p>
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                      High Confidence (87%)
                    </Badge>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50">
                    <h4 className="font-medium mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                      Risk Alert
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      3 technical institutes in Gujarat at risk of falling below 65% attendance threshold
                    </p>
                    <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                      Action Required
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Blockchain-Verified National Reports</h2>
                <p className="text-muted-foreground">Tamper-proof, auditable reports with drill-down capabilities</p>
              </div>
            </div>

            {/* Blockchain Reports */}
            <Card className="glass-card border-purple-200/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-purple-500" />
                  Blockchain-Verified Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {blockchainReports.map((report) => (
                    <div key={report.id} className="p-4 rounded-lg border bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{report.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {report.records.toLocaleString()} records • Generated: {report.date}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                            <BadgeCheck className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{report.hash}</code>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button size="sm" onClick={() => handleDownloadReport(report.title)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* National Reports */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-government-primary" />
                  National Education Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nationalReports.map((report) => (
                    <div key={report.id} className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{report.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {report.scope === 'country' ? 'National Level' : 
                             report.scope === 'state' ? 'State-wise Analysis' :
                             report.scope === 'regional' ? 'Regional Overview' : 'Institutional Level'}
                          </p>
                        </div>
                        <Badge variant="outline">{report.format}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <p className="font-medium capitalize">{report.type}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>
                          <p className="font-medium">{report.date}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Size:</span>
                          <p className="font-medium">{report.size}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Scope:</span>
                          <p className="font-medium">
                            {typeof report.institutions === 'number' ? `${report.institutions} institutions` : report.institutions}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => handleDownloadReport(report.title)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download {report.format}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Automated Compliance Monitoring</h2>
                <p className="text-muted-foreground">NAAC, NIRF, and AICTE compliance tracking with AI anomaly detection</p>
              </div>
            </div>

            {/* Compliance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <h3 className="font-medium">NAAC Compliance</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">89.4%</p>
                  <p className="text-xs text-muted-foreground">institutions compliant</p>
                  <Progress value={89.4} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-5 w-5 text-purple-500" />
                    <h3 className="font-medium">NIRF Participation</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">76.8%</p>
                  <p className="text-xs text-muted-foreground">eligible institutions</p>
                  <Progress value={76.8} className="mt-2 h-2" />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileCheck className="h-5 w-5 text-green-500" />
                    <h3 className="font-medium">AICTE Compliance</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600">92.1%</p>
                  <p className="text-xs text-muted-foreground">technical institutions</p>
                  <Progress value={92.1} className="mt-2 h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Compliance Progress Tracker */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-government-primary" />
                  Institution Progress Tracker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {institutionComparison.slice(0, 3).map((institution) => (
                    <div key={institution.id} className="p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{institution.name}</h4>
                          <p className="text-sm text-muted-foreground">{institution.state} • {institution.type}</p>
                        </div>
                        <Badge variant={institution.compliance >= 95 ? 'default' : institution.compliance >= 85 ? 'secondary' : 'destructive'}>
                          {institution.compliance}% Compliant
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Compliance Progress</span>
                          <span className="font-medium">{institution.compliance}%</span>
                        </div>
                        <Progress value={institution.compliance} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Last Audit: {institution.lastAudit}</span>
                          <span>{institution.blockchainVerified ? '✅ Blockchain Verified' : '⚠️ Pending Verification'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Anomaly Detection */}
            <Card className="glass-card border-red-200/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-red-500" />
                  AI Anomaly Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-700 dark:text-red-400">
                          Data inconsistency detected in XYZ University report
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-500">
                          Attendance figures don't match faculty submissions • Priority: High
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-200/50">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                          Unusual attendance pattern in 5 Karnataka institutions
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-500">
                          Spike in weekend attendance submissions • Priority: Medium
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">National Compliance Notifications</h2>
                <p className="text-muted-foreground">Audit alerts, compliance warnings, and system notifications</p>
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
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold text-red-600">8</p>
                      <p className="text-xs text-muted-foreground">Critical Alerts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold text-blue-600">15</p>
                      <p className="text-xs text-muted-foreground">Audit Alerts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold text-orange-600">23</p>
                      <p className="text-xs text-muted-foreground">Deadlines</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">156</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notifications List */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-government-primary" />
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-red-700 dark:text-red-400">Critical: NAAC submission deadline approaching</h4>
                          <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                            15 institutions have pending NAAC self-assessment reports due by February 15, 2024
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">2 hours ago • Maharashtra, Karnataka, Tamil Nadu</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <FileCheck className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-700 dark:text-blue-400">Audit Report Available</h4>
                          <p className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                            Compliance audit completed for Delhi region - 45 institutions reviewed
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">5 hours ago • Delhi</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Download</Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-orange-700 dark:text-orange-400">Warning: Low Attendance Alert</h4>
                          <p className="text-sm text-orange-600 dark:text-orange-500 mt-1">
                            3 colleges flagged for attendance below 60% threshold - immediate intervention required
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">1 day ago • Gujarat, Rajasthan</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Take Action</Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-700 dark:text-green-400">Success: Blockchain Verification Complete</h4>
                          <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                            156 new student achievements verified and added to blockchain ledger
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">2 days ago • National</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">View Records</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Government Official Profile</h2>
                <p className="text-muted-foreground">Manage your official account and security settings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Official Details */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCog className="h-5 w-5 mr-2 text-government-primary" />
                    Official Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <Input value="Dr. Rajesh Kumar Sharma" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Official Role</label>
                    <Input value="Joint Secretary - Higher Education" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ministry</label>
                    <Input value="Ministry of Education, Government of India" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Region Assigned</label>
                    <Select defaultValue="national">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="national">National Level</SelectItem>
                        <SelectItem value="northern">Northern Region</SelectItem>
                        <SelectItem value="southern">Southern Region</SelectItem>
                        <SelectItem value="eastern">Eastern Region</SelectItem>
                        <SelectItem value="western">Western Region</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Official Contact</label>
                    <Input value="rajesh.sharma@education.gov.in" className="mt-1" />
                  </div>
                  <Button className="w-full mt-4">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Update Details
                  </Button>
                </CardContent>
              </Card>

              {/* Preferences & Security */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-government-primary" />
                    Security & Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Notification Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Critical Alerts</span>
                        <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Daily Reports</span>
                        <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">System Updates</span>
                        <Badge className="bg-gray-100 text-gray-700">Disabled</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Data View Preferences</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Default View</label>
                        <Select defaultValue="national">
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="national">National Dashboard</SelectItem>
                            <SelectItem value="regional">Regional View</SelectItem>
                            <SelectItem value="state">State-wise View</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Multi-Factor Authentication</h4>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50">
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">MFA Enabled</span>
                      </div>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">Active</Badge>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure MFA
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      <Shield className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
      </div>
    </DashboardLayout>
  );
};

export default GovernmentDashboard;