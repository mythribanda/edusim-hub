import { useState } from 'react';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Input } from '@/institutional/components/ui-ssh/input-ssh';
import { Label } from '@/institutional/components/ui-ssh/label-ssh';
import { Textarea } from '@/institutional/components/ui-ssh/textarea-ssh';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/institutional/components/ui-ssh/select-ssh';
import { Upload, FileText, X, Plus } from 'lucide-react';
import { toast } from '@/institutional/hooks-ssh/use-toast';

interface ActivitySubmissionFormProps {
  onClose: () => void;
  onSubmit: (submission: {
    title: string;
    type: string;
    file: string;
    description: string;
    status: 'pending';
    submittedAt: string;
  }) => void;
}

export function ActivitySubmissionForm({ onClose, onSubmit }: ActivitySubmissionFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    description: '',
    file: ''
  });

  const submissionTypes = [
    'Assignment',
    'Internship Letter',
    'Certificate',
    'Project Report',
    'Competition Proof',
    'Workshop/Training',
    'Other'
  ];

  const handleFileUpload = () => {
    // Mock file upload
    const mockFiles = [
      'document.pdf',
      'certificate.jpg',
      'report.docx',
      'project-demo.mp4',
      'presentation.pptx'
    ];
    const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setFormData(prev => ({ ...prev, file: randomFile }));
    
    toast({
      title: "File Uploaded",
      description: `${randomFile} has been uploaded successfully.`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const submission = {
      ...formData,
      status: 'pending' as const,
      submittedAt: new Date().toLocaleString()
    };

    onSubmit(submission);
    
    toast({
      title: "Submission Created",
      description: "Your activity submission has been sent for faculty approval.",
    });
    
    onClose();
  };

  return (
    <Card className="glass-card max-w-2xl mx-auto animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2 text-student-primary" />
            Submit New Activity
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Submission Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Submission Title *</Label>
            <Input
              id="title"
              placeholder="e.g., AWS Cloud Practitioner Certificate"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="focus-ring"
            />
          </div>

          {/* Submission Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Submission Type *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className="focus-ring">
                <SelectValue placeholder="Select submission type" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {submissionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload File</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-student-primary/50 transition-colors">
              {formData.file ? (
                <div className="flex items-center justify-center space-x-2 text-student-primary">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">{formData.file}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, file: '' }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports PDF, DOC, JPG, PNG (Max 20MB)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFileUpload}
                    className="mt-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description / Notes *</Label>
            <Textarea
              id="description"
              placeholder="Describe your achievement, include key details like scores, duration, skills gained, etc."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="focus-ring"
            />
            <p className="text-xs text-muted-foreground">
              Provide detailed information about your submission to help faculty review it properly.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-student">
              <Plus className="h-4 w-4 mr-2" />
              Submit for Approval
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}