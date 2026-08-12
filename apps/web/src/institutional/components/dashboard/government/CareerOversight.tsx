import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/institutional/components/ui-ssh/card-ssh";
import { Badge } from "@/institutional/components/ui-ssh/badge-ssh";
import { Briefcase, Building2, TrendingUp, LineChart, Globe, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: any = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const MOCK_INDUSTRY = [
  { sector: 'IT / Software', hires: '1.2M', growth: '+15%', trend: 'up' },
  { sector: 'Manufacturing', hires: '850K', growth: '+8%', trend: 'up' },
  { sector: 'Finance & Banking', hires: '650K', growth: '+12%', trend: 'up' },
  { sector: 'Healthcare', hires: '420K', growth: '+22%', trend: 'up' },
  { sector: 'Consulting', hires: '310K', growth: '-2%', trend: 'down' },
];

export const CareerOversight = () => {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-government-primary to-blue-500">
            National Career Development & Placement Options
          </h2>
          <p className="text-muted-foreground">Aggregated employment outcomes and industry alignments</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
           <Card className="glass-card shadow-sm border-blue-100/50 dark:border-blue-900/20 h-full relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader>
                 <CardTitle className="flex items-center">
                   <Building2 className="w-5 h-5 mr-2 text-blue-500" />
                   Industry Hiring Distribution
                 </CardTitle>
                 <CardDescription>Top hiring sectors across national institutions for 2023-2024</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    {MOCK_INDUSTRY.map((ind, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border cursor-default">
                        <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-xs">
                             0{i+1}
                           </div>
                           <span className="font-medium text-sm">{ind.sector}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                           <span className="text-sm font-bold">{ind.hires}</span>
                           <Badge variant={ind.trend === 'up' ? 'default' : 'destructive'} 
                                  className={ind.trend === 'up' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}>
                              {ind.trend === 'up' ? '↗' : '↘'} {ind.growth}
                           </Badge>
                        </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
           <Card className="glass-card bg-gradient-to-b from-government-primary/10 to-transparent">
             <CardContent className="p-6">
               <div className="flex justify-between items-start mb-4">
                 <div className="p-3 bg-white dark:bg-black rounded-xl shadow-sm">
                   <Briefcase className="w-6 h-6 text-government-primary" />
                 </div>
               </div>
               <h3 className="text-3xl font-black">76.4%</h3>
               <p className="text-sm font-medium text-muted-foreground mt-1">Overall Placement Rate</p>
               <div className="mt-4 flex items-center text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded w-fit">
                 <LineChart className="w-4 h-4 mr-1" /> +2.1% YoY Growth
               </div>
             </CardContent>
           </Card>

           <Card className="glass-card">
             <CardContent className="p-6 space-y-4">
               <div>
                 <p className="text-sm text-muted-foreground flex items-center"><DollarSign className="w-4 h-4 mr-1" /> Average Package</p>
                 <p className="text-xl font-bold mt-1">₹ 6.8 LPA</p>
               </div>
               <div className="pt-4 border-t border-border/50">
                 <p className="text-sm text-muted-foreground flex items-center"><Globe className="w-4 h-4 mr-1" /> Global Placements</p>
                 <p className="text-xl font-bold mt-1">45,000+ <span className="text-xs font-normal text-muted-foreground">students</span></p>
               </div>
             </CardContent>
           </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};
