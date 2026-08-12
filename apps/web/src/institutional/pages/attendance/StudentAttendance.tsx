import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Progress } from '@/institutional/components/ui-ssh/progress-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Calendar } from '@/institutional/components/ui-ssh/calendar-ssh';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/institutional/components/ui-ssh/select-ssh';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/institutional/components/ui-ssh/table-ssh';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/institutional/components/ui-ssh/tabs-ssh';
import { Input } from '@/institutional/components/ui-ssh/input-ssh';
import { ProgressCircle } from '@/institutional/components/ui-ssh/progress-circle-ssh';
import { Sparkline } from '@/institutional/components/ui-ssh/sparkline-ssh';
import { 
  Calendar as CalendarIcon, 
  Download, 
  User, 
  BookOpen, 
  TrendingUp,
  GraduationCap,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
  Filter,
  Bell,
  FileText,
  MapPin,
  Target,
  Award,
  Eye,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const StudentAttendance = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API calls
  const studentData = {
    name: 'Alex Johnson',
    rollNumber: 'CS2021001',
    semester: '6th',
    section: 'A',
    profileImage: '/api/placeholder/80/80'
  };

  const attendanceData = [
    {
      id: 1,
      date: '2024-01-15',
      day: 'Monday',
      subject: 'Data Structures',
      faculty: 'Dr. Sarah Wilson',
      status: 'Present',
      time: '09:00 AM'
    },
    {
      id: 2,
      date: '2024-01-15',
      day: 'Monday',
      subject: 'Database Management',
      faculty: 'Prof. Michael Chen',
      status: 'Absent',
      time: '11:00 AM'
    },
    {
      id: 3,
      date: '2024-01-16',
      day: 'Tuesday',
      subject: 'Operating Systems',
      faculty: 'Dr. Emily Davis',
      status: 'Late',
      time: '10:00 AM'
    },
    {
      id: 4,
      date: '2024-01-16',
      day: 'Tuesday',
      subject: 'Data Structures',
      faculty: 'Dr. Sarah Wilson',
      status: 'Present',
      time: '02:00 PM'
    },
    {
      id: 5,
      date: '2024-01-17',
      day: 'Wednesday',
      subject: 'Computer Networks',
      faculty: 'Prof. Robert Kim',
      status: 'Present',
      time: '01:00 PM'
    },
    {
      id: 6,
      date: '2024-01-18',
      day: 'Thursday',
      subject: 'Database Management',
      faculty: 'Prof. Michael Chen',
      status: 'Present',
      time: '11:00 AM'
    }
  ];

  const subjectWiseData = [
    {
      subject: 'Data Structures',
      faculty: 'Dr. Sarah Wilson',
      held: 20,
      attended: 18,
      percentage: 90,
      status: 'Good'
    },
    {
      subject: 'Database Management',
      faculty: 'Prof. Michael Chen',
      held: 18,
      attended: 14,
      percentage: 78,
      status: 'Good'
    },
    {
      subject: 'Operating Systems',
      faculty: 'Dr. Emily Davis',
      held: 15,
      attended: 10,
      percentage: 67,
      status: 'Warning'
    },
    {
      subject: 'Computer Networks',
      faculty: 'Prof. Robert Kim',
      held: 12,
      attended: 8,
      percentage: 67,
      status: 'Warning'
    }
  ];

  const todaysSchedule = [
    {
      subject: 'Data Structures',
      time: '09:00 AM - 10:00 AM',
      faculty: 'Dr. Sarah Wilson',
      room: 'CS-101',
      status: 'completed'
    },
    {
      subject: 'Database Management',
      time: '11:00 AM - 12:00 PM',
      faculty: 'Prof. Michael Chen',
      room: 'CS-102',
      status: 'current'
    },
    {
      subject: 'Operating Systems',
      time: '02:00 PM - 03:00 PM',
      faculty: 'Dr. Emily Davis',
      room: 'CS-103',
      status: 'upcoming'
    }
  ];

  const notifications = [
    {
      id: 1,
      date: '2024-01-20',
      time: '09:30 AM',
      notifiedBy: 'Prof. Michael Chen',
      subject: 'Database Management',
      message: 'Attendance below 75%. Please attend regularly.',
      file: 'attendance_warning.pdf',
      status: 'Unread'
    },
    {
      id: 2,
      date: '2024-01-21',
      time: '02:15 PM',
      notifiedBy: 'AI Alert System',
      subject: 'Data Structures',
      message: 'Missed 3 consecutive classes. Contact faculty immediately.',
      file: null,
      status: 'Unread'
    },
    {
      id: 3,
      date: '2024-01-19',
      time: '11:45 AM',
      notifiedBy: 'Dr. Emily Davis',
      subject: 'Operating Systems',
      message: 'Assignment submission deadline approaching.',
      file: 'assignment_details.pdf',
      status: 'Read'
    }
  ];

  const facultyList = [
    {
      name: 'Dr. Sarah Wilson',
      subjects: ['Data Structures'],
      department: 'Computer Science',
      email: 'sarah.wilson@university.edu',
      phone: '+1 (555) 123-4567',
      office: 'CS Building, Room 201',
      image: '/api/placeholder/60/60'
    },
    {
      name: 'Prof. Michael Chen',
      subjects: ['Database Management'],
      department: 'Computer Science',
      email: 'michael.chen@university.edu',
      phone: '+1 (555) 234-5678',
      office: 'CS Building, Room 205',
      image: '/api/placeholder/60/60'
    },
    {
      name: 'Dr. Emily Davis',
      subjects: ['Operating Systems'],
      department: 'Computer Science',
      email: 'emily.davis@university.edu',
      phone: '+1 (555) 345-6789',
      office: 'CS Building, Room 210',
      image: '/api/placeholder/60/60'
    },
    {
      name: 'Prof. Robert Kim',
      subjects: ['Computer Networks'],
      department: 'Computer Science',
      email: 'robert.kim@university.edu',
      phone: '+1 (555) 456-7890',
      office: 'CS Building, Room 215',
      image: '/api/placeholder/60/60'
    }
  ];

  // Weekly trend data for sparkline
  const weeklyTrend = [85, 78, 90, 67, 88, 75, 82];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': 
      case 'Good': 
        return 'bg-success/10 text-success border-success/20';
      case 'Absent': 
      case 'Low': 
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Late': 
      case 'Warning': 
        return 'bg-warning/10 text-warning border-warning/20';
      default: 
        return 'bg-muted/50 text-muted-foreground border-muted/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Present': 
      case 'Good': 
        return <CheckCircle2 className="h-4 w-4" />;
      case 'Absent': 
      case 'Low': 
        return <XCircle className="h-4 w-4" />;
      case 'Late': 
      case 'Warning': 
        return <AlertCircle className="h-4 w-4" />;
      default: 
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredAttendance = attendanceData.filter(record => {
    const matchesSubject = selectedSubject === 'all' || record.subject === selectedSubject;
    const matchesFaculty = selectedFaculty === 'all' || record.faculty === selectedFaculty;
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    const matchesSearch = searchTerm === '' || 
      record.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.faculty.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSubject && matchesFaculty && matchesStatus && matchesSearch;
  });

  const totalClasses = attendanceData.length;
  const presentClasses = attendanceData.filter(r => r.status === 'Present').length;
  const lateClasses = attendanceData.filter(r => r.status === 'Late').length;
  const absentClasses = attendanceData.filter(r => r.status === 'Absent').length;
  const attendancePercentage = Math.round((presentClasses / totalClasses) * 100);
  const attendanceStatus = attendancePercentage >= 75 ? 'Good Standing' : 'At Risk';

  const isDateWithAttendance = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return attendanceData.some(record => record.date === dateStr);
  };

  const getDateAttendanceStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayRecords = attendanceData.filter(record => record.date === dateStr);
    if (dayRecords.length === 0) return null;
    
    const hasAbsent = dayRecords.some(r => r.status === 'Absent');
    const hasLate = dayRecords.some(r => r.status === 'Late');
    
    if (hasAbsent) return 'absent';
    if (hasLate) return 'late';
    return 'present';
  };

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="glass-card rounded-xl p-6 border backdrop-blur-xl bg-card-glass/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full gradient-student flex items-center justify-center glow-student">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gradient-student">
                My Attendance Record
              </h1>
              <p className="text-muted-foreground mt-1">
                {studentData.name} • {studentData.rollNumber} • Section {studentData.section}
              </p>
              <Badge 
                className={cn(
                  "mt-2",
                  attendancePercentage >= 75 
                    ? "bg-success/10 text-success border-success/20" 
                    : "bg-destructive/10 text-destructive border-destructive/20"
                )}
              >
                {attendanceStatus}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="glass-card hover:glow-student transition-all duration-300">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button className="gradient-student text-white hover:shadow-lg hover:shadow-student-primary/25 transition-all duration-300">
              <Eye className="h-4 w-4 mr-2" />
              View Full Timetable
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="glass-card hover:glow-student/30 transition-all duration-300 animate-slide-up">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Classes</p>
                <p className="text-3xl font-bold mt-2">{totalClasses}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-student-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-student-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover:glow-student/30 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Present</p>
                <p className="text-3xl font-bold mt-2 text-success">{presentClasses}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover:glow-student/30 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Weekly Trend</p>
                <div className="flex items-end space-x-2 mt-2">
                  <span className="text-2xl font-bold">{weeklyTrend[weeklyTrend.length - 1]}%</span>
                  <Sparkline data={weeklyTrend} width={60} height={20} className="mb-1" />
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-student-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-student-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover:glow-student/30 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Attendance</p>
                <div className="flex items-center space-x-4">
                  <ProgressCircle 
                    value={attendancePercentage} 
                    size={60} 
                    strokeWidth={6}
                    className="mt-2"
                  >
                    <span className="text-lg font-bold">{attendancePercentage}%</span>
                  </ProgressCircle>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-student-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-student-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Timetable */}
      <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <CardTitle className="flex items-center text-gradient-student">
            <Clock className="h-5 w-5 mr-2" />
            Today's Timetable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {todaysSchedule.map((schedule, index) => (
              <div 
                key={index}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-300 hover:shadow-lg",
                  schedule.status === 'current' 
                    ? "bg-student-primary/10 border-student-primary/30 shadow-lg shadow-student-primary/20" 
                    : schedule.status === 'completed'
                    ? "bg-success/10 border-success/30"
                    : "bg-muted/20 border-muted/30"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{schedule.subject}</h4>
                  <Badge 
                    className={cn(
                      schedule.status === 'current' 
                        ? "bg-student-primary text-white" 
                        : schedule.status === 'completed'
                        ? "bg-success text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {schedule.status === 'current' ? 'Now' : schedule.status === 'completed' ? 'Done' : 'Next'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{schedule.time}</p>
                <p className="text-sm text-muted-foreground">{schedule.faculty}</p>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  {schedule.room}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subject-Wise Attendance Table */}
      <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <CardHeader>
          <CardTitle className="flex items-center text-gradient-student">
            <BookOpen className="h-5 w-5 mr-2" />
            Subject-Wise Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sl. No</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead>Classes Held</TableHead>
                <TableHead>Classes Attended</TableHead>
                <TableHead>Attendance %</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjectWiseData.map((subject, index) => (
                <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{subject.subject}</TableCell>
                  <TableCell>{subject.faculty}</TableCell>
                  <TableCell>{subject.held}</TableCell>
                  <TableCell>{subject.attended}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{subject.percentage}%</span>
                      <Progress value={subject.percentage} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("flex items-center space-x-1", getStatusColor(subject.status))}>
                      {getStatusIcon(subject.status)}
                      <span>{subject.status}</span>
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 glass-card">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
        </TabsList>

        {/* Attendance Calendar */}
        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass-card lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Attendance Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border pointer-events-auto"
                  modifiers={{
                    present: (date) => getDateAttendanceStatus(date) === 'present',
                    absent: (date) => getDateAttendanceStatus(date) === 'absent',
                    late: (date) => getDateAttendanceStatus(date) === 'late'
                  }}
                  modifiersStyles={{
                    present: { backgroundColor: 'hsl(var(--success))', color: 'white' },
                    absent: { backgroundColor: 'hsl(var(--destructive))', color: 'white' },
                    late: { backgroundColor: 'hsl(var(--warning))', color: 'white' }
                  }}
                />
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-success rounded mr-2"></div>
                    <span>Present</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-destructive rounded mr-2"></div>
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-warning rounded mr-2"></div>
                    <span>Late</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">{presentClasses}</div>
                      <div className="text-sm text-muted-foreground">Present</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">{lateClasses}</div>
                      <div className="text-sm text-muted-foreground">Late</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-destructive">{absentClasses}</div>
                      <div className="text-sm text-muted-foreground">Absent</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Date-Wise Attendance Records */}
        <TabsContent value="records" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Attendance Records
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-48"
                    />
                  </div>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {Array.from(new Set(attendanceData.map(record => record.subject))).map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Present">Present</SelectItem>
                      <SelectItem value="Absent">Absent</SelectItem>
                      <SelectItem value="Late">Late</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAttendance.map((record) => (
                  <div key={record.id} className="p-4 rounded-xl border glass-card hover:shadow-lg hover:shadow-student-primary/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-student-primary/10 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-student-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{record.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.date} • {record.day} • {record.time}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn("flex items-center space-x-1", getStatusColor(record.status))}>
                        {getStatusIcon(record.status)}
                        <span>{record.status}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      Faculty: {record.faculty}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center text-gradient-student">
                <Bell className="h-5 w-5 mr-2" />
                Attendance Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Notified By</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div>
                          <div className="font-medium">{notification.date}</div>
                          <div className="text-sm text-muted-foreground">{notification.time}</div>
                        </div>
                      </TableCell>
                      <TableCell>{notification.notifiedBy}</TableCell>
                      <TableCell>{notification.subject}</TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate">{notification.message}</p>
                      </TableCell>
                      <TableCell>
                        {notification.file ? (
                          <Button variant="ghost" size="sm" className="text-student-primary">
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={cn(
                            notification.status === 'Unread' 
                              ? "bg-student-primary/10 text-student-primary border-student-primary/20" 
                              : "bg-muted/50 text-muted-foreground border-muted/20"
                          )}
                        >
                          {notification.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Faculty Directory */}
        <TabsContent value="faculty" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center text-gradient-student">
                <Users className="h-5 w-5 mr-2" />
                My Faculty Directory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {facultyList.map((faculty, index) => (
                  <div key={index} className="p-6 rounded-xl border glass-card hover:shadow-lg hover:shadow-student-primary/10 transition-all duration-300">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-full gradient-student flex items-center justify-center glow-student/50">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{faculty.name}</h4>
                        <p className="text-muted-foreground mb-2">{faculty.department}</p>
                        <p className="text-sm font-medium text-student-primary mb-3">
                          {faculty.subjects.join(', ')}
                        </p>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Mail className="h-4 w-4 mr-2" />
                            {faculty.email}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Phone className="h-4 w-4 mr-2" />
                            {faculty.phone}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-2" />
                            {faculty.office}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" className="gradient-student text-white hover:shadow-lg hover:shadow-student-primary/25">
                            <Mail className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                          <Button variant="outline" size="sm" className="glass-card">
                            <Eye className="h-4 w-4 mr-1" />
                            Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentAttendance;