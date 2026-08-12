import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/institutional/components/ui-ssh/card-ssh";
import { Badge } from "@/institutional/components/ui-ssh/badge-ssh";
import { Star, Medal, CheckCircle2, ChevronRight, Award } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: any = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const SCHOLARS = [
  { name: 'Priya Sharma', category: 'National Science Fellow', inst: 'IISc Bangalore', amount: '₹5L Grant' },
  { name: 'Rahul Verma', category: 'Innovation Gold', inst: 'IIT Bombay', amount: '₹2L Award' },
  { name: 'Aisha Patel', category: 'Arts & Culture MVP', inst: 'JNU Delhi', amount: 'Fully Funded' },
];

export const AchievementRecognition = () => {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="mb-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-government-primary to-yellow-600">
          Achievement Recognition & Certification
        </h2>
        <p className="text-muted-foreground">National awards, scholarships, and exceptional merit tracking</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
            <Card className="glass-card bg-gradient-to-tr from-yellow-500/10 to-orange-500/10 border-yellow-200/50">
               <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4 shadow-inner">
                     <Star className="w-8 h-8 text-yellow-600 fill-yellow-600" />
                  </div>
                  <h3 className="text-4xl font-black mb-2">45K+</h3>
                  <p className="text-sm font-medium text-muted-foreground">Scholarships Disbursed (YTD)</p>
               </CardContent>
            </Card>
            
            <Card className="glass-card">
               <CardHeader>
                 <CardTitle className="text-lg">Allocation by Category</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  {[
                    { label: 'Merit-based', percent: '60%', color: 'from-blue-500 to-blue-600' },
                    { label: 'Need-based', percent: '25%', color: 'from-green-500 to-green-600' },
                    { label: 'Sports & Arts', percent: '15%', color: 'from-yellow-500 to-orange-500' }
                  ].map((cat, i) => (
                    <div key={i} className="space-y-1 relative">
                       <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-muted-foreground">{cat.label}</span>
                          <span className="font-bold">{cat.percent}</span>
                       </div>
                       <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                         <div className={`h-full bg-gradient-to-r ${cat.color} rounded-full`} style={{ width: cat.percent }} />
                       </div>
                    </div>
                  ))}
               </CardContent>
            </Card>
         </motion.div>

         <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="glass-card h-full relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-32 bg-yellow-400/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-yellow-400/10 transition-colors duration-700" />
               <CardHeader>
                  <CardTitle className="flex items-center">
                     <Medal className="w-5 h-5 mr-2 text-yellow-600" />
                     Recent Laureates
                  </CardTitle>
                  <CardDescription>Top students recognized nationally across all institutions</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  {SCHOLARS.map((scholar, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group/item">
                       <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center border border-yellow-200/50">
                             <Award className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                             <h4 className="font-bold">{scholar.name}</h4>
                             <p className="text-sm text-muted-foreground">{scholar.inst} • {scholar.category}</p>
                          </div>
                       </div>
                       <div className="flex items-center space-x-4">
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200">
                             {scholar.amount}
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover/item:translate-x-1 transition-transform" />
                       </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 pt-4 border-t border-border flex justify-center text-sm">
                     <span className="text-government-primary font-medium hover:underline cursor-pointer flex items-center">
                        View Complete National Registry <ChevronRight className="w-4 h-4 ml-1" />
                     </span>
                  </div>
               </CardContent>
            </Card>
         </motion.div>
      </div>
    </motion.div>
  );
};
