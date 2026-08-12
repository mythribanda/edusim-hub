import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Progress } from '@/institutional/components/ui-ssh/progress-ssh';
import { Alert, AlertDescription } from '@/institutional/components/ui-ssh/alert-ssh';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Award,
  Lightbulb,
  Clock,
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export const CareerTwin = () => {
  const [selectedCareerPath, setSelectedCareerPath] = useState<string | null>(null);
  
  // Mock AI-generated data
  const [careerData] = useState({
    currentProfile: {
      majorSkills: ['Web Development', 'Data Analysis', 'Problem Solving'],
      interests: ['Artificial Intelligence', 'Machine Learning', 'Software Engineering'],
      strengths: 'Strong in mathematics and programming',
      weaknesses: 'Limited experience in cloud technologies'
    },
    recommendations: {
      skillGaps: [
        {
          skill: 'Cloud Computing (AWS/Azure)',
          importance: 'High',
          reason: 'Essential for modern AI/ML deployment',
          suggestedCourses: ['AWS Cloud Practitioner', 'Azure Fundamentals'],
          timeToComplete: '2-3 months'
        },
        {
          skill: 'Docker & Kubernetes',
          importance: 'Medium',
          reason: 'Critical for scalable application deployment',
          suggestedCourses: ['Docker Essentials', 'Kubernetes Basics'],
          timeToComplete: '1-2 months'
        },
        {
          skill: 'Advanced Statistics',
          importance: 'High',
          reason: 'Foundation for machine learning understanding',
          suggestedCourses: ['Statistics for Data Science', 'Probability Theory'],
          timeToComplete: '3-4 months'
        }
      ],
      workshops: [
        {
          title: 'AI/ML Workshop Series',
          provider: 'Tech Institute',
          relevance: 95,
          duration: '6 weeks',
          nextBatch: '2024-02-01'
        },
        {
          title: 'Full Stack Development Bootcamp',
          provider: 'Code Academy',
          relevance: 85,
          duration: '12 weeks',
          nextBatch: '2024-01-20'
        }
      ],
      studyGroups: [
        {
          name: 'AI Enthusiasts Group',
          members: 24,
          activity: 'Machine Learning Projects',
          compatibility: 'High'
        },
        {
          name: 'Cloud Computing Study Circle',
          members: 18,
          activity: 'AWS Certification Prep',
          compatibility: 'Medium'
        }
      ]
    },
    careerPaths: [
      {
        id: 'ai_engineer',
        title: 'AI/ML Engineer',
        match: 92,
        description: 'Design and implement machine learning systems',
        timeline: '2-3 years',
        salaryRange: '$80k - $150k',
        requiredSkills: ['Python', 'TensorFlow', 'Statistics', 'Cloud Platforms'],
        milestones: [
          { title: 'Complete ML Fundamentals', timeline: '3 months', status: 'completed' },
          { title: 'Build 3 AI Projects', timeline: '6 months', status: 'in_progress' },
          { title: 'Get Cloud Certification', timeline: '9 months', status: 'pending' },
          { title: 'Internship at AI Company', timeline: '12 months', status: 'pending' }
        ]
      },
      {
        id: 'data_scientist',
        title: 'Data Scientist',
        match: 78,
        description: 'Extract insights from complex datasets',
        timeline: '2-4 years',
        salaryRange: '$70k - $140k',
        requiredSkills: ['R/Python', 'Statistics', 'SQL', 'Data Visualization'],
        milestones: [
          { title: 'Master Statistical Analysis', timeline: '4 months', status: 'in_progress' },
          { title: 'Complete Data Science Portfolio', timeline: '8 months', status: 'pending' },
          { title: 'Industry Internship', timeline: '12 months', status: 'pending' },
          { title: 'Publish Research Paper', timeline: '18 months', status: 'pending' }
        ]
      },
      {
        id: 'software_engineer',
        title: 'Software Engineer',
        match: 85,
        description: 'Build scalable software applications',
        timeline: '1-2 years',
        salaryRange: '$65k - $130k',
        requiredSkills: ['Programming', 'System Design', 'Databases', 'DevOps'],
        milestones: [
          { title: 'Master DSA & System Design', timeline: '4 months', status: 'in_progress' },
          { title: 'Build Full-Stack Applications', timeline: '6 months', status: 'pending' },
          { title: 'Open Source Contributions', timeline: '8 months', status: 'pending' },
          { title: 'Technical Interview Prep', timeline: '10 months', status: 'pending' }
        ]
      }
    ],
    growthRoadmap: {
      currentLevel: 'Intermediate',
      nextMilestone: 'Complete Cloud Computing Certification',
      progressToNext: 35,
      estimatedCompletion: '2024-03-15'
    }
  });

  const getMatchColor = (match: number) => {
    if (match >= 90) return 'text-success';
    if (match >= 80) return 'text-student-primary';
    if (match >= 70) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-warning" />;
      default: return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Career Twin Header */}
      <Card className="glass-card border-student-primary/20 glow-student">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-6 w-6 mr-2 text-student-primary" />
            Career Twin - Your AI Mentor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-student-primary/5">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-5 w-5 text-student-primary" />
              </div>
              <p className="text-2xl font-bold text-student-primary">AI Engineer</p>
              <p className="text-sm text-muted-foreground">Best Career Match</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-success/5">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <p className="text-2xl font-bold text-success">92%</p>
              <p className="text-sm text-muted-foreground">Career Alignment</p>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-warning/5">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-warning" />
              </div>
              <p className="text-2xl font-bold text-warning">3</p>
              <p className="text-sm text-muted-foreground">Skill Gaps</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Roadmap */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-student-primary" />
            Your Growth Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold">Current Level: {careerData.growthRoadmap.currentLevel}</h4>
                <p className="text-sm text-muted-foreground">
                  Next Milestone: {careerData.growthRoadmap.nextMilestone}
                </p>
              </div>
              <Badge className="bg-student-primary/10 text-student-primary">
                {careerData.growthRoadmap.progressToNext}% Complete
              </Badge>
            </div>
            
            <Progress value={careerData.growthRoadmap.progressToNext} className="h-3" />
            
            <p className="text-sm text-muted-foreground text-center">
              Estimated completion: {careerData.growthRoadmap.estimatedCompletion}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Skill Gaps & Recommendations */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-student-primary" />
            AI-Powered Skill Gap Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {careerData.recommendations.skillGaps.map((gap, index) => (
              <div key={index} className="p-4 rounded-lg border border-muted/30 hover:border-student-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-student-primary">{gap.skill}</h4>
                    <p className="text-sm text-muted-foreground">{gap.reason}</p>
                  </div>
                  <Badge variant={gap.importance === 'High' ? 'destructive' : 'secondary'}>
                    {gap.importance}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Time to Complete:</span>
                    <span className="font-medium">{gap.timeToComplete}</span>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Suggested Courses:</p>
                    <div className="flex flex-wrap gap-1">
                      {gap.suggestedCourses.map((course, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {course}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Career Path Predictions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-student-primary" />
            Predicted Career Paths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {careerData.careerPaths.map((path) => (
              <Card 
                key={path.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedCareerPath === path.id ? 'ring-2 ring-student-primary' : ''
                }`}
                onClick={() => setSelectedCareerPath(
                  selectedCareerPath === path.id ? null : path.id
                )}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">{path.title}</h4>
                      <span className={`text-lg font-bold ${getMatchColor(path.match)}`}>
                        {path.match}%
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{path.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Timeline:</span>
                        <span className="font-medium">{path.timeline}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Salary Range:</span>
                        <span className="font-medium text-success">{path.salaryRange}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {path.requiredSkills.slice(0, 3).map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {path.requiredSkills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{path.requiredSkills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {selectedCareerPath === path.id && (
                      <div className="border-t pt-3 space-y-3 animate-fade-in">
                        <h5 className="font-medium">Milestone Roadmap:</h5>
                        <div className="space-y-2">
                          {path.milestones.map((milestone, idx) => (
                            <div key={idx} className="flex items-center space-x-3 text-sm">
                              {getMilestoneIcon(milestone.status)}
                              <div className="flex-1">
                                <span className={milestone.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                                  {milestone.title}
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  {milestone.timeline}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workshop Recommendations */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-student-primary" />
              Recommended Workshops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {careerData.recommendations.workshops.map((workshop, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{workshop.title}</h4>
                    <Badge className="bg-student-primary/10 text-student-primary">
                      {workshop.relevance}% match
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {workshop.provider} • {workshop.duration}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Next batch: {workshop.nextBatch}</span>
                    <Button size="sm" variant="outline">
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Enroll
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Study Group Recommendations */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-student-primary" />
              Recommended Study Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {careerData.recommendations.studyGroups.map((group, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{group.name}</h4>
                    <Badge variant={group.compatibility === 'High' ? 'default' : 'secondary'}>
                      {group.compatibility}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {group.members} members • {group.activity}
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    <Users className="h-3 w-3 mr-1" />
                    Join Group
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};