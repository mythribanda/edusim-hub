import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Progress } from '@/institutional/components/ui-ssh/progress-ssh';
import { 
  Upload, 
  FileText, 
  Award, 
  Clock, 
  CheckCircle, 
  XCircle,
  MessageCircle,
  Plus,
  Download,
  Eye,
  Star
} from 'lucide-react';
import { toast } from '@/institutional/hooks-ssh/use-toast';
import { ActivitySubmissionForm } from '@/institutional/components/forms/ActivitySubmissionForm';

export const ActivitySkillsTracker = () => {
  const [activeTab, setActiveTab] = useState('submissions');
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  
  // Mock data for submissions with enhanced fields
  const [submissions, setSubmissions] = useState([
    {
      id: 1,
      title: 'AWS Cloud Practitioner Certificate',
      type: 'Certificate',
      category: 'Workshops / MOOCs',
      uploadDate: '2024-01-10',
      status: 'approved',
      facultyComments: 'Excellent certificate! This will be valuable for your cloud computing career path.',
      document: 'aws-certificate.pdf',
      points: 50,
      marks: 48,
      maxMarks: 50
    },
    {
      id: 2,
      title: 'React Development Bootcamp',
      type: 'Workshop/Training',
      category: 'Workshops / MOOCs',
      uploadDate: '2024-01-08',
      status: 'pending',
      facultyComments: null,
      document: 'react-bootcamp-cert.pdf',
      points: 40,
      marks: null,
      maxMarks: 50
    },
    {
      id: 3,
      title: 'AI Hackathon - 2nd Place',
      type: 'Competition Proof',
      category: 'Competitions / Hackathons',
      uploadDate: '2024-01-05',
      status: 'approved',
      facultyComments: 'Outstanding achievement! Your AI project showed great innovation.',
      document: 'hackathon-certificate.pdf',
      points: 100,
      marks: 95,
      maxMarks: 100
    },
    {
      id: 4,
      title: 'Community Service - NGO Volunteer',
      type: 'Other',
      category: 'Clubs / Volunteering',
      uploadDate: '2024-01-03',
      status: 'rejected',
      facultyComments: 'Please provide a more detailed certificate with hours completed.',
      document: 'volunteer-letter.pdf',
      points: 0,
      marks: 0,
      maxMarks: 30
    },
    {
      id: 5,
      title: 'Summer Internship - Tech Startup',
      type: 'Internship Letter',
      category: 'Internships / Projects',
      uploadDate: '2023-12-28',
      status: 'approved',
      facultyComments: 'Great internship experience! The project report is comprehensive.',
      document: 'internship-report.pdf',
      points: 80,
      marks: 85,
      maxMarks: 100
    }
  ]);

  const [availableActivities] = useState([
    {
      id: 1,
      title: 'Machine Learning Fundamentals',
      type: 'Workshop',
      duration: '40 hours',
      provider: 'EdTech Institute',
      difficulty: 'Intermediate',
      points: 60,
      deadline: '2024-02-15',
      enrolled: false
    },
    {
      id: 2,
      title: 'Blockchain Development Bootcamp',
      type: 'MOOC',
      duration: '80 hours',
      provider: 'Tech University',
      difficulty: 'Advanced',
      points: 100,
      deadline: '2024-03-01',
      enrolled: true
    },
    {
      id: 3,
      title: 'Digital Marketing Certificate',
      type: 'Workshop',
      duration: '20 hours',
      provider: 'Marketing Pro',
      difficulty: 'Beginner',
      points: 30,
      deadline: '2024-01-30',
      enrolled: false
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success border-success/20';
      case 'verified': return 'bg-student-primary/10 text-student-primary border-student-primary/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  const handleNewSubmission = (submission: any) => {
    const newSubmission = {
      ...submission,
      id: submissions.length + 1,
      category: submission.type,
      uploadDate: new Date().toLocaleDateString(),
      points: 0,
      marks: null,
      maxMarks: 100
    };
    setSubmissions(prev => [newSubmission, ...prev]);
  };

  const handleEnroll = (activityId: number) => {
    toast({
      title: "Enrollment Successful",
      description: "You have been enrolled in the activity. Check your email for further details.",
    });
  };

  const totalPoints = submissions
    .filter(s => s.status === 'approved')
    .reduce((sum, s) => sum + s.points, 0);

  const statusCounts = {
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length
  };

  if (showSubmissionForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-student-secondary/5 to-student-primary/5 p-4">
        <ActivitySubmissionForm 
          onClose={() => setShowSubmissionForm(false)}
          onSubmit={handleNewSubmission}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-student-primary" />
            Activity & Skills Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-student-primary/5">
              <p className="text-2xl font-bold text-student-primary">{totalPoints}</p>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success/5">
              <p className="text-2xl font-bold text-success">{statusCounts.approved}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-warning/5">
              <p className="text-2xl font-bold text-warning">{statusCounts.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-destructive/5">
              <p className="text-2xl font-bold text-destructive">{statusCounts.rejected}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 p-1 bg-muted/30 rounded-lg">
        <Button
          variant={activeTab === 'submissions' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('submissions')}
          className="flex-1"
        >
          My Submissions
        </Button>
        <Button
          variant={activeTab === 'available' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('available')}
          className="flex-1"
        >
          Available Activities
        </Button>
      </div>

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Submissions</h3>
            <Button onClick={() => setShowSubmissionForm(true)} className="gradient-student">
              <Plus className="h-4 w-4 mr-2" />
              New Submission
            </Button>
          </div>

          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id} className="glass-card">
                <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(submission.status)}
                        <h4 className="font-semibold">{submission.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {submission.type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <span>Uploaded: {submission.uploadDate}</span>
                        <span>•</span>
                        <span>{submission.document}</span>
                        {submission.marks !== null && (
                          <>
                            <span>•</span>
                            <span className="text-student-primary font-medium">
                              <Star className="h-3 w-3 inline mr-1" />
                              {submission.marks}/{submission.maxMarks}
                            </span>
                          </>
                        )}
                        {submission.points > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-success font-medium">
                              +{submission.points} points
                            </span>
                          </>
                        )}
                      </div>

                      {submission.facultyComments && (
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium mb-1">Faculty Feedback</p>
                              <p className="text-sm text-muted-foreground">
                                {submission.facultyComments}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status.toUpperCase()}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Activities Tab */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Available Activities</h3>
            <p className="text-sm text-muted-foreground">
              Enroll in activities to build your skills
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {availableActivities.map((activity) => (
              <Card key={activity.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold mb-1">{activity.title}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{activity.type}</Badge>
                          <span>•</span>
                          <span>{activity.duration}</span>
                        </div>
                      </div>
                      <Badge 
                        variant={activity.difficulty === 'Advanced' ? 'destructive' : 
                                activity.difficulty === 'Intermediate' ? 'default' : 'secondary'}
                      >
                        {activity.difficulty}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Provider:</span>
                        <span className="font-medium">{activity.provider}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Points:</span>
                        <span className="font-medium text-student-primary">{activity.points}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Deadline:</span>
                        <span className="font-medium">{activity.deadline}</span>
                      </div>
                    </div>

                    <Button 
                      className={`w-full ${activity.enrolled ? "gradient-student opacity-60" : "gradient-student"}`}
                      onClick={() => !activity.enrolled && handleEnroll(activity.id)}
                      disabled={activity.enrolled}
                      size="sm"
                    >
                      {activity.enrolled ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Enrolled
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Enroll Now
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};