import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/institutional/components/ui-ssh/card-ssh";
import { Badge } from "@/institutional/components/ui-ssh/badge-ssh";
import { BookOpen, Target, CheckCircle, Clock, Search, BookMarked } from "lucide-react";
import { Progress } from "@/institutional/components/ui-ssh/progress-ssh";
import { motion } from "framer-motion";
import { Input } from "@/institutional/components/ui-ssh/input-ssh";
import { Button } from "@/institutional/components/ui-ssh/button-ssh";

const MOCK_POLICIES = [
  { id: '1', title: 'NEP 2020 Core Adoption', status: 'In Progress', progress: 68, deadline: 'Dec 2024' },
  { id: '2', title: 'Multidisciplinary Curriculum', status: 'Delayed', progress: 45, deadline: 'Aug 2024' },
  { id: '3', title: 'Digital Literacy Mandate', status: 'Completed', progress: 100, deadline: 'Jan 2024' },
];

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const AcademicPolicy = () => {
  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-government-primary to-purple-600">
            Academic Policy Management
          </h2>
          <p className="text-muted-foreground">National tracking of curriculum standards and mandate rollouts</p>
        </div>
        <div className="flex w-full md:w-auto space-x-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search policies..." className="pl-8 bg-background/50 backdrop-blur-sm" />
          </div>
          <Button className="gradient-government shadow-lg hover:shadow-government-primary/20 transition-all">
            <Target className="mr-2 h-4 w-4" /> New Mandate
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
          <Card className="glass-card shadow-sm border-purple-100/50 dark:border-purple-900/20 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-government-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-government-primary" />
                Active Implementations
              </CardTitle>
              <CardDescription>Real-time progress of national educational mandates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {MOCK_POLICIES.map((policy) => (
                <div key={policy.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm flex items-center">
                      <BookMarked className="w-4 h-4 mr-2 text-muted-foreground" />
                      {policy.title}
                    </span>
                    <Badge variant={
                      policy.status === 'Completed' ? 'default' : 
                      policy.status === 'Delayed' ? 'destructive' : 'secondary'
                    } className={policy.status === 'Completed' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {policy.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <Progress value={policy.progress} className="h-2 flex-1" />
                    <span className="text-xs font-medium text-muted-foreground w-12 text-right">{policy.progress}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> Target: {policy.deadline}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="glass-card bg-gradient-to-br from-purple-500/10 to-transparent border-purple-200/50 dark:border-purple-900/50">
            <CardHeader>
              <CardTitle className="text-lg">Compliance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-6 space-y-4">
                 <div className="w-32 h-32 rounded-full border-8 border-government-primary flex items-center justify-center shadow-inner relative">
                    <div className="absolute inset-0 rounded-full border-t-8 border-purple-500 animate-pulse" />
                    <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-government-primary to-purple-600">82%</span>
                 </div>
                 <p className="text-center text-sm font-medium">National institutional compliance rate for core policies</p>
                 <div className="flex items-center text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                   <CheckCircle className="w-4 h-4 mr-1" /> +4% from last quarter
                 </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};
