import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { 
  Users, 
  BookOpen, 
  FileCheck, 
  BarChart3,
  MessageCircle,
  Calendar,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/institutional/contexts/AuthContext';

export const WelcomeOverview = () => {
  const { user } = useAuth();

  const summaryStats = [
    { title: 'Classes Assigned', value: '3', subtitle: 'subjects', icon: BookOpen, color: 'text-faculty-primary' },
    { title: 'Students Enrolled', value: '120', subtitle: 'total students', icon: Users, color: 'text-blue-500' },
    { title: 'Pending Approvals', value: '8', subtitle: 'certificates waiting', icon: FileCheck, color: 'text-orange-500' },
    { title: 'Average Attendance', value: '78%', subtitle: 'class average', icon: BarChart3, color: 'text-green-500' }
  ];

  const notifications = [
    {
      type: 'warning',
      icon: AlertTriangle,
      message: '5 students in DBMS class have attendance < 60%',
      action: 'View Details'
    },
    {
      type: 'info', 
      icon: FileCheck,
      message: 'You have 2 submissions pending approval',
      action: 'Review Now'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="glass-card border-faculty-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome, Prof. {user?.name || 'Faculty'} 👋  
              </h2>
              <p className="text-muted-foreground mb-4">
                Ready to shape young minds today? You have 3 classes scheduled and 8 pending tasks.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-faculty-primary mr-1" />
                  <span>Today: 3 Classes</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span>Class Rating: 4.8/5</span>
                </div>
              </div>
            </div>
            <Button className="gradient-faculty">
              <MessageCircle className="h-4 w-4 mr-2" />
              Message Students
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, index) => (
          <Card key={index} className="glass-card hover:scale-105 transition-transform duration-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-faculty-primary/10">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Notification Bar */}
      <div className="space-y-3">
        {notifications.map((notification, index) => (
          <Card 
            key={index} 
            className={`glass-card border-l-4 ${
              notification.type === 'warning' 
                ? 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20' 
                : 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <notification.icon className={`h-5 w-5 ${
                    notification.type === 'warning' ? 'text-orange-500' : 'text-blue-500'
                  }`} />
                  <span className="text-sm font-medium">{notification.message}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-8 text-xs"
                >
                  {notification.action}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};