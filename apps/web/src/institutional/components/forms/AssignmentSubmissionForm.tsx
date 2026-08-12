import { useState } from 'react';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/institutional/components/ui-ssh/card-ssh';
import { Input } from '@/institutional/components/ui-ssh/input-ssh';
import { Label } from '@/institutional/components/ui-ssh/label-ssh';
import { Textarea } from '@/institutional/components/ui-ssh/textarea-ssh';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/institutional/components/ui-ssh/select-ssh';
import { UploadCloud, FileText, X, CheckCircle2, FileVideo, FileCode2, Paperclip } from 'lucide-react';
import { toast } from '@/institutional/hooks-ssh/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface AssignmentSubmissionFormProps {
  onClose: () => void;
}

const containerVariants: any = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1, type: "spring", stiffness: 300, damping: 25 }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

export function AssignmentSubmissionForm({ onClose }: AssignmentSubmissionFormProps) {
  const [formData, setFormData] = useState({
    course: '',
    assignment: '',
    description: '',
    files: [] as File[]
  });
  
  const [isDragging, setIsDragging] = useState(false);

  // Mock data for courses
  const courses = [
    { id: '1', name: 'Mathematics 101' },
    { id: '2', name: 'Physics Lab' },
    { id: '3', name: 'Computer Science' },
    { id: '4', name: 'English Literature' }
  ];

  // Mock data for assignments
  const assignments = {
    '1': ['Problem Set 5', 'Midterm Project', 'Final Exam'],
    '2': ['Lab Report 3', 'Experiment Analysis', 'Group Project'],
    '3': ['Programming Assignment 2', 'Database Design', 'Web App Project'],
    '4': ['Essay on Shakespeare', 'Literary Analysis', 'Research Paper']
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addFiles(Array.from(event.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...newFiles].slice(0, 5) // Hard cap at 5 files
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (type.includes('image')) return <FileVideo className="h-4 w-4 text-blue-500" />;
    if (type.includes('zip') || type.includes('rar')) return <Paperclip className="h-4 w-4 text-yellow-600" />;
    return <FileCode2 className="h-4 w-4 text-green-500" />;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.course || !formData.assignment) {
      toast({
        title: "Missing Information",
        description: "Please dynamically link this submission to a course and assignment.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Assignment Uploaded ✅",
      description: "Your files have been successfully pushed to the grading queue.",
    });
    
    onClose();
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full">
      <Card className="glass-card max-w-2xl mx-auto shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-32 bg-student-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-student-primary/10 transition-colors duration-700 pointer-events-none" />
        
        <CardHeader className="border-b border-border/40 pb-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center bg-clip-text text-transparent bg-gradient-to-r from-student-primary to-blue-600">
                <FileText className="h-6 w-6 mr-3 text-student-primary" />
                Submit Assignment
              </CardTitle>
              <CardDescription className="mt-1">Provide deliverables for your courses</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted text-muted-foreground">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="course" className="text-sm font-semibold">Related Course</Label>
                <Select value={formData.course} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, course: value, assignment: '' }))
                }>
                  <SelectTrigger className="bg-background/50 hover:bg-background/80 transition-colors">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] bg-popover shadow-xl border-border/50">
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id} className="cursor-pointer font-medium hover:bg-muted/50">
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="assignment" className="text-sm font-semibold">Active Assignment</Label>
                <Select disabled={!formData.course} value={formData.assignment} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, assignment: value }))
                }>
                  <SelectTrigger className="bg-background/50 hover:bg-background/80 transition-colors">
                    <SelectValue placeholder={formData.course ? "Select an assignment" : "Select a course first"} />
                  </SelectTrigger>
                  {formData.course && (
                    <SelectContent className="z-[9999] bg-popover shadow-xl border-border/50">
                      {assignments[formData.course as keyof typeof assignments]?.map(assignment => (
                        <SelectItem key={assignment} value={assignment} className="cursor-pointer font-medium hover:bg-muted/50">
                          {assignment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  )}
                </Select>
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">Submission Remarks (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Include brief notes or specific citations regarding your deliverables..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="bg-background/50 hover:bg-background/80 transition-colors resize-none"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label className="text-sm font-semibold">Upload Deliverables</Label>
              <div 
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 group ${
                  isDragging 
                    ? 'border-student-primary bg-student-primary/10' 
                    : 'border-muted-foreground/30 hover:border-student-primary/50 hover:bg-muted/30'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.png"
                />
                
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 transition-colors duration-300 ${
                  isDragging ? 'bg-student-primary scale-110' : 'bg-muted group-hover:bg-student-primary/20'
                }`}>
                  <UploadCloud className={`h-8 w-8 transition-colors duration-300 ${
                    isDragging ? 'text-white' : 'text-muted-foreground group-hover:text-student-primary'
                  }`} />
                </div>
                
                <h3 className="text-lg font-bold mb-1">
                  Drag & Drop files here
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  or click to browse your device
                </p>
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground font-medium bg-background/50 w-fit mx-auto px-3 py-1 rounded-full border border-border/50">
                  <span className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> PDF, DOC, ZIP, JPG</span>
                  <span>•</span>
                  <span>Max 5 files</span>
                </div>
              </div>
            </motion.div>

            {/* Dynamic File List Rendering */}
            <AnimatePresence>
              {formData.files.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <Label className="text-sm font-semibold">Attached Files ({formData.files.length}/5)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <AnimatePresence>
                      {formData.files.map((file, index) => (
                        <motion.div 
                          key={`${file.name}-${index}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                          layout
                          className="flex items-center justify-between p-3 bg-card border border-border/50 shadow-sm rounded-lg hover:shadow-md transition-shadow group/file"
                        >
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="p-2 bg-muted rounded">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="flex flex-col truncate">
                              <span className="text-sm font-semibold truncate" title={file.name}>
                                {file.name}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 opacity-0 group-hover/file:opacity-100 transition-opacity"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants} className="flex justify-end space-x-4 pt-4 border-t border-border/40">
              <Button type="button" variant="ghost" onClick={onClose} className="font-semibold px-6 hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" className="font-semibold px-8 shadow-lg gradient-student text-white hover:scale-105 transition-transform duration-200" disabled={formData.files.length === 0}>
                Finalize Submission
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}