import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Input } from '@/institutional/components/ui-ssh/input-ssh';
import { Label } from '@/institutional/components/ui-ssh/label-ssh';
import { Checkbox } from '@/institutional/components/ui-ssh/checkbox-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/institutional/components/ui-ssh/select-ssh';
import { Calendar } from '@/institutional/components/ui-ssh/calendar-ssh';
import { Popover, PopoverContent, PopoverTrigger } from '@/institutional/components/ui-ssh/popover-ssh';
import { 
  CalendarIcon, 
  Upload, 
  Download, 
  Users, 
  BookOpen,
  Save,
  Edit,
  UserCheck,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/institutional/hooks-ssh/use-toast';

export const FacultyAttendance = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [studentAttendance, setStudentAttendance] = useState<Record<string, boolean>>({});
  const [showStudentList, setShowStudentList] = useState(false);

  // Mock data for faculty
  const facultyData = {
    name: 'Dr. Sarah Wilson',
    id: 'FAC001',
    department: 'Computer Science'
  };

  const assignedSubjects = [
    { id: 'DS101', name: 'Data Structures', sections: ['A', 'B'] },
    { id: 'ALGO201', name: 'Algorithms', sections: ['A'] },
    { id: 'DB301', name: 'Database Management', sections: ['B', 'C'] }
  ];

  const students = [
    { id: 'CS001', name: 'Alex Johnson', rollNumber: 'CS2021001' },
    { id: 'CS002', name: 'Emma Davis', rollNumber: 'CS2021002' },
    { id: 'CS003', name: 'Michael Chen', rollNumber: 'CS2021003' },
    { id: 'CS004', name: 'Sarah Wilson', rollNumber: 'CS2021004' },
    { id: 'CS005', name: 'David Kim', rollNumber: 'CS2021005' },
    { id: 'CS006', name: 'Lisa Zhang', rollNumber: 'CS2021006' },
    { id: 'CS007', name: 'Robert Taylor', rollNumber: 'CS2021007' },
    { id: 'CS008', name: 'Jennifer Lee', rollNumber: 'CS2021008' }
  ];

  const attendanceHistory = [
    {
      id: 1,
      date: '2024-01-15',
      subject: 'Data Structures',
      section: 'A',
      totalStudents: 8,
      presentCount: 7,
      percentage: 87.5
    },
    {
      id: 2,
      date: '2024-01-14',
      subject: 'Algorithms',
      section: 'A',
      totalStudents: 6,
      presentCount: 6,
      percentage: 100
    }
  ];

  const handleLoadStudents = () => {
    if (!selectedSubject || !selectedSection || !selectedDate) {
      toast({
        title: "Missing Information",
        description: "Please select subject, section, and date first.",
        variant: "destructive"
      });
      return;
    }
    
    // Reset attendance state
    const initialAttendance: Record<string, boolean> = {};
    students.forEach(student => {
      initialAttendance[student.id] = false;
    });
    setStudentAttendance(initialAttendance);
    setShowStudentList(true);
  };

  const handleStudentAttendanceChange = (studentId: string, isPresent: boolean) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: isPresent
    }));
  };

  const handleMarkAllPresent = () => {
    const allPresent: Record<string, boolean> = {};
    students.forEach(student => {
      allPresent[student.id] = true;
    });
    setStudentAttendance(allPresent);
  };

  const handleMarkAllAbsent = () => {
    const allAbsent: Record<string, boolean> = {};
    students.forEach(student => {
      allAbsent[student.id] = false;
    });
    setStudentAttendance(allAbsent);
  };

  const handleSaveAttendance = () => {
    const presentCount = Object.values(studentAttendance).filter(Boolean).length;
    const percentage = Math.round((presentCount / students.length) * 100);
    
    toast({
      title: "Attendance Saved",
      description: `Attendance recorded for ${presentCount}/${students.length} students (${percentage}%)`,
    });
    
    setShowStudentList(false);
  };

  const selectedSubjectData = assignedSubjects.find(s => s.id === selectedSubject);
  const availableSections = selectedSubjectData?.sections || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Users className="h-6 w-6 mr-2 text-primary" />
            Faculty Attendance Management
          </h1>
          <p className="text-muted-foreground">
            {facultyData.name} • {facultyData.department}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Assigned Subjects</p>
                <p className="text-2xl font-bold">{assignedSubjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Classes Taken</p>
                <p className="text-2xl font-bold">{attendanceHistory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
                <p className="text-2xl font-bold">
                  {Math.round(attendanceHistory.reduce((sum, item) => sum + item.percentage, 0) / attendanceHistory.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mark Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Mark Daily Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedSubjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="section">Section</Label>
                <Select 
                  value={selectedSection} 
                  onValueChange={setSelectedSection}
                  disabled={!selectedSubject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map(section => (
                      <SelectItem key={section} value={section}>
                        Section {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button onClick={handleLoadStudents} className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Load Student List
              </Button>
            </div>

            {showStudentList && (
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Student Attendance</h3>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={handleMarkAllPresent}>
                      Mark All Present
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleMarkAllAbsent}>
                      Mark All Absent
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4 max-h-80 overflow-y-auto">
                  <div className="space-y-3">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                        <Checkbox
                          id={student.id}
                          checked={studentAttendance[student.id] || false}
                          onCheckedChange={(checked) => 
                            handleStudentAttendanceChange(student.id, checked as boolean)
                          }
                        />
                        <label htmlFor={student.id} className="flex-1 cursor-pointer">
                          <div className="flex justify-between">
                            <span className="font-medium">{student.name}</span>
                            <span className="text-sm text-muted-foreground">{student.rollNumber}</span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSaveAttendance} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Attendance ({Object.values(studentAttendance).filter(Boolean).length}/{students.length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Recent Attendance Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attendanceHistory.map((record) => (
                <div key={record.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{record.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.date} • Section {record.section}
                      </p>
                    </div>
                    <Badge variant={record.percentage >= 80 ? "default" : "destructive"}>
                      {record.percentage}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {record.presentCount}/{record.totalStudents} students present
                    </span>
                    <Button size="sm" variant="ghost">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Subjects */}
      <Card>
        <CardHeader>
          <CardTitle>My Assigned Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedSubjects.map((subject) => (
              <div key={subject.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{subject.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Sections: {subject.sections.join(', ')}
                    </p>
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

export default FacultyAttendance;