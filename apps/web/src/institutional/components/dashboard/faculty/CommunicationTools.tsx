import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Textarea } from '@/institutional/components/ui-ssh/textarea-ssh';
import { Input } from '@/institutional/components/ui-ssh/input-ssh';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/institutional/components/ui-ssh/select-ssh';
import { 
  Bell, 
  MessageCircle, 
  Send, 
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Megaphone
} from 'lucide-react';
import { toast } from '@/institutional/hooks-ssh/use-toast';

export const CommunicationTools = () => {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const notifications = [
    {
      id: 1,
      type: 'system',
      title: 'Low Attendance Alert',
      message: '5 students in DBMS class have attendance below 60%',
      timestamp: '2 hours ago',
      priority: 'high',
      read: false
    },
    {
      id: 2,
      type: 'student',
      title: 'Assignment Query',
      message: 'John Doe asked about deadline extension for Problem Set 5',
      timestamp: '3 hours ago',
      priority: 'medium',
      read: false
    },
    {
      id: 3,
      type: 'system',
      title: 'Grade Submission Reminder',
      message: 'Midterm grades due by Friday 5:00 PM',
      timestamp: '1 day ago',
      priority: 'medium',
      read: true
    },
    {
      id: 4,
      type: 'student',
      title: 'Technical Issue',
      message: 'Sarah Wilson reported login issues with the portal',
      timestamp: '1 day ago',
      priority: 'low',
      read: true
    }
  ];

  const studentMessages = [
    {
      id: 1,
      student: 'Alex Johnson',
      subject: 'Clarification on Assignment 3',
      preview: 'Professor, I need clarification on the database design requirements...',
      timestamp: '1 hour ago',
      unread: true
    },
    {
      id: 2,
      student: 'Emma Davis',
      subject: 'Request for Office Hours',
      preview: 'Could we schedule a meeting to discuss the project scope?',
      timestamp: '2 hours ago',
      unread: true
    },
    {
      id: 3,
      student: 'Mike Chen',
      subject: 'Lab Session Doubt',
      preview: 'I was absent in yesterday\'s lab. Can you help me catch up?',
      timestamp: '5 hours ago',
      unread: false
    }
  ];

  const handleBroadcast = () => {
    if (!broadcastMessage.trim() || !selectedClass) {
      toast({
        title: "Missing Information",
        description: "Please select a class and enter a message to broadcast.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Message Broadcasted",
      description: `Your announcement has been sent to ${selectedClass}.`,
    });
    
    setBroadcastMessage('');
    setSelectedClass('');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900';
      case 'medium': return 'text-orange-500 bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900';
      case 'low': return 'text-blue-500 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900';
      default: return 'text-gray-500 bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-900';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system': return AlertCircle;
      case 'student': return MessageCircle;
      default: return Bell;
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications Panel */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-faculty-primary" />
              Notifications
            </div>
            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
              {notifications.filter(n => !n.read).length} New
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {notifications.map((notification) => {
              const IconComponent = getTypeIcon(notification.type);
              return (
                <div 
                  key={notification.id} 
                  className={`p-3 rounded-lg border ${getPriorityColor(notification.priority)} ${
                    !notification.read ? 'border-l-4' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <IconComponent className="h-4 w-4 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h5 className="font-medium text-sm">{notification.title}</h5>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.priority}
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-faculty-primary rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {notification.timestamp}
                        </span>
                        {!notification.read && (
                          <Button size="sm" variant="outline" className="h-6 text-xs">
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Messages */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-faculty-primary" />
                Student Messages
              </div>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {studentMessages.filter(m => m.unread).length} Unread
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {studentMessages.map((message) => (
                <div 
                  key={message.id} 
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors ${
                    message.unread ? 'bg-faculty-primary/5 border-faculty-primary/20' : 'bg-muted/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-medium text-sm">{message.student}</h5>
                      {message.unread && (
                        <div className="w-2 h-2 bg-faculty-primary rounded-full"></div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>
                  <p className="text-sm font-medium mb-1">{message.subject}</p>
                  <p className="text-sm text-muted-foreground">{message.preview}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button size="sm" variant="outline" className="w-full">
                View All Messages
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Broadcast Messages */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Megaphone className="h-5 w-5 mr-2 text-faculty-primary" />
              Broadcast Message
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Send announcements to your classes
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class to message" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dbms-a-b">DBMS - Section A & B</SelectItem>
                    <SelectItem value="dsa-a">DSA - Section A</SelectItem>
                    <SelectItem value="se-c">Software Engineering - Section C</SelectItem>
                    <SelectItem value="all-classes">All My Classes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  placeholder="Type your announcement here... (e.g., 'Exam on 20th Jan, Attendance mandatory')"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="min-h-24"
                />
              </div>
              
              <Button 
                onClick={handleBroadcast}
                className="w-full gradient-faculty"
                disabled={!broadcastMessage.trim() || !selectedClass}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Announcement
              </Button>
            </div>
            
            {/* Recent Broadcasts */}
            <div className="mt-6 pt-4 border-t">
              <h6 className="font-medium text-sm mb-3">Recent Broadcasts</h6>
              <div className="space-y-2">
                <div className="p-2 rounded bg-muted/20 text-xs">
                  <p className="font-medium">DBMS Class - 2 days ago</p>
                  <p className="text-muted-foreground">Lab session moved to Room 302</p>
                </div>
                <div className="p-2 rounded bg-muted/20 text-xs">
                  <p className="font-medium">All Classes - 1 week ago</p>
                  <p className="text-muted-foreground">Midterm schedule has been updated</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};