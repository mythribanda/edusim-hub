import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Progress } from '@/institutional/components/ui-ssh/progress-ssh';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Target,
  Users,
  GraduationCap,
  Building2,
  Lightbulb,
  BarChart3,
  Activity
} from 'lucide-react';
import { toast } from '@/institutional/hooks-ssh/use-toast';

export const PredictiveAnalytics = () => {
  const [selectedModel, setSelectedModel] = useState('attendance');

  const [predictiveModels] = useState({
    attendance: {
      title: 'Attendance Trend Forecasting',
      accuracy: 89.2,
      confidence: 'High',
      prediction: 'downward',
      predictions: [
        { department: 'Computer Science', current: 82.5, predicted: 78.2, trend: -4.3, risk: 'medium' },
        { department: 'Mechanical Eng', current: 76.8, predicted: 72.1, trend: -4.7, risk: 'high' },
        { department: 'Electronics', current: 84.2, predicted: 85.8, trend: +1.6, risk: 'low' },
        { department: 'Civil Engineering', current: 79.1, predicted: 76.8, trend: -2.3, risk: 'medium' }
      ]
    },
    performance: {
      title: 'Academic Performance Prediction',
      accuracy: 92.7,
      confidence: 'Very High',
      prediction: 'stable',
      predictions: [
        { department: 'Computer Science', current: 78.5, predicted: 80.2, trend: +1.7, risk: 'low' },
        { department: 'Mechanical Eng', current: 74.2, predicted: 72.8, trend: -1.4, risk: 'medium' },
        { department: 'Electronics', current: 81.6, predicted: 83.1, trend: +1.5, risk: 'low' },
        { department: 'Civil Engineering', current: 76.8, predicted: 75.9, trend: -0.9, risk: 'low' }
      ]
    },
    resources: {
      title: 'Resource Allocation Optimization',
      accuracy: 85.4,
      confidence: 'High',
      prediction: 'reallocation_needed',
      predictions: [
        { department: 'Computer Science', allocation: 35, recommended: 42, change: '+7%', priority: 'high' },
        { department: 'Mechanical Eng', allocation: 28, recommended: 25, change: '-3%', priority: 'low' },
        { department: 'Electronics', allocation: 22, recommended: 20, change: '-2%', priority: 'low' },
        { department: 'Civil Engineering', allocation: 15, recommended: 13, change: '-2%', priority: 'medium' }
      ]
    }
  });

  const [recommendations] = useState([
    {
      id: 1,
      type: 'Critical',
      title: 'Intervention Required - Mechanical Engineering',
      description: 'Attendance in Mechanical Engineering is predicted to drop below 70% threshold.',
      impact: 'High',
      timeframe: '2-3 weeks',
      actions: ['Increase faculty engagement', 'Implement attendance monitoring', 'Student counseling sessions'],
      confidence: 89
    },
    {
      id: 2,
      type: 'Opportunity',
      title: 'Resource Reallocation - Computer Science',
      description: 'Computer Science department shows high demand and performance. Consider increasing resource allocation.',
      impact: 'Medium',
      timeframe: 'Next semester',
      actions: ['Increase faculty allocation', 'Expand lab facilities', 'Additional course sections'],
      confidence: 94
    },
    {
      id: 3,
      type: 'Warning',
      title: 'Performance Decline Risk - Multiple Departments',
      description: 'Cross-departmental analysis shows potential performance decline in 2 departments.',
      impact: 'Medium',
      timeframe: '4-6 weeks',
      actions: ['Faculty training programs', 'Curriculum review', 'Student support initiatives'],
      confidence: 78
    }
  ]);

  const handleRunPrediction = (modelType: string) => {
    toast({
      title: "Prediction Model Running",
      description: `${modelType} prediction model is being executed with latest data.`,
    });
  };

  const handleImplementRecommendation = (recommendationId: number) => {
    const rec = recommendations.find(r => r.id === recommendationId);
    toast({
      title: "Recommendation Scheduled",
      description: `Implementation plan for "${rec?.title}" has been created.`,
    });
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'Critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'Opportunity': return <Target className="h-5 w-5 text-green-500" />;
      case 'Warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default: return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
  };

  const currentModel = predictiveModels[selectedModel as keyof typeof predictiveModels];

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center">
              <Brain className="h-6 w-6 mr-2 text-admin-primary" />
              AI-Powered Predictive Analytics
            </h3>
            <Button
              className="gradient-admin"
              onClick={() => handleRunPrediction(currentModel.title)}
            >
              <Activity className="h-4 w-4 mr-2" />
              Run Analysis
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant={selectedModel === 'attendance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedModel('attendance')}
            >
              <Users className="h-4 w-4 mr-1" />
              Attendance
            </Button>
            <Button
              variant={selectedModel === 'performance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedModel('performance')}
            >
              <GraduationCap className="h-4 w-4 mr-1" />
              Performance
            </Button>
            <Button
              variant={selectedModel === 'resources' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedModel('resources')}
            >
              <Building2 className="h-4 w-4 mr-1" />
              Resources
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Model Overview */}
      <Card className="glass-card border-admin-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{currentModel.title}</span>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                {currentModel.accuracy}% Accuracy
              </Badge>
              <Badge variant="outline">
                {currentModel.confidence} Confidence
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedModel === 'resources' ? (
              currentModel.predictions.map((pred: any, index: number) => (
                <div key={index} className="p-4 rounded-lg bg-admin-primary/5">
                  <h4 className="font-medium mb-2">{pred.department}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current:</span>
                      <span>{pred.allocation}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recommended:</span>
                      <span className="font-medium">{pred.recommended}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Change:</span>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(parseFloat(pred.change))}
                        <span className="font-medium">{pred.change}</span>
                      </div>
                    </div>
                    <Badge className={getRiskColor(pred.priority)}>
                      {pred.priority} priority
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              currentModel.predictions.map((pred: any, index: number) => (
                <div key={index} className="p-4 rounded-lg bg-admin-primary/5">
                  <h4 className="font-medium mb-2">{pred.department}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current:</span>
                      <span>{pred.current}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Predicted:</span>
                      <span className="font-medium">{pred.predicted}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Trend:</span>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(pred.trend)}
                        <span className="font-medium">{pred.trend > 0 ? '+' : ''}{pred.trend}%</span>
                      </div>
                    </div>
                    <Badge className={getRiskColor(pred.risk)}>
                      {pred.risk} risk
                    </Badge>
                  </div>
                  <Progress value={pred.predicted} className="mt-2 h-2" />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-admin-primary" />
            AI-Generated Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    {getRecommendationIcon(rec.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{rec.title}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            rec.type === 'Critical' ? 'border-red-200 text-red-700' :
                            rec.type === 'Opportunity' ? 'border-green-200 text-green-700' :
                            'border-orange-200 text-orange-700'
                          }`}
                        >
                          {rec.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-3">
                        <span>Impact: <span className="font-medium">{rec.impact}</span></span>
                        <span>Timeframe: <span className="font-medium">{rec.timeframe}</span></span>
                        <span>Confidence: <span className="font-medium">{rec.confidence}%</span></span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Recommended Actions:</p>
                        <ul className="text-xs space-y-1">
                          {rec.actions.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-center">
                              <div className="w-1 h-1 bg-admin-primary rounded-full mr-2"></div>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleImplementRecommendation(rec.id)}
                  >
                    Implement
                  </Button>
                </div>
                
                <Progress value={rec.confidence} className="h-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};