import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Progress } from '@/institutional/components/ui-ssh/progress-ssh';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Clock,
  BarChart3,
  FileCheck,
  ExternalLink
} from 'lucide-react';

export const MyClasses = () => {
  const classes = [
    {
      id: 1,
      subject: 'Database Management Systems',
      code: 'CSE301',
      section: 'Section A & B',
      semester: '6th Semester',
      students: 45,
      attendance: 78,
      nextClass: 'Today 2:00 PM',
      room: 'Lab 301',
      pendingTasks: 5,
      status: 'active'
    },
    {
      id: 2,
      subject: 'Data Structures & Algorithms',
      code: 'CSE201',
      section: 'Section A',
      semester: '4th Semester',
      students: 38,
      attendance: 85,
      nextClass: 'Tomorrow 10:00 AM',
      room: 'Room 205',
      pendingTasks: 2,
      status: 'active'
    },
    {
      id: 3,
      subject: 'Software Engineering',
      code: 'CSE401',
      section: 'Section C',
      semester: '8th Semester',
      students: 37,
      attendance: 82,
      nextClass: 'Friday 1:00 PM',
      room: 'Room 401',
      pendingTasks: 8,
      status: 'active'
    }
  ];

  const getAttendanceColor = (attendance: number) => {
    if (attendance >= 80) return 'text-green-500';
    if (attendance >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-faculty-primary" />
          My Classes
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your assigned subjects and classes
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="border border-border hover:border-faculty-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-lg">{classItem.subject}</h4>
                      <Badge variant="outline" className="text-xs">
                        {classItem.code}
                      </Badge>
                      <Badge className="bg-faculty-primary/20 text-faculty-primary">
                        {classItem.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {classItem.section} • {classItem.semester}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>{classItem.students} students</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-faculty-primary" />
                        <span>{classItem.nextClass}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{classItem.room}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <FileCheck className="h-4 w-4 text-orange-500" />
                        <span>{classItem.pendingTasks} pending</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Class Attendance</span>
                    <span className={`text-sm font-medium ${getAttendanceColor(classItem.attendance)}`}>
                      {classItem.attendance}%
                    </span>
                  </div>
                  <Progress value={classItem.attendance} className="h-2" />
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Take Attendance
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    View Reports
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    <FileCheck className="h-3 w-3 mr-1" />
                    Approvals ({classItem.pendingTasks})
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Class Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};