import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Progress } from '@/institutional/components/ui-ssh/progress-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Alert, AlertDescription } from '@/institutional/components/ui-ssh/alert-ssh';
import { 
  BookOpen, 
  AlertTriangle, 
  Calendar, 
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Target
} from 'lucide-react';

export const AcademicsModule = () => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  // Mock academic data
  const [academicData] = useState({
    subjects: [
      {
        id: 1,
        name: 'Mathematics 101',
        code: 'MATH101',
        attendance: 72,
        grade: 'B+',
        marks: 78,
        totalMarks: 100,
        progress: 85,
        status: 'at_risk', // at_risk, good, excellent
        assignments: {
          completed: 8,
          total: 10,
          pending: 2
        },
        nextDeadline: {
          title: 'Assignment 9',
          date: '2024-01-15',
          daysLeft: 3
        },
        weakAreas: ['Calculus', 'Trigonometry'],
        trend: 'down' // up, down, stable
      },
      {
        id: 2,
        name: 'Physics Lab',
        code: 'PHY201',
        attendance: 90,
        grade: 'A-',
        marks: 88,
        totalMarks: 100,
        progress: 70,
        status: 'good',
        assignments: {
          completed: 6,
          total: 8,
          pending: 2
        },
        nextDeadline: {
          title: 'Lab Report 7',
          date: '2024-01-12',
          daysLeft: 1
        },
        weakAreas: [],
        trend: 'up'
      },
      {
        id: 3,
        name: 'Computer Science',
        code: 'CS301',
        attendance: 95,
        grade: 'A',
        marks: 92,
        totalMarks: 100,
        progress: 92,
        status: 'excellent',
        assignments: {
          completed: 9,
          total: 10,
          pending: 1
        },
        nextDeadline: {
          title: 'Final Project',
          date: '2024-01-20',
          daysLeft: 8
        },
        weakAreas: [],
        trend: 'up'
      },
      {
        id: 4,
        name: 'English Literature',
        code: 'ENG101',
        attendance: 83,
        grade: 'B',
        marks: 75,
        totalMarks: 100,
        progress: 65,
        status: 'good',
        assignments: {
          completed: 7,
          total: 10,
          pending: 3
        },
        nextDeadline: {
          title: 'Essay Analysis',
          date: '2024-01-18',
          daysLeft: 6
        },
        weakAreas: ['Poetry Analysis'],
        trend: 'stable'
      }
    ]
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-success/10 text-success border-success/20';
      case 'good': return 'bg-student-primary/10 text-student-primary border-student-primary/20';
      case 'at_risk': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return 'text-success';
    if (percentage >= 75) return 'text-warning';
    return 'text-destructive';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const urgentDeadlines = academicData.subjects
    .filter(subject => subject.nextDeadline.daysLeft <= 3)
    .sort((a, b) => a.nextDeadline.daysLeft - b.nextDeadline.daysLeft);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-student-primary" />
            Academic Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-student-primary/5">
              <p className="text-2xl font-bold text-student-primary">3.7</p>
              <p className="text-sm text-muted-foreground">Current GPA</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success/5">
              <p className="text-2xl font-bold text-success">87%</p>
              <p className="text-sm text-muted-foreground">Avg Attendance</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-warning/5">
              <p className="text-2xl font-bold text-warning">8</p>
              <p className="text-sm text-muted-foreground">Pending Tasks</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-destructive/5">
              <p className="text-2xl font-bold text-destructive">1</p>
              <p className="text-sm text-muted-foreground">At Risk Subjects</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Urgent Deadlines Alert */}
      {urgentDeadlines.length > 0 && (
        <Alert className="border-warning bg-warning/5 border-l-4 border-l-warning">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription>
            <strong>Urgent Deadlines:</strong> {urgentDeadlines.length} assignment(s) due within 3 days!
            <div className="mt-2 space-y-1">
              {urgentDeadlines.map(subject => (
                <div key={subject.id} className="text-sm">
                  • {subject.name}: {subject.nextDeadline.title} - Due in {subject.nextDeadline.daysLeft} day(s)
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {academicData.subjects.map((subject) => (
          <Card 
            key={subject.id} 
            className={`glass-card cursor-pointer transition-all hover:shadow-lg ${
              selectedSubject === subject.id.toString() ? 'ring-2 ring-student-primary' : ''
            } ${
              subject.status === 'at_risk' ? 'border-destructive/30' : ''
            }`}
            onClick={() => setSelectedSubject(
              selectedSubject === subject.id.toString() ? null : subject.id.toString()
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{subject.code}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(subject.trend)}
                  <Badge className={getStatusColor(subject.status)}>
                    {subject.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Grades and Marks */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold text-student-primary">{subject.grade}</p>
                    <p className="text-sm text-muted-foreground">Current Grade</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{subject.marks}/{subject.totalMarks}</p>
                    <p className="text-sm text-muted-foreground">Total Marks</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Course Progress</span>
                    <span className="text-sm font-medium">{subject.progress}%</span>
                  </div>
                  <Progress value={subject.progress} className="h-2" />
                </div>

                {/* Attendance */}
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Attendance</span>
                  </div>
                  <span className={`font-semibold ${getAttendanceColor(subject.attendance)}`}>
                    {subject.attendance}%
                  </span>
                </div>

                {/* Assignments Status */}
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Assignments</span>
                  </div>
                  <span className="text-sm font-medium">
                    {subject.assignments.completed}/{subject.assignments.total} completed
                  </span>
                </div>

                {/* Next Deadline */}
                <div className="flex justify-between items-center p-3 rounded-lg bg-student-primary/5">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-student-primary" />
                    <div>
                      <p className="text-sm font-medium">{subject.nextDeadline.title}</p>
                      <p className="text-xs text-muted-foreground">Next deadline</p>
                    </div>
                  </div>
                  <Badge variant={subject.nextDeadline.daysLeft <= 3 ? "destructive" : "secondary"}>
                    {subject.nextDeadline.daysLeft} days
                  </Badge>
                </div>

                {/* Weak Areas */}
                {subject.weakAreas.length > 0 && (
                  <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <div className="flex items-start">
                      <AlertTriangle className="h-4 w-4 mr-2 text-warning mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning">Areas for Improvement</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {subject.weakAreas.map((area, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-warning/10">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {selectedSubject === subject.id.toString() && (
                  <div className="border-t pt-4 space-y-3 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" size="sm">
                        View Assignments
                      </Button>
                      <Button variant="outline" size="sm">
                        Study Materials
                      </Button>
                    </div>
                    
                    {subject.status === 'at_risk' && (
                      <Alert className="border-destructive bg-destructive/5">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <AlertDescription className="text-sm">
                          Your performance in this subject needs attention. Consider scheduling extra study time or seeking help from faculty.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};