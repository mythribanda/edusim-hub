import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent } from '@/institutional/components/ui-ssh/card-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  Users, 
  Shield, 
  Building2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface RoleCardProps {
  role: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradientClass: string;
  textGradientClass: string;
  glowClass: string;
  path: string;
}

const RoleCard = ({ 
  role, 
  title, 
  description, 
  icon, 
  gradientClass, 
  textGradientClass, 
  glowClass, 
  path 
}: RoleCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-300 transform glass-card border-[1.5px] hover:border-opacity-50 ${glowClass} shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgb(0,0,0,0.08)]`}
      onClick={() => navigate({ to: ('/institutional' + path) as any })}
    >
      <CardContent className="p-8 text-center relative overflow-hidden h-full flex flex-col">
        {/* Background gradient effect */}
        <div className={`absolute inset-0 opacity-0 ${gradientClass} transition-opacity duration-300 group-hover:opacity-[0.03]`} />
        
        {/* Floating particles effect */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-40 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
          <Sparkles className="h-6 w-6 text-current animate-pulse" />
        </div>
        
        <div className="relative z-10 flex-1 flex flex-col items-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-[1.25rem] ${gradientClass} mb-6 shadow-md group-hover:scale-105 transition-transform duration-300 ease-out`}>
            <div className="text-white text-3xl">
              {icon}
            </div>
          </div>
          
          <h3 className={`text-xl font-bold mb-3 ${textGradientClass}`}>
            {title}
          </h3>
          
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed flex-1">
            {description}
          </p>
          
          <Button 
            variant="ghost" 
            className="group-hover:bg-primary/10 transition-colors duration-200 font-semibold w-full mt-auto"
          >
            Sign In as {role}
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
  }
};

const LoginSelector = () => {
  const roles = [
    {
      role: 'Student',
      title: 'Student Portal',
      description: 'Access your courses, track progress, view grades, and connect with peers in your personalized learning environment.',
      icon: <GraduationCap />,
      gradientClass: 'gradient-student',
      textGradientClass: 'text-gradient-student',
      glowClass: 'hover:glow-student',
      path: '/login/student'
    },
    {
      role: 'Faculty',
      title: 'Faculty Dashboard',
      description: 'Manage courses, grade assignments, track student progress, and collaborate with fellow educators.',
      icon: <Users />,
      gradientClass: 'gradient-faculty',
      textGradientClass: 'text-gradient-faculty',
      glowClass: 'hover:glow-faculty',
      path: '/login/faculty'
    },
    {
      role: 'Administrator',
      title: 'Admin Control',
      description: 'Oversee institutional operations, manage users, analyze data, and maintain system configurations.',
      icon: <Shield />,
      gradientClass: 'gradient-admin',
      textGradientClass: 'text-gradient-admin',
      glowClass: 'hover:glow-admin',
      path: '/login/admin'
    },
    {
      role: 'Government',
      title: 'Government Portal',
      description: 'Monitor educational metrics, track institutional compliance, and access regulatory reporting tools.',
      icon: <Building2 />,
      gradientClass: 'gradient-government',
      textGradientClass: 'text-gradient-government',
      glowClass: 'hover:glow-government',
      path: '/login/government'
    }
  ];

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
      
      {/* SaaS Background Soft Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        className="w-full max-w-6xl mx-auto relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.25rem] bg-primary mb-6 shadow-md shadow-primary/20">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight text-foreground">
            Holistic Hub
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto font-medium">
            Your comprehensive EdTech platform for professional student success
          </p>
        </motion.div>

        {/* Role Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role) => (
            <motion.div 
              key={role.role}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="h-full"
            >
              <RoleCard {...role} />
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center mt-16">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Secure • Scalable • Student-Focused
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginSelector;