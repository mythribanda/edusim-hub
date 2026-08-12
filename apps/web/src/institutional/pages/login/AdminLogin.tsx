import { ArrowLeft, Shield, BarChart3, Settings, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Card, CardContent, CardHeader } from '@/institutional/components/ui-ssh/card-ssh';
import LoginForm from '@/institutional/components/auth/LoginForm';

const AdminLogin = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-admin-secondary/10 to-admin-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Branding & Info */}
        <div className="hidden lg:block space-y-8 animate-fade-in">
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-admin mb-4 animate-float">
              <Shield className="h-8 w-8 text-white" />
            </div>
            
            <div>
              <h1 className="text-4xl font-bold text-gradient-admin mb-4">
                Admin Control
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Comprehensive administrative tools for managing your institution's operations and ensuring optimal performance.
              </p>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-admin-primary/5 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-admin-primary/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-admin-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">User Management</h4>
                <p className="text-xs text-muted-foreground">Control access and permissions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-admin-primary/5 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-admin-primary/20 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-admin-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Analytics Dashboard</h4>
                <p className="text-xs text-muted-foreground">Monitor system performance</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-admin-primary/5 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-admin-primary/20 flex items-center justify-center">
                <Settings className="h-4 w-4 text-admin-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">System Configuration</h4>
                <p className="text-xs text-muted-foreground">Customize platform settings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full animate-slide-up">
          <Card className="glass-card border-admin-primary/20 shadow-xl">
            <CardHeader className="text-center pb-6">
              <div className="lg:hidden inline-flex items-center justify-center w-12 h-12 rounded-xl gradient-admin mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gradient-admin">
                Admin Login
              </h2>
              <p className="text-muted-foreground text-sm">
                Access administrative controls and system management
              </p>
            </CardHeader>
            
            <CardContent className="pt-0">
              <LoginForm
                role="admin"
                accentColor="gradient-admin"
                redirectTo="/dashboard/admin"
              />
            </CardContent>
          </Card>

          {/* Back button */}
          <div className="mt-6 text-center">
            <Link to="/institutional">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-admin-primary">
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

export default AdminLogin;