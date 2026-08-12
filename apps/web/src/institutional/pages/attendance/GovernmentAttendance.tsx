import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/institutional/components/ui-ssh/select-ssh';
import { Progress } from '@/institutional/components/ui-ssh/progress-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { 
  Download, 
  Building, 
  TrendingUp,
  Users,
  MapPin,
  FileText,
  Shield,
  BarChart3,
  Globe
} from 'lucide-react';
import { toast } from '@/institutional/hooks-ssh/use-toast';

export const GovernmentAttendance = () => {
  const [selectedState, setSelectedState] = useState('all');
  const [selectedInstitutionType, setSelectedInstitutionType] = useState('all');

  // Mock data
  const states = ['All States', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Gujarat'];
  const institutionTypes = ['All Types', 'Engineering', 'Medical', 'Arts & Science', 'Management'];

  const nationalStats = {
    totalInstitutions: 856,
    totalStudents: 2450000,
    nationalAvgAttendance: 76.8,
    complianceRate: 82.3
  };

  const stateData = [
    {
      name: 'Maharashtra',
      institutions: 142,
      students: 485000,
      avgAttendance: 78.5,
      complianceRate: 85.2,
      rank: 2
    },
    {
      name: 'Karnataka',
      institutions: 125,
      students: 425000,
      avgAttendance: 79.8,
      complianceRate: 87.1,
      rank: 1
    },
    {
      name: 'Tamil Nadu',
      institutions: 118,
      students: 395000,
      avgAttendance: 77.2,
      complianceRate: 83.5,
      rank: 3
    },
    {
      name: 'Delhi',
      institutions: 65,
      students: 285000,
      avgAttendance: 75.8,
      complianceRate: 80.9,
      rank: 5
    }
  ];

  const topInstitutions = [
    {
      name: 'IIT Bombay',
      state: 'Maharashtra',
      type: 'Engineering',
      attendance: 94.2,
      students: 8500,
      compliance: 'Excellent'
    },
    {
      name: 'AIIMS Delhi',
      state: 'Delhi',
      type: 'Medical',
      attendance: 92.8,
      students: 3200,
      compliance: 'Excellent'
    },
    {
      name: 'IISc Bangalore',
      state: 'Karnataka',
      type: 'Research',
      attendance: 91.5,
      students: 2800,
      compliance: 'Excellent'
    },
    {
      name: 'Delhi University',
      state: 'Delhi',
      type: 'Arts & Science',
      attendance: 88.7,
      students: 125000,
      compliance: 'Good'
    }
  ];

  const lowPerformingInstitutions = [
    {
      name: 'ABC Engineering College',
      state: 'Gujarat',
      type: 'Engineering',
      attendance: 58.3,
      students: 1200,
      compliance: 'Poor',
      issues: ['Low faculty compliance', 'Inadequate monitoring']
    },
    {
      name: 'XYZ Medical College',
      state: 'Maharashtra',
      type: 'Medical',
      attendance: 62.1,
      students: 800,
      compliance: 'Below Average',
      issues: ['Irregular classes', 'Poor record keeping']
    }
  ];

  const handleExportReport = (type: string) => {
    toast({
      title: "Secure Export Initiated",
      description: `${type} report is being generated with government-level security protocols.`,
    });
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 85) return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    if (rate >= 75) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    if (rate >= 65) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
  };

  const getRankColor = (rank: number) => {
    if (rank <= 3) return 'text-green-600';
    if (rank <= 6) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Shield className="h-6 w-6 mr-2 text-primary" />
            Government Education Dashboard
          </h1>
          <p className="text-muted-foreground">
            National Higher Education Attendance Monitoring System
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => handleExportReport('National Policy')}>
            <FileText className="h-4 w-4 mr-2" />
            Policy Report
          </Button>
          <Button variant="outline" onClick={() => handleExportReport('Audit')}>
            <Download className="h-4 w-4 mr-2" />
            Audit Export
          </Button>
        </div>
      </div>

      {/* National Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Institutions</p>
                <p className="text-2xl font-bold">{nationalStats.totalInstitutions}</p>
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
                <p className="text-2xl font-bold">{nationalStats.totalStudents.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">National Avg Attendance</p>
                <p className="text-2xl font-bold text-primary">{nationalStats.nationalAvgAttendance}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
                <p className="text-2xl font-bold text-green-600">{nationalStats.complianceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Regional & Institutional Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.slice(1).map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedInstitutionType} onValueChange={setSelectedInstitutionType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Institution Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {institutionTypes.slice(1).map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State-wise Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              State-wise Performance Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stateData.map((state, index) => (
                <div key={index} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${getRankColor(state.rank)} bg-muted`}>
                        #{state.rank}
                      </div>
                      <div>
                        <h4 className="font-medium">{state.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {state.institutions} institutions • {state.students.toLocaleString()} students
                        </p>
                      </div>
                    </div>
                    <Badge className={getComplianceColor(state.complianceRate)}>
                      {state.avgAttendance}%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Attendance Progress</span>
                      <span className="font-medium">{state.avgAttendance}%</span>
                    </div>
                    <Progress value={state.avgAttendance} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Compliance: {state.complianceRate}%</span>
                      <span>Rank: #{state.rank}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Institutions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Top Performing Institutions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topInstitutions.map((institution, index) => (
                <div key={index} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{institution.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {institution.state} • {institution.type}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      {institution.attendance}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Students: </span>
                      <span className="font-medium">{institution.students.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status: </span>
                      <span className="font-medium text-green-600">{institution.compliance}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Institutions Requiring Attention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2 text-red-500" />
            Institutions Requiring Policy Intervention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lowPerformingInstitutions.map((institution, index) => (
              <div key={index} className="p-4 rounded-lg border border-red-200 bg-red-50/50 dark:border-red-900/20 dark:bg-red-950/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{institution.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {institution.state} • {institution.type} • {institution.students} students
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {institution.attendance}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Compliance Status:</span>
                    <span className="font-medium text-red-600">{institution.compliance}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Key Issues: </span>
                    <span className="text-red-600">{institution.issues.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Data Integrity & Blockchain Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/20">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">Verified Records</p>
                  <p className="text-2xl font-bold text-green-600">99.7%</p>
                  <p className="text-sm text-green-600">Blockchain secured</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/20">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-700 dark:text-blue-400">Audit Trail</p>
                  <p className="text-2xl font-bold text-blue-600">Complete</p>
                  <p className="text-sm text-blue-600">Tamper-proof logs</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/20">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-700 dark:text-purple-400">Data Quality</p>
                  <p className="text-2xl font-bold text-purple-600">98.4%</p>
                  <p className="text-sm text-purple-600">Verified accuracy</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GovernmentAttendance;