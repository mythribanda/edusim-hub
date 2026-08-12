import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Input } from '@/institutional/components/ui-ssh/input-ssh';
import { 
  FileText, 
  Download, 
  Filter,
  Calendar,
  Users,
  GraduationCap,
  Building2,
  TrendingUp,
  BarChart3,
  Search
} from 'lucide-react';
import { toast } from '@/institutional/hooks-ssh/use-toast';

export const ComprehensiveReports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const [reportTemplates] = useState([
    {
      id: 1,
      name: 'NAAC Accreditation Report',
      description: 'Comprehensive report for NAAC accreditation process',
      category: 'Compliance',
      dataPoints: 45,
      estimatedTime: '15-20 min',
      lastGenerated: '2024-02-15',
      status: 'available'
    },
    {
      id: 2,
      name: 'NIRF Ranking Submission',
      description: 'National Institutional Ranking Framework submission data',
      category: 'Rankings',
      dataPoints: 38,
      estimatedTime: '10-15 min',
      lastGenerated: '2024-03-01',
      status: 'available'
    },
    {
      id: 3,
      name: 'AICTE Compliance Report',
      description: 'All India Council for Technical Education compliance data',
      category: 'Compliance',
      dataPoints: 32,
      estimatedTime: '8-12 min',
      lastGenerated: '2024-01-20',
      status: 'available'
    },
    {
      id: 4,
      name: 'Student Achievement Portfolio',
      description: 'Comprehensive student achievements and verified credentials',
      category: 'Student Data',
      dataPoints: 28,
      estimatedTime: '5-8 min',
      lastGenerated: 'Never',
      status: 'new'
    },
    {
      id: 5,
      name: 'Faculty Performance Analytics',
      description: 'Department-wise faculty performance and activity reports',
      category: 'Faculty',
      dataPoints: 25,
      estimatedTime: '6-10 min',
      lastGenerated: '2024-02-28',
      status: 'available'
    },
    {
      id: 6,
      name: 'Institution Performance Dashboard',
      description: 'Overall institutional performance metrics and trends',
      category: 'Analytics',
      dataPoints: 35,
      estimatedTime: '12-18 min',
      lastGenerated: '2024-03-10',
      status: 'available'
    }
  ]);

  const [customFilters] = useState({
    departments: ['Computer Science', 'Mechanical Engineering', 'Electronics', 'Civil Engineering'],
    years: ['2024', '2023', '2022', '2021'],
    batches: ['2020-2024', '2021-2025', '2022-2026', '2023-2027'],
    programs: ['B.Tech', 'M.Tech', 'PhD', 'MBA']
  });

  const handleGenerateReport = (reportId: number, format: string) => {
    const report = reportTemplates.find(r => r.id === reportId);
    toast({
      title: "Report Generation Started",
      description: `${report?.name} is being generated in ${format} format. You'll be notified when ready.`,
    });
  };

  const handleScheduleReport = (reportId: number) => {
    const report = reportTemplates.find(r => r.id === reportId);
    toast({
      title: "Report Scheduled",
      description: `${report?.name} has been scheduled for automatic generation.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'new': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'generating': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Compliance': return <FileText className="h-4 w-4" />;
      case 'Rankings': return <TrendingUp className="h-4 w-4" />;
      case 'Student Data': return <GraduationCap className="h-4 w-4" />;
      case 'Faculty': return <Users className="h-4 w-4" />;
      case 'Analytics': return <BarChart3 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredReports = reportTemplates.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || report.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold flex items-center">
                <FileText className="h-6 w-6 mr-2 text-admin-primary" />
                Comprehensive Reports Generator
              </h3>
              <p className="text-muted-foreground">Generate NAAC, NIRF, AICTE compliant reports with filters</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2 flex-1 min-w-64">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search report templates..."
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
              <option value="all">All Categories</option>
              <option value="Compliance">Compliance</option>
              <option value="Rankings">Rankings</option>
              <option value="Student Data">Student Data</option>
              <option value="Faculty">Faculty</option>
              <option value="Analytics">Analytics</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Custom Filters */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-admin-primary" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Department</label>
              <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                <option value="all">All Departments</option>
                {customFilters.departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Academic Year</label>
              <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                <option value="all">All Years</option>
                {customFilters.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Batch</label>
              <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                <option value="all">All Batches</option>
                {customFilters.batches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Program</label>
              <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm">
                <option value="all">All Programs</option>
                {customFilters.programs.map(program => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredReports.map((report) => (
          <Card key={report.id} className="glass-card border-admin-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-admin-primary/10">
                    {getCategoryIcon(report.category)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{report.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{report.description}</p>
                    
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        {report.dataPoints} data points
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {report.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Badge className={getStatusColor(report.status)}>
                  {report.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-muted-foreground">
                  Last generated: {report.lastGenerated}
                </p>
                <Badge variant="outline" className="text-xs">
                  {report.category}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="gradient-admin"
                  onClick={() => handleGenerateReport(report.id, 'PDF')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateReport(report.id, 'Excel')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateReport(report.id, 'JSON')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  JSON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleScheduleReport(report.id)}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};