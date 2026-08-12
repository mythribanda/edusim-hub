import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/institutional/components/ui-ssh/card-ssh";
import { Badge } from "@/institutional/components/ui-ssh/badge-ssh";
import { ShieldCheck, FileCheck, Search, Link2, Database, Key } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/institutional/components/ui-ssh/input-ssh";
import { Button } from "@/institutional/components/ui-ssh/button-ssh";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

const MOCK_LEDGER = [
  { id: 'tx_8923a', inst: 'IIT Delhi', timestamp: '2 mins ago', type: 'Degree Grant', hash: '0x8f...3a9c' },
  { id: 'tx_8923b', inst: 'NIT Trichy', timestamp: '15 mins ago', type: 'Skill Cert', hash: '0x2b...91dd' },
  { id: 'tx_8923c', inst: 'BITS Pilani', timestamp: '1 hour ago', type: 'Transcript', hash: '0x7e...cc41' },
];

export const PortfolioStandards = () => {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-government-primary to-green-600">
            Portfolio Standards & Verification
          </h2>
          <p className="text-muted-foreground">Blockchain ledger monitor for academic credential issuance</p>
        </div>
        <div className="flex space-x-2">
           <Button variant="outline" className="shadow-sm border-government-primary/20 hover:bg-government-primary/5">
             <Key className="w-4 h-4 mr-2 text-government-primary" /> API Keys
           </Button>
           <Button className="bg-green-600 hover:bg-green-700 text-white shadow-lg">
             <FileCheck className="w-4 h-4 mr-2" /> Audit Ledger
           </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <motion.div variants={itemVariants} className="space-y-6">
            <Card className="glass-card bg-gradient-to-br from-green-500/10 to-transparent border-green-200/50">
               <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                     <ShieldCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-3xl font-black mb-1">12.4M</h3>
                  <p className="text-sm font-medium text-muted-foreground">Total Verified Portfolios</p>
                  <p className="text-xs text-green-600 mt-4 flex items-center bg-green-50 dark:bg-green-900/20 w-fit px-2 py-1 rounded">
                    Network Status: Healthy (99.9% Uptime)
                  </p>
               </CardContent>
            </Card>

            <Card className="glass-card">
               <CardHeader>
                  <CardTitle className="text-sm">Quick Verify Tool</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <Input placeholder="Enter Document Hash (0x...)" className="bg-muted/50" />
                  <Button className="w-full" variant="outline">
                     <Search className="w-4 h-4 mr-2" /> Look Up Record
                  </Button>
               </CardContent>
            </Card>
         </motion.div>

         <motion.div variants={itemVariants} className="md:col-span-2">
            <Card className="glass-card h-full">
               <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="w-5 h-5 mr-2 text-green-600" />
                    Live Ledger Activity
                  </CardTitle>
                  <CardDescription>Real-time stream of national block mints</CardDescription>
               </CardHeader>
               <CardContent>
                  <div className="space-y-4">
                     {MOCK_LEDGER.map((tx) => (
                       <div key={tx.id} className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                             <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded text-green-600">
                               <Link2 className="w-4 h-4" />
                             </div>
                             <div>
                                <p className="font-medium text-sm">{tx.inst}</p>
                                <p className="text-xs text-muted-foreground">{tx.timestamp} • {tx.type}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <code className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                               {tx.hash}
                             </code>
                             <p className="text-[10px] text-muted-foreground mt-1">Status: Confirmed</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </CardContent>
            </Card>
         </motion.div>
      </div>
    </motion.div>
  );
};
