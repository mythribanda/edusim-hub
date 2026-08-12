import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/institutional/components/ui-ssh/card-ssh";
import { Badge } from "@/institutional/components/ui-ssh/badge-ssh";
import { Trophy, Activity, Users, Award, TrendingUp, Target } from "lucide-react";
import { Progress } from "@/institutional/components/ui-ssh/progress-ssh";
import { motion } from "framer-motion";

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const TOP_SKILLS = [
  { name: 'Data Science & AI', growth: '+45%', value: 85, color: 'bg-blue-500' },
  { name: 'Sustainable Engineering', growth: '+32%', value: 70, color: 'bg-green-500' },
  { name: 'Creative Arts & UI/UX', growth: '+18%', value: 60, color: 'bg-purple-500' },
];

export const NationalActivities = () => {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="mb-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-government-primary to-orange-500">
          National Activities & Skills Oversight
        </h2>
        <p className="text-muted-foreground">Mapping extracurricular engagement and emerging competencies</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Registered Events', value: '14,230', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { title: 'Active Student Clubs', value: '8,450', icon: Users, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
          { title: 'Olympiad Participants', value: '1.2M', icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { title: 'Innovation Awards', value: '342', icon: Award, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' }
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="glass-card hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-md cursor-pointer">
              <CardContent className="p-6">
                <div className={`p-3 w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <motion.div variants={itemVariants}>
          <Card className="glass-card h-full relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors duration-700" />
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-orange-500" />
                Emerging Skill Clusters
              </CardTitle>
              <CardDescription>Fastest growing extracurricular domain alignments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {TOP_SKILLS.map((skill, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{skill.name}</span>
                    <Badge variant="outline" className="text-green-600 bg-green-50 items-center">
                      <TrendingUp className="w-3 h-3 mr-1" /> {skill.growth}
                    </Badge>
                  </div>
                  <Progress value={skill.value} className={`h-2 [&>div]:${skill.color}`} />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass-card h-full bg-gradient-to-br from-government-primary/5 to-transparent">
             <CardHeader>
               <CardTitle>Regional Engagement Map</CardTitle>
               <CardDescription>Geographic distribution of extracurricular activities</CardDescription>
             </CardHeader>
             <CardContent className="flex items-center justify-center p-12">
               <div className="w-full h-48 border-2 border-dashed border-government-primary/30 rounded-xl flex items-center justify-center text-muted-foreground bg-government-primary/5 backdrop-blur-sm">
                 Interactive Map Integration Pending
               </div>
             </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};
