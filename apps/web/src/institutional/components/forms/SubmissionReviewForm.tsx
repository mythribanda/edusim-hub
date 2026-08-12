import { useState } from 'react';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Input } from '@/institutional/components/ui-ssh/input-ssh';
import { Label } from '@/institutional/components/ui-ssh/label-ssh';
import { Textarea } from '@/institutional/components/ui-ssh/textarea-ssh';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/institutional/components/ui-ssh/select-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Separator } from '@/institutional/components/ui-ssh/separator-ssh';
import { FileText, Download, Star, X, Clock } from 'lucide-react';
import { toast } from '@/institutional/hooks-ssh/use-toast';

interface Submission {
  id: string;
  student: string;
  course: string;
  assignment: string;
  submittedAt: string;
  files: string[];
  description?: string;
  status: 'pending' | 'graded';
}

interface SubmissionReviewFormProps {
  submission: Submission;
  onClose: () => void;
  onGraded: (submissionId: string) => void;
}

export function SubmissionReviewForm({ submission, onClose, onGraded }: SubmissionReviewFormProps) {
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rubricScores, setRubricScores] = useState({
    content: '',
    presentation: '',
    creativity: '',
    timeliness: ''
  });

  const rubricCriteria = [
    { key: 'content', label: 'Content & Accuracy', maxPoints: 25 },
    { key: 'presentation', label: 'Presentation & Format', maxPoints: 20 },
    { key: 'creativity', label: 'Creativity & Analysis', maxPoints: 25 },
    { key: 'timeliness', label: 'Timeliness & Completion', maxPoints: 30 }
  ];

  const calculateTotalGrade = () => {
    const total = Object.values(rubricScores).reduce((sum, score) => {
      return sum + (parseInt(score) || 0);
    }, 0);
    return Math.min(total, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!grade && !Object.values(rubricScores).some(score => score)) {
      toast({
        title: "Missing Grade",
        description: "Please provide a grade or rubric scores.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Grade Submitted",
      description: `Grade for ${submission.student} has been recorded.`,
    });
    
    onGraded(submission.id);
    onClose();
  };

  return (
    <Card className="glass-card max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-faculty-primary" />
            Review Submission
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Submission Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-faculty-primary/5 rounded-lg">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Student</Label>
            <p className="font-medium">{submission.student}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Course</Label>
            <p className="font-medium">{submission.course}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Assignment</Label>
            <p className="font-medium">{submission.assignment}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Submitted</Label>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{submission.submittedAt}</p>
            </div>
          </div>
        </div>

        {/* Files */}
        <div>
          <Label className="text-sm font-medium">Submitted Files</Label>
          <div className="mt-2 space-y-2">
            {submission.files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{file}</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Student Description */}
        {submission.description && (
          <div>
            <Label className="text-sm font-medium">Student Notes</Label>
            <div className="mt-2 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm">{submission.description}</p>
            </div>
          </div>
        )}

        <Separator />

        {/* Grading Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rubric Scoring */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Rubric Assessment</Label>
              {rubricCriteria.map((criterion) => (
                <div key={criterion.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{criterion.label}</Label>
                    <Badge variant="secondary" className="text-xs">
                      Max: {criterion.maxPoints}
                    </Badge>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max={criterion.maxPoints}
                    placeholder={`0-${criterion.maxPoints}`}
                    value={rubricScores[criterion.key as keyof typeof rubricScores]}
                    onChange={(e) => setRubricScores(prev => ({
                      ...prev,
                      [criterion.key]: e.target.value
                    }))}
                  />
                </div>
              ))}
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Grade:</span>
                  <Badge className="text-lg px-3 py-1">
                    {calculateTotalGrade()}/100
                  </Badge>
                </div>
              </div>
            </div>

            {/* Alternative Overall Grade & Feedback */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Overall Grade (Alternative)</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+ (97-100)</SelectItem>
                    <SelectItem value="A">A (93-96)</SelectItem>
                    <SelectItem value="A-">A- (90-92)</SelectItem>
                    <SelectItem value="B+">B+ (87-89)</SelectItem>
                    <SelectItem value="B">B (83-86)</SelectItem>
                    <SelectItem value="B-">B- (80-82)</SelectItem>
                    <SelectItem value="C+">C+ (77-79)</SelectItem>
                    <SelectItem value="C">C (73-76)</SelectItem>
                    <SelectItem value="C-">C- (70-72)</SelectItem>
                    <SelectItem value="D">D (60-69)</SelectItem>
                    <SelectItem value="F">F (0-59)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback & Comments</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide constructive feedback for the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <Label>Quick Feedback Templates</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFeedback('Excellent work! Your analysis is thorough and well-presented.')}
                  >
                    Excellent Work
                  </Button>
                  <Button
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => setFeedback('Good effort. Consider expanding your analysis in future submissions.')}
                  >
                    Good Effort
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFeedback('Please review the requirements and resubmit with corrections.')}
                  >
                    Needs Improvement
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-faculty">
              <Star className="h-4 w-4 mr-2" />
              Submit Grade
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}