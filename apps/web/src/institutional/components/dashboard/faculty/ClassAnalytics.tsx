import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Progress } from '@/institutional/components/ui-ssh/progress-ssh';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  AlertTriangle,
  Target,
  Calendar,
  Filter
} from 'lucide-react';

export const ClassAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedSection, setSelectedSection] = useState('all');

  const [analyticsData] = useState({
    overallStats: {
      averageAttendance: 78.5,
      averageGrade: 82.3,
      studentsAtRisk: 8,
      topPerformers: 12,
      attendanceTrend: 2.3,
      gradeTrend: -1.2
    },
    sectionComparison: [
      { section: 'A', students: 35, attendance: 82.1, avgGrade: 85.2, topPerformers: 8, atRisk: 3 },
      { section: 'B', students: 32, attendance: 74.8, avgGrade: 79.4, topPerformers: 4, atRisk: 5 }
    ],
    attendanceTrends: [
      { week: 'Week 1', sectionA: 85, sectionB: 78 },
      { week: 'Week 2', sectionA: 83, sectionB: 76 },
      { week: 'Week 3', sectionA: 81, sectionB: 74 },
      { week: 'Week 4', sectionA: 82, sectionB: 73 }
    ],
    studentsAtRisk: [
      { name: 'Mike Johnson', roll: 'CS003', section: 'B', attendance: 58, grade: 65, issues: ['Low Attendance', 'Poor Performance'] },
      { name: 'Alex Chen', roll: 'CS005', section: 'B', attendance: 62, grade: 68, issues: ['Irregular Attendance'] },
      { name: 'Lisa Wong', roll: 'CS008', section: 'A', attendance: 67, grade: 72, issues: ['Declining Grades'] }
    ],
    topPerformers: [
      { name: 'Emma Davis', roll: 'CS004', section: 'A', attendance: 95, grade: 94 },
      { name: 'John Doe', roll: 'CS001', section: 'A', attendance: 92, grade: 91 },
      { name: 'Sarah Wilson', roll: 'CS002', section: 'A', attendance: 88, grade: 89 }
    ]
  });

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-500';
    if (trend < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-faculty-primary" />
              Class Analytics Dashboard
            </h3>
            
            <div className="flex space-x-3">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-1 border border-border rounded-md bg-background text-foreground text-sm"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="semester">This Semester</option>
              </select>
              
              <select 
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-1 border border-border rounded-md bg-background text-foreground text-sm"
              >
                <option value="all">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
                <p className="text-2xl font-bold">{analyticsData.overallStats.averageAttendance}%</p>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(analyticsData.overallStats.attendanceTrend)}
                <span className={`text-sm ${getTrendColor(analyticsData.overallStats.attendanceTrend)}`}>
                  {Math.abs(analyticsData.overallStats.attendanceTrend)}%
                </span>
              </div>
            </div>
            <Progress value={analyticsData.overallStats.averageAttendance} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Grade</p>
                <p className="text-2xl font-bold">{analyticsData.overallStats.averageGrade}%</p>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(analyticsData.overallStats.gradeTrend)}
                <span className={`text-sm ${getTrendColor(analyticsData.overallStats.gradeTrend)}`}>
                  {Math.abs(analyticsData.overallStats.gradeTrend)}%
                </span>
              </div>
            </div>
            <Progress value={analyticsData.overallStats.averageGrade} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold text-orange-600">{analyticsData.overallStats.studentsAtRisk}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Students needing attention</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Performers</p>
                <p className="text-2xl font-bold text-green-600">{analyticsData.overallStats.topPerformers}</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Excellent performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Section Comparison */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-faculty-primary" />
            Section-wise Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.sectionComparison.map((section) => (
              <div key={section.section} className="p-4 rounded-lg bg-faculty-primary/5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Section {section.section}</h4>
                  <Badge variant="outline">{section.students} students</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Attendance</span>
                      <span className="font-medium">{section.attendance}%</span>
                    </div>
                    <Progress value={section.attendance} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Avg Grade</span>
                      <span className="font-medium">{section.avgGrade}%</span>
                    </div>
                    <Progress value={section.avgGrade} className="h-2" />
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <div className="text-center">
                      <p className="font-medium text-green-600">{section.topPerformers}</p>
                      <p className="text-xs text-muted-foreground">Top Performers</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-orange-600">{section.atRisk}</p>
                      <p className="text-xs text-muted-foreground">At Risk</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Students at Risk */}
      <Card className="glass-card border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
            Students Requiring Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.studentsAtRisk.map((student, index) => (
              <div key={index} className="p-3 rounded-lg bg-orange-50/50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-900">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h5 className="font-medium">{student.name}</h5>
                    <p className="text-sm text-muted-foreground">{student.roll} • Section {student.section}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>Attendance: <span className="font-medium text-orange-600">{student.attendance}%</span></p>
                    <p>Grade: <span className="font-medium">{student.grade}%</span></p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {student.issues.map((issue, issueIndex) => (
                    <Badge key={issueIndex} variant="outline" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                      {issue}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card className="glass-card border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-green-500" />
            Top Performing Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.topPerformers.map((student, index) => (
              <div key={index} className="p-3 rounded-lg bg-green-50/50 border border-green-200 dark:bg-green-950/20 dark:border-green-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">{student.name}</h5>
                    <p className="text-sm text-muted-foreground">{student.roll} • Section {student.section}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>Attendance: <span className="font-medium text-green-600">{student.attendance}%</span></p>
                    <p>Grade: <span className="font-medium text-green-600">{student.grade}%</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};