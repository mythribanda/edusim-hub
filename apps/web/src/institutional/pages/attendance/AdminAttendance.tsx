import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/institutional/components/ui-ssh/select-ssh';
import { Progress } from '@/institutional/components/ui-ssh/progress-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Input } from '@/institutional/components/ui-ssh/input-ssh';
import { 
  Download, 
  Search, 
  Users, 
  BookOpen,
  TrendingUp,
  Building,
  FileText,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { toast } from '@/institutional/hooks-ssh/use-toast';

export const AdminAttendance = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil'];
  const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

  const institutionStats = {
    totalStudents: 1250,
    overallAttendance: 78.5,
    totalFaculty: 85,
    activeClasses: 156
  };

  const departmentData = [
    {
      name: 'Computer Science',
      totalStudents: 420,
      avgAttendance: 82.3,
      faculty: 28,
      lowAttendanceStudents: 15
    },
    {
      name: 'Electronics',
      totalStudents: 380,
      avgAttendance: 75.8,
      faculty: 22,
      lowAttendanceStudents: 28
    },
    {
      name: 'Mechanical',
      totalStudents: 250,
      avgAttendance: 79.2,
      faculty: 18,
      lowAttendanceStudents: 12
    },
    {
      name: 'Civil',
      totalStudents: 200,
      avgAttendance: 73.5,
      faculty: 17,
      lowAttendanceStudents: 22
    }
  ];

  const facultyPerformance = [
    {
      id: 1,
      name: 'Dr. Sarah Wilson',
      department: 'Computer Science',
      subjects: ['Data Structures', 'Algorithms'],
      avgAttendance: 85.2,
      classesHeld: 45,
      complianceScore: 'Excellent'
    },
    {
      id: 2,
      name: 'Prof. Michael Chen',
      department: 'Computer Science',
      subjects: ['Database Management'],
      avgAttendance: 79.8,
      classesHeld: 38,
      complianceScore: 'Good'
    },
    {
      id: 3,
      name: 'Dr. Emily Davis',
      department: 'Electronics',
      subjects: ['Digital Electronics', 'Microprocessors'],
      avgAttendance: 72.3,
      classesHeld: 42,
      complianceScore: 'Average'
    }
  ];

  const studentDefaulters = [
    {
      id: 1,
      name: 'Alex Johnson',
      rollNumber: 'CS2021001',
      department: 'Computer Science',
      semester: '6th',
      attendance: 45.2,
      status: 'Critical'
    },
    {
      id: 2,
      name: 'David Kim',
      rollNumber: 'EC2021015',
      department: 'Electronics',
      semester: '4th',
      attendance: 58.7,
      status: 'Warning'
    }
  ];

  const handleExportReport = (type: string) => {
    toast({
      title: "Export Started",
      description: `${type} report is being generated and will be downloaded shortly.`,
    });
  };

  const getComplianceColor = (score: string) => {
    switch (score) {
      case 'Excellent': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'Good': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Average': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Poor': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 75) return { status: 'Good', color: 'text-green-600' };
    if (percentage >= 60) return { status: 'Warning', color: 'text-yellow-600' };
    return { status: 'Critical', color: 'text-red-600' };
  };

  const filteredDepartments = departmentData.filter(dept => 
    selectedDepartment === 'all' || dept.name === selectedDepartment
  );

  const filteredFaculty = facultyPerformance.filter(faculty => 
    (selectedDepartment === 'all' || faculty.department === selectedDepartment) &&
    (searchTerm === '' || faculty.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Building className="h-6 w-6 mr-2 text-primary" />
            Institution Attendance Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage attendance across all departments
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => handleExportReport('NAAC')}>
            <FileText className="h-4 w-4 mr-2" />
            NAAC Report
          </Button>
          <Button variant="outline" onClick={() => handleExportReport('NIRF')}>
            <Download className="h-4 w-4 mr-2" />
            NIRF Report
          </Button>
        </div>
      </div>

      {/* Institution Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{institutionStats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overall Attendance</p>
                <p className="text-2xl font-bold text-green-600">{institutionStats.overallAttendance}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Active Faculty</p>
                <p className="text-2xl font-bold">{institutionStats.totalFaculty}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Classes</p>
                <p className="text-2xl font-bold">{institutionStats.activeClasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2 flex-1 min-w-64">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search faculty, students, or departments..."
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
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {semesters.map(sem => (
                  <SelectItem key={sem} value={sem}>{sem} Semester</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Department Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDepartments.map((dept, index) => (
                <div key={index} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{dept.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {dept.totalStudents} students • {dept.faculty} faculty
                      </p>
                    </div>
                    <Badge className={getAttendanceStatus(dept.avgAttendance).color}>
                      {dept.avgAttendance}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Attendance Progress</span>
                      <span className="font-medium">{dept.avgAttendance}%</span>
                    </div>
                    <Progress value={dept.avgAttendance} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Low attendance: {dept.lowAttendanceStudents} students</span>
                      <span className={getAttendanceStatus(dept.avgAttendance).color}>
                        {getAttendanceStatus(dept.avgAttendance).status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Faculty Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Faculty Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredFaculty.map((faculty) => (
                <div key={faculty.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{faculty.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {faculty.department} • {faculty.subjects.join(', ')}
                      </p>
                    </div>
                    <Badge className={getComplianceColor(faculty.complianceScore)}>
                      {faculty.complianceScore}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Avg Attendance: </span>
                      <span className="font-medium">{faculty.avgAttendance}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Classes Held: </span>
                      <span className="font-medium">{faculty.classesHeld}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Defaulters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Students At Risk (Low Attendance)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {studentDefaulters.map((student) => (
              <div key={student.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-medium">{student.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {student.rollNumber} • {student.department} • {student.semester} Semester
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">{student.attendance}%</p>
                      <p className="text-xs text-muted-foreground">{student.status}</p>
                    </div>
                    <Badge variant="destructive">
                      {student.status}
                    </Badge>
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

export default AdminAttendance;