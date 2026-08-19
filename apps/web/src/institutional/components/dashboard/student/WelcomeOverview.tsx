import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Progress } from '@/institutional/components/ui-ssh/progress-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Alert, AlertDescription } from '@/institutional/components/ui-ssh/alert-ssh';
import { 
  TrendingUp, 
  Trophy, 
  Clock, 
  Upload, 
  AlertTriangle,
  BookOpen,
  Users,
  Brain,
  Target
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export const WelcomeOverview = ({ onUploadClick }: { onUploadClick: () => void }) => {
  const { user } = useAuthStore();
  
  // Mock data - would come from API
  const [overviewData] = useState({
    attendance: { percentage: 87, status: 'good' },
    academics: { gpa: 3.7, progress: 78 },
    skills: { score: 85, activities: 12 },
    alerts: [
      { 
        id: 1, 
        message: "Your attendance dropped below 75% in Mathematics", 
        type: "warning",
        priority: "high"
      },
      {
        id: 2,
        message: "New workshop available: Cloud Computing Basics",
        type: "info",
        priority: "medium"
      }
    ]
  });

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return 'text-success';
    if (percentage >= 75) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="glass-card border-student-primary/20 glow-student">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2 text-gradient-student">
                Welcome back, {user?.name}! 👋
              </h2>
              <p className="text-muted-foreground mb-6">
                Ready to unlock your potential? Let's dive into your learning journey.
              </p>
              
              {/* Quick Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-student-primary/5">
                  <div className="p-2 rounded-full bg-student-primary/10">
                    <TrendingUp className="h-4 w-4 text-student-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overall GPA</p>
                    <p className="font-bold text-student-primary">{overviewData.academics.gpa}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-success/5">
                  <div className="p-2 rounded-full bg-success/10">
                    <Clock className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Attendance</p>
                    <p className={`font-bold ${getAttendanceColor(overviewData.attendance.percentage)}`}>
                      {overviewData.attendance.percentage}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-warning/5">
                  <div className="p-2 rounded-full bg-warning/10">
                    <Trophy className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Achievements</p>
                    <p className="font-bold text-warning">12</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-student-accent/5">
                  <div className="p-2 rounded-full bg-student-accent/10">
                    <Target className="h-4 w-4 text-student-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Skills Score</p>
                    <p className="font-bold text-student-accent">{overviewData.skills.score}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <Button className="gradient-student" onClick={onUploadClick}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Achievement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Attendance Card with Donut Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-student-primary" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="hsl(var(--student-primary))"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${overviewData.attendance.percentage * 2.51} 251`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-student-primary">
                    {overviewData.attendance.percentage}%
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Monthly Average</p>
              <Badge variant={overviewData.attendance.percentage >= 85 ? "default" : "destructive"}>
                {overviewData.attendance.percentage >= 85 ? "Excellent" : "Needs Improvement"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Academics Progress */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-student-primary" />
              Academic Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Overall Progress</span>
                  <span className="text-sm font-medium">{overviewData.academics.progress}%</span>
                </div>
                <Progress value={overviewData.academics.progress} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-student-primary">{overviewData.academics.gpa}</p>
                  <p className="text-xs text-muted-foreground">Current GPA</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">A-</p>
                  <p className="text-xs text-muted-foreground">Average Grade</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills & Activities */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-student-primary" />
              Skills & Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Skills Score</span>
                  <span className="text-sm font-medium">{overviewData.skills.score}/100</span>
                </div>
                <Progress value={overviewData.skills.score} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-student-accent">{overviewData.skills.activities}</p>
                  <p className="text-xs text-muted-foreground">Activities</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">5</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Alerts & Notifications */}
      {overviewData.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center">
            <Brain className="h-5 w-5 mr-2 text-student-primary" />
            AI Insights & Alerts
          </h3>
          
          {overviewData.alerts.map((alert) => (
            <Alert 
              key={alert.id} 
              className={`border-l-4 ${
                alert.type === 'warning' 
                  ? 'border-l-warning bg-warning/5' 
                  : 'border-l-student-primary bg-student-primary/5'
              }`}
            >
              {alert.type === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-warning" />
              ) : (
                <Brain className="h-4 w-4 text-student-primary" />
              )}
              <AlertDescription className="font-medium">
                {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
};