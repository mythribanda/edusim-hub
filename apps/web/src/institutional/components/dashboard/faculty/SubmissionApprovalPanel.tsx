import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Textarea } from '@/institutional/components/ui-ssh/textarea-ssh';
import { Input } from '@/institutional/components/ui-ssh/input-ssh';
import { Label } from '@/institutional/components/ui-ssh/label-ssh';
import { Alert, AlertDescription } from '@/institutional/components/ui-ssh/alert-ssh';
import { 
  FileCheck, 
  CheckCircle, 
  XCircle, 
  MessageCircle,
  Clock,
  User,
  Award,
  AlertTriangle,
  Bot,
  Copy,
  Star,
  FileText,
  Loader2
} from 'lucide-react';
import { toast } from '@/institutional/hooks-ssh/use-toast';

export const SubmissionApprovalPanel = () => {
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [marks, setMarks] = useState<{ [key: number]: string }>({});

  const [submissions, setSubmissions] = useState([
    {
      id: 1,
      student: 'John Doe',
      roll: 'CS001',
      type: 'Certificate',
      title: 'AWS Cloud Practitioner Certification',
      description: 'Successfully completed AWS Cloud Practitioner certification with score of 890/1000.',
      submittedAt: '2 hours ago',
      files: ['aws-certificate.pdf', 'score-report.pdf'],
      category: 'Technical Certification',
      maxMarks: 50,
      status: 'pending',
      plagiarismRisk: 15,
      aiContentRisk: 8
    },
    {
      id: 2,
      student: 'Sarah Wilson',
      roll: 'CS002',
      type: 'Competition Proof',
      title: 'Coding Competition - CodeChef',
      description: 'Participated in CodeChef Long Challenge and secured 45th rank globally.',
      submittedAt: '5 hours ago',
      files: ['codechef-certificate.png', 'ranking-screenshot.jpg'],
      category: 'Competitive Programming',
      maxMarks: 40,
      status: 'pending',
      plagiarismRisk: 5,
      aiContentRisk: 85
    },
    {
      id: 3,
      student: 'Mike Johnson',
      roll: 'CS003',
      type: 'Project Report',
      title: 'Open Source Contribution',
      description: 'Made significant contributions to React.js documentation and bug fixes.',
      submittedAt: '1 day ago',
      files: ['github-contributions.pdf', 'pr-screenshots.zip'],
      category: 'Open Source',
      maxMarks: 60,
      status: 'pending',
      plagiarismRisk: 92,
      aiContentRisk: 12
    },
    {
      id: 4,
      student: 'Emma Davis',
      roll: 'CS004',
      type: 'Internship Letter',
      title: 'Software Engineering Intern at TechCorp',
      description: 'Completed 3-month internship focusing on full-stack development.',
      submittedAt: '2 days ago',
      files: ['internship-letter.pdf', 'project-report.docx', 'mentor-feedback.pdf'],
      category: 'Industry Experience',
      maxMarks: 80,
      status: 'pending',
      plagiarismRisk: 3,
      aiContentRisk: 22
    }
  ]);

  const [activeLoaders, setActiveLoaders] = useState<Set<string>>(new Set());

  const withLoader = async (actionId: string, actionFn: () => void) => {
    setActiveLoaders(prev => new Set(prev).add(actionId));
    await new Promise(r => setTimeout(r, 800));
    actionFn();
    setActiveLoaders(prev => {
      const newSet = new Set(prev);
      newSet.delete(actionId);
      return newSet;
    });
  };

  const handleApproval = (submissionId: number, action: 'approve' | 'reject') => {
    const submission = submissions.find(s => s.id === submissionId);
    const submissionMarks = marks[submissionId];
    
    if (action === 'approve' && (!submissionMarks || isNaN(Number(submissionMarks)))) {
      toast({
        title: "Marks Required",
        description: "Please assign marks before approving the submission.",
        variant: "destructive"
      });
      return;
    }
    
    withLoader(`${action}_${submissionId}`, () => {
      setSubmissions(prev => prev.map(s => 
        s.id === submissionId 
          ? { 
              ...s, 
              status: action === 'approve' ? 'approved' : 'rejected',
              marks: action === 'approve' ? Number(submissionMarks) : 0,
              feedback: feedback
            }
          : s
      ));
      
      toast({
        title: `Submission ${action}d`,
        description: `${submission?.student}'s submission has been ${action}d${action === 'approve' ? ` with ${submissionMarks} marks` : ''}.`,
      });
      
      setSelectedSubmission(null);
      setFeedback('');
      setMarks(prev => ({ ...prev, [submissionId]: '' }));
    });
  };

  const handleAddFeedback = (submissionId: number) => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please add feedback before submitting.",
        variant: "destructive"
      });
      return;
    }

    const submission = submissions.find(s => s.id === submissionId);
    toast({
      title: "Feedback Added",
      description: `Feedback added for ${submission?.student}'s submission.`,
    });
    
    setFeedback('');
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'certificate': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'activity': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'project': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'internship': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileCheck className="h-5 w-5 mr-2 text-faculty-primary" />
            Submissions Approval Panel
          </div>
          <Badge className="bg-warning/10 text-warning border-warning/20">
            {submissions.filter(s => s.status === 'pending').length} Pending
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {submissions.filter(s => s.status === 'pending').map((submission) => (
            <div key={submission.id} className="border border-border rounded-lg overflow-hidden animate-fade-in">
              {/* Security Warnings */}
              {(submission.plagiarismRisk > 80 || submission.aiContentRisk > 80) && (
                <div className="p-3 bg-warning/5 border-b border-warning/20">
                  <div className="space-y-2">
                    {submission.plagiarismRisk > 80 && (
                      <Alert className="border-warning/30 bg-warning/10">
                        <Copy className="h-4 w-4" />
                        <AlertDescription className="text-warning-foreground">
                          ⚠️ Possible duplicate submission detected (Plagiarism Check: {submission.plagiarismRisk}% similarity)
                        </AlertDescription>
                      </Alert>
                    )}
                    {submission.aiContentRisk > 80 && (
                      <Alert className="border-destructive/30 bg-destructive/10">
                        <Bot className="h-4 w-4" />
                        <AlertDescription className="text-destructive-foreground">
                          ⚠️ Content may be AI-generated (AI Detection: {submission.aiContentRisk}% confidence)
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              )}
              
              <div className="p-4 bg-muted/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-faculty-primary/10">
                      {submission.type === 'Certificate' && <Award className="h-5 w-5 text-faculty-primary" />}
                      {submission.type === 'Activity' && <FileCheck className="h-5 w-5 text-faculty-primary" />}
                      {submission.type === 'Project' && <CheckCircle className="h-5 w-5 text-faculty-primary" />}
                      {submission.type === 'Internship' && <User className="h-5 w-5 text-faculty-primary" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{submission.title}</h4>
                        <Badge className={getTypeColor(submission.type)}>
                          {submission.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Max: {submission.maxMarks} pts
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        <span className="font-medium">{submission.student}</span> ({submission.roll}) • {submission.category}
                      </p>
                      
                      <p className="text-sm text-foreground mb-2">
                        {submission.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {submission.submittedAt}
                        </div>
                        <div className="flex items-center">
                          <FileCheck className="h-3 w-3 mr-1" />
                          {submission.files.length} files
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 bg-success/10 border-success/20 hover:bg-success/20 text-success"
                      onClick={() => handleApproval(submission.id, 'approve')}
                      disabled={activeLoaders.has(`approve_${submission.id}`)}
                    >
                      {activeLoaders.has(`approve_${submission.id}`) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 bg-destructive/10 border-destructive/20 hover:bg-destructive/20 text-destructive"
                      onClick={() => handleApproval(submission.id, 'reject')}
                      disabled={activeLoaders.has(`reject_${submission.id}`)}
                    >
                      {activeLoaders.has(`reject_${submission.id}`) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => setSelectedSubmission(
                        selectedSubmission === submission.id ? null : submission.id
                      )}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Grade & Review
                    </Button>
                  </div>
                </div>
                
                {/* File List */}
                <div className="flex flex-wrap gap-2">
                  {submission.files.map((file, index) => (
                    <div key={index} className="flex items-center space-x-1 px-2 py-1 bg-background rounded text-xs">
                      <FileCheck className="h-3 w-3" />
                      <span>{file}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Grade & Review Section */}
              {selectedSubmission === submission.id && (
                <div className="p-4 border-t border-border bg-muted/10 animate-accordion-down">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-faculty-primary" />
                      <h5 className="font-medium text-sm">Grade & Review Submission</h5>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Marks Section */}
                      <div className="space-y-2">
                        <Label htmlFor={`marks-${submission.id}`}>
                          Marks (out of {submission.maxMarks})
                        </Label>
                        <Input
                          id={`marks-${submission.id}`}
                          type="number"
                          min="0"
                          max={submission.maxMarks}
                          placeholder={`0 - ${submission.maxMarks}`}
                          value={marks[submission.id] || ''}
                          onChange={(e) => setMarks(prev => ({ ...prev, [submission.id]: e.target.value }))}
                          className="focus-ring"
                        />
                      </div>
                      
                      {/* Grade Calculation */}
                      <div className="space-y-2">
                        <Label>Grade Preview</Label>
                        <div className="p-3 bg-faculty-primary/5 rounded-lg border">
                          {marks[submission.id] && !isNaN(Number(marks[submission.id])) ? (
                            <div className="text-center">
                              <span className="text-2xl font-bold text-faculty-primary">
                                {((Number(marks[submission.id]) / submission.maxMarks) * 100).toFixed(1)}%
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {marks[submission.id]}/{submission.maxMarks} marks
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center">
                              Enter marks to see grade
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Feedback Section */}
                    <div className="space-y-2">
                      <Label htmlFor={`feedback-${submission.id}`}>Faculty Feedback</Label>
                      <Textarea
                        id={`feedback-${submission.id}`}
                        placeholder="Provide constructive feedback for the student..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={3}
                        className="focus-ring"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSubmission(null);
                          setFeedback('');
                          setMarks(prev => ({ ...prev, [submission.id]: '' }));
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-destructive/10 border-destructive/20 hover:bg-destructive/20 text-destructive"
                        onClick={() => handleApproval(submission.id, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="gradient-faculty"
                        onClick={() => handleApproval(submission.id, 'approve')}
                        disabled={activeLoaders.has(`approve_${submission.id}`)}
                      >
                        {activeLoaders.has(`approve_${submission.id}`) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Approve & Grade
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};