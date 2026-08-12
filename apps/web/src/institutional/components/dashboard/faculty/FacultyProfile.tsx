import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Input } from '@/institutional/components/ui-ssh/input-ssh';
import { Textarea } from '@/institutional/components/ui-ssh/textarea-ssh';
import { Label } from '@/institutional/components/ui-ssh/label-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Switch } from '@/institutional/components/ui-ssh/switch-ssh';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Clock,
  BookOpen,
  Settings,
  Bell,
  Save,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/institutional/contexts/AuthContext';
import { toast } from '@/institutional/hooks-ssh/use-toast';

export const FacultyProfile = () => {
  const { user } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Prof. Anjali Sharma',
    email: user?.email || 'anjali.sharma@university.edu',
    phone: '+91 98765 43210',
    department: 'Computer Science & Engineering',
    designation: 'Associate Professor',
    employeeId: 'FAC001',
    officeLocation: 'Room 304, CS Block',
    officeHours: 'Mon-Fri: 2:00 PM - 4:00 PM',
    bio: 'Experienced faculty member specializing in Database Systems, Data Structures, and Software Engineering with 8+ years of teaching experience.',
    qualifications: ['Ph.D. in Computer Science', 'M.Tech. in Software Engineering', 'B.Tech. in Computer Science'],
    subjects: ['Database Management Systems', 'Data Structures & Algorithms', 'Software Engineering'],
    researchInterests: ['Database Optimization', 'Machine Learning', 'Software Architecture']
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    attendanceAlerts: true,
    gradeReminders: true,
    studentMessages: true,
    systemUpdates: false
  });

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    });
  };

  const handleSavePreferences = () => {
    toast({
      title: "Preferences Updated", 
      description: "Your notification preferences have been saved.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-faculty-primary" />
                Profile Information
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={profileData.employeeId}
                    disabled
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) => setProfileData({...profileData, department: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={profileData.designation}
                    onChange={(e) => setProfileData({...profileData, designation: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="officeLocation">Office Location</Label>
                <Input
                  id="officeLocation"
                  value={profileData.officeLocation}
                  onChange={(e) => setProfileData({...profileData, officeLocation: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="officeHours">Office Hours</Label>
                <Input
                  id="officeHours"
                  value={profileData.officeHours}
                  onChange={(e) => setProfileData({...profileData, officeHours: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio/Description</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  className="min-h-20"
                />
              </div>
              
              <Button onClick={handleSaveProfile} className="gradient-faculty">
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Info Sidebar */}
        <div className="space-y-6">
          {/* Current Info Card */}
          <Card className="glass-card border-faculty-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Faculty Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-faculty-primary" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">{profileData.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Office</p>
                  <p className="text-xs text-muted-foreground">{profileData.officeLocation}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Office Hours</p>
                  <p className="text-xs text-muted-foreground">{profileData.officeHours}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <BookOpen className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Subjects</p>
                  <p className="text-xs text-muted-foreground">{profileData.subjects.length} assigned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Qualifications */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Qualifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profileData.qualifications.map((qual, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {qual}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subjects Teaching */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Teaching Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profileData.subjects.map((subject, index) => (
                  <div key={index} className="p-2 rounded bg-faculty-primary/10 text-sm">
                    {subject}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preferences */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2 text-faculty-primary" />
            Teaching Preferences & Notifications
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Notification Settings
              </h4>
              
              <div className="space-y-3">
                {Object.entries(preferences).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={key} className="text-sm">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Label>
                    <Switch
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, [key]: checked})
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Research Interests</h4>
              <div className="space-y-2">
                {profileData.researchInterests.map((interest, index) => (
                  <Badge key={index} className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {interest}
                  </Badge>
                ))}
              </div>
              
              <div className="pt-4">
                <Button size="sm" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Office Hours
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <Button onClick={handleSavePreferences} className="gradient-faculty">
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};