import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Switch } from '@/institutional/components/ui-ssh/switch-ssh';
import { 
  Shield, 
  Download, 
  Share, 
  Eye, 
  Award, 
  CheckCircle,
  ExternalLink,
  Copy,
  FileText,
  Star
} from 'lucide-react';
import { toast } from '@/institutional/hooks-ssh/use-toast';

export const Portfolio = () => {
  const [viewMode, setViewMode] = useState<'student' | 'recruiter'>('student');
  
  // Mock portfolio data
  const [portfolioData] = useState({
    profile: {
      name: 'Alex Johnson',
      program: 'Computer Science Engineering',
      year: '3rd Year',
      gpa: 3.7,
      university: 'Tech University',
      blockchainId: '0x1234...5678'
    },
    achievements: [
      {
        id: 1,
        title: 'AWS Cloud Practitioner Certified',
        category: 'Certification',
        date: '2024-01-10',
        issuer: 'Amazon Web Services',
        verified: true,
        blockchainHash: '0xabcd...1234',
        description: 'Demonstrated foundational knowledge of AWS Cloud',
        skills: ['Cloud Computing', 'AWS', 'Infrastructure'],
        points: 50
      },
      {
        id: 2,
        title: 'AI Hackathon - 2nd Place',
        category: 'Competition',
        date: '2024-01-05',
        issuer: 'Tech Innovation Hub',
        verified: true,
        blockchainHash: '0xefgh...5678',
        description: 'Built an AI-powered healthcare diagnostic tool',
        skills: ['Machine Learning', 'Python', 'Healthcare AI'],
        points: 100
      },
      {
        id: 3,
        title: 'Full Stack Web Development',
        category: 'Course',
        date: '2023-12-20',
        issuer: 'Code Academy',
        verified: true,
        blockchainHash: '0xijkl...9012',
        description: 'Completed comprehensive full-stack development course',
        skills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
        points: 75
      },
      {
        id: 4,
        title: 'Summer Internship - Software Engineer',
        category: 'Experience',
        date: '2023-08-31',
        issuer: 'TechCorp Solutions',
        verified: true,
        blockchainHash: '0xmnop...3456',
        description: 'Developed microservices architecture for e-commerce platform',
        skills: ['Java', 'Spring Boot', 'Microservices', 'Docker'],
        points: 120
      },
      {
        id: 5,
        title: 'Community Volunteer - Tech Education',
        category: 'Volunteer',
        date: '2023-11-15',
        issuer: 'Digital Literacy Foundation',
        verified: true,
        blockchainHash: '0xqrst...7890',
        description: 'Taught programming basics to underprivileged students',
        skills: ['Teaching', 'Python', 'Community Service'],
        points: 40
      }
    ],
    stats: {
      totalPoints: 385,
      verifiedAchievements: 5,
      skillCategories: 12,
      portfolioViews: 247
    }
  });

  const handleDownloadPDF = () => {
    toast({
      title: "Portfolio Download",
      description: `Downloading ${viewMode === 'student' ? 'detailed' : 'recruiter-friendly'} portfolio as PDF...`,
    });
  };

  const handleSharePortfolio = () => {
    const shareUrl = `https://portfolio.edtech.com/student/${portfolioData.profile.blockchainId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Portfolio Link Copied",
      description: "Shareable portfolio link copied to clipboard!",
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Certification': return <Award className="h-4 w-4" />;
      case 'Competition': return <Star className="h-4 w-4" />;
      case 'Course': return <FileText className="h-4 w-4" />;
      case 'Experience': return <CheckCircle className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Certification': return 'bg-student-primary/10 text-student-primary border-student-primary/20';
      case 'Competition': return 'bg-warning/10 text-warning border-warning/20';
      case 'Course': return 'bg-success/10 text-success border-success/20';
      case 'Experience': return 'bg-student-accent/10 text-student-accent border-student-accent/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <Card className="glass-card border-student-primary/20 glow-student">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center text-2xl">
                <Shield className="h-6 w-6 mr-2 text-student-primary" />
                Blockchain-Verified Portfolio
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Immutable, tamper-proof record of your achievements
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm">Student View</span>
                <Switch 
                  checked={viewMode === 'recruiter'} 
                  onCheckedChange={(checked) => setViewMode(checked ? 'recruiter' : 'student')}
                />
                <span className="text-sm">Recruiter View</span>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleSharePortfolio}>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button onClick={handleDownloadPDF} className="gradient-student">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Portfolio Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-student-primary/5">
              <p className="text-2xl font-bold text-student-primary">{portfolioData.stats.totalPoints}</p>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success/5">
              <p className="text-2xl font-bold text-success">{portfolioData.stats.verifiedAchievements}</p>
              <p className="text-sm text-muted-foreground">Verified Achievements</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-warning/5">
              <p className="text-2xl font-bold text-warning">{portfolioData.stats.skillCategories}</p>
              <p className="text-sm text-muted-foreground">Skill Categories</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-student-accent/5">
              <p className="text-2xl font-bold text-student-accent">{portfolioData.stats.portfolioViews}</p>
              <p className="text-sm text-muted-foreground">Portfolio Views</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="font-semibold">{portfolioData.profile.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Program</label>
                <p className="font-semibold">{portfolioData.profile.program}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Academic Year</label>
                <p className="font-semibold">{portfolioData.profile.year}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">University</label>
                <p className="font-semibold">{portfolioData.profile.university}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current GPA</label>
                <p className="font-semibold text-student-primary">{portfolioData.profile.gpa}</p>
              </div>
              {viewMode === 'student' && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Blockchain ID</label>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-sm">{portfolioData.profile.blockchainId}</p>
                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(portfolioData.profile.blockchainId)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-student-primary" />
            Verified Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {portfolioData.achievements.map((achievement) => (
              <Card key={achievement.id} className="border border-muted/30 hover:border-student-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Achievement Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {getCategoryIcon(achievement.category)}
                          <h4 className="font-semibold">{achievement.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {achievement.issuer} • {achievement.date}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        <Badge className={getCategoryColor(achievement.category)}>
                          {achievement.category}
                        </Badge>
                        {achievement.verified && (
                          <div className="flex items-center text-success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            <span className="text-xs">Verified ✅</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm">{achievement.description}</p>

                    {/* Skills */}
                    <div>
                      <p className="text-xs font-medium mb-1">Skills Demonstrated:</p>
                      <div className="flex flex-wrap gap-1">
                        {achievement.skills.map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Points & Blockchain Info */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-student-primary">
                          {achievement.points} points
                        </span>
                        {viewMode === 'student' && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Shield className="h-3 w-3 mr-1" />
                            <code className="bg-muted/50 px-1 rounded">
                              {achievement.blockchainHash}
                            </code>
                          </div>
                        )}
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Actions */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div>
              <h3 className="font-semibold mb-1">Share Your Portfolio</h3>
              <p className="text-sm text-muted-foreground">
                Share your blockchain-verified achievements with employers and institutions
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview Portfolio
              </Button>
              <Button onClick={handleSharePortfolio}>
                <Share className="h-4 w-4 mr-2" />
                Get Shareable Link
              </Button>
              <Button onClick={handleDownloadPDF} className="gradient-student">
                <Download className="h-4 w-4 mr-2" />
                Export as PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};