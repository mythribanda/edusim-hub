import { ArrowLeft, Users, BookOpen, BarChart3, MessageCircle } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Card, CardContent, CardHeader } from '@/institutional/components/ui-ssh/card-ssh';
import LoginForm from '@/institutional/components/auth/LoginForm';

const FacultyLogin = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-faculty-secondary/10 to-faculty-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Branding & Info */}
        <div className="hidden lg:block space-y-8 animate-fade-in">
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-faculty mb-4 animate-float">
              <Users className="h-8 w-8 text-white" />
            </div>
            
            <div>
              <h1 className="text-4xl font-bold text-gradient-faculty mb-4">
                Faculty Dashboard
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Empower your teaching with comprehensive tools for course management and student engagement.
              </p>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-faculty-primary/5 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-faculty-primary/20 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-faculty-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Course Creation</h4>
                <p className="text-xs text-muted-foreground">Design and manage curricula</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-faculty-primary/5 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-faculty-primary/20 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-faculty-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Student Analytics</h4>
                <p className="text-xs text-muted-foreground">Track learning progress</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-faculty-primary/5 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-faculty-primary/20 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-faculty-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Communication Hub</h4>
                <p className="text-xs text-muted-foreground">Connect with students</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full animate-slide-up">
          <Card className="glass-card border-faculty-primary/20 shadow-xl">
            <CardHeader className="text-center pb-6">
              <div className="lg:hidden inline-flex items-center justify-center w-12 h-12 rounded-xl gradient-faculty mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gradient-faculty">
                Faculty Login
              </h2>
              <p className="text-muted-foreground text-sm">
                Access your teaching and management tools
              </p>
            </CardHeader>
            
            <CardContent className="pt-0">
              <LoginForm
                role="faculty"
                accentColor="gradient-faculty"
                redirectTo="/dashboard/faculty"
              />
            </CardContent>
          </Card>

          {/* Back button */}
          <div className="mt-6 text-center">
            <Link to="/institutional">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-faculty-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to role selection
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyLogin;