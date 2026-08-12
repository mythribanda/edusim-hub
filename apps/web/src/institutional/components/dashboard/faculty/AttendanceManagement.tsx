import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Input } from '@/institutional/components/ui-ssh/input-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Progress } from '@/institutional/components/ui-ssh/progress-ssh';
import { 
  Users, 
  Upload, 
  Download, 
  Search, 
  Filter,
  UserCheck,
  UserX,
  Calendar,
  BarChart3
} from 'lucide-react';
import { toast } from '@/institutional/hooks-ssh/use-toast';

export const AttendanceManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const [attendanceData] = useState([
    { id: 1, student: 'John Doe', roll: 'CS001', section: 'A', semester: '6th', attendance: 92, present: 46, total: 50, status: 'good' },
    { id: 2, student: 'Sarah Wilson', roll: 'CS002', section: 'A', semester: '6th', attendance: 78, present: 39, total: 50, status: 'warning' },
    { id: 3, student: 'Mike Johnson', roll: 'CS003', section: 'B', semester: '6th', attendance: 65, present: 32, total: 50, status: 'low' },
    { id: 4, student: 'Emma Davis', roll: 'CS004', section: 'A', semester: '6th', attendance: 95, present: 47, total: 50, status: 'excellent' },
    { id: 5, student: 'Alex Chen', roll: 'CS005', section: 'B', semester: '6th', attendance: 58, present: 29, total: 50, status: 'critical' }
  ]);

  const handleMarkAttendance = (studentId: number, isPresent: boolean) => {
    toast({
      title: "Attendance Updated",
      description: `Student marked as ${isPresent ? 'present' : 'absent'}.`,
    });
  };

  const handleBulkUpload = () => {
    toast({
      title: "CSV Upload",
      description: "Please select a CSV file to upload attendance data.",
    });
  };

  const handleExportReport = () => {
    toast({
      title: "Export Started",
      description: "Attendance report is being generated and will be downloaded shortly.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'good': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'warning': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const filteredData = attendanceData.filter(student => {
    const matchesSearch = student.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.roll.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || student.section === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2 text-faculty-primary" />
          Attendance Management
        </CardTitle>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center space-x-2 flex-1 min-w-64">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students or roll numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <select 
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="all">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>
          
          <Button variant="outline" size="sm" onClick={handleBulkUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-faculty-primary/5">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-faculty-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-xl font-bold">{attendanceData.length}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Good Attendance</p>
                  <p className="text-xl font-bold text-green-600">
                    {attendanceData.filter(s => s.attendance >= 80).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20">
              <div className="flex items-center space-x-2">
                <UserX className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">At Risk</p>
                  <p className="text-xl font-bold text-orange-600">
                    {attendanceData.filter(s => s.attendance < 70).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Class Average</p>
                  <p className="text-xl font-bold text-blue-600">
                    {Math.round(attendanceData.reduce((sum, s) => sum + s.attendance, 0) / attendanceData.length)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Student List */}
          {filteredData.map((student) => (
            <div key={student.id} className="p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4">
                  <div>
                    <h4 className="font-medium">{student.student}</h4>
                    <p className="text-sm text-muted-foreground">
                      {student.roll} • Section {student.section} • {student.semester} Semester
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(student.status)}>
                    {student.attendance}%
                  </Badge>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                      onClick={() => handleMarkAttendance(student.id, true)}
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 bg-red-50 border-red-200 hover:bg-red-100 text-red-700"
                      onClick={() => handleMarkAttendance(student.id, false)}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground">Attendance Progress</span>
                    <span className="font-medium">{student.present}/{student.total} classes</span>
                  </div>
                  <Progress value={student.attendance} className="h-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};