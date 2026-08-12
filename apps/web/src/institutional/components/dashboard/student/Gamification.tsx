import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/institutional/components/ui-ssh/card-ssh';
import { Button } from '@/institutional/components/ui-ssh/button-ssh';
import { Badge } from '@/institutional/components/ui-ssh/badge-ssh';
import { Progress } from '@/institutional/components/ui-ssh/progress-ssh';
import { Avatar, AvatarFallback } from '@/institutional/components/ui-ssh/avatar-ssh';
import { 
  Trophy, 
  Star, 
  Target, 
  Flame, 
  Award, 
  Users, 
  TrendingUp,
  Calendar,
  CheckCircle,
  Zap
} from 'lucide-react';

export const Gamification = () => {
  const [activeTab, setActiveTab] = useState('achievements');
  
  // Mock gamification data
  const [gamificationData] = useState({
    playerStats: {
      level: 12,
      currentXP: 2450,
      nextLevelXP: 3000,
      totalPoints: 2450,
      streak: 15,
      rank: 3,
      totalStudents: 127
    },
    badges: [
      {
        id: 1,
        name: 'Workshop Champion',
        description: 'Completed 10+ workshops',
        icon: '🏆',
        earned: true,
        earnedDate: '2024-01-10',
        rarity: 'gold',
        progress: 100
      },
      {
        id: 2,
        name: 'Top Volunteer',
        description: 'Volunteered 50+ hours',
        icon: '❤️',
        earned: true,
        earnedDate: '2024-01-05',
        rarity: 'silver',
        progress: 100
      },
      {
        id: 3,
        name: 'Consistent Performer',
        description: 'Maintained 15-day streak',
        icon: '🔥',
        earned: true,
        earnedDate: '2024-01-15',
        rarity: 'bronze',
        progress: 100
      },
      {
        id: 4,
        name: 'AI Pioneer',
        description: 'Complete 5 AI-related activities',
        icon: '🤖',
        earned: false,
        earnedDate: null,
        rarity: 'platinum',
        progress: 60
      },
      {
        id: 5,
        name: 'Team Player',
        description: 'Join 3 study groups',
        icon: '👥',
        earned: false,
        earnedDate: null,
        rarity: 'gold',
        progress: 33
      },
      {
        id: 6,
        name: 'Early Bird',
        description: 'Submit 5 assignments early',
        icon: '🌅',
        earned: false,
        earnedDate: null,
        rarity: 'silver',
        progress: 80
      }
    ],
    leaderboard: [
      { rank: 1, name: 'Sarah Chen', points: 3250, level: 15, avatar: 'SC' },
      { rank: 2, name: 'Michael Rodriguez', points: 2890, level: 14, avatar: 'MR' },
      { rank: 3, name: 'Alex Johnson', points: 2450, level: 12, avatar: 'AJ', isCurrentUser: true },
      { rank: 4, name: 'Emma Thompson', points: 2380, level: 12, avatar: 'ET' },
      { rank: 5, name: 'David Kim', points: 2120, level: 11, avatar: 'DK' },
      { rank: 6, name: 'Lisa Anderson', points: 1950, level: 10, avatar: 'LA' },
      { rank: 7, name: 'James Wilson', points: 1820, level: 10, avatar: 'JW' },
      { rank: 8, name: 'Maria Garcia', points: 1750, level: 9, avatar: 'MG' }
    ],
    dailyMissions: [
      {
        id: 1,
        title: 'Upload Achievement',
        description: 'Upload 1 new certificate or activity',
        progress: 0,
        target: 1,
        xpReward: 50,
        completed: false
      },
      {
        id: 2,
        title: 'Study Session',
        description: 'Complete a 30-minute study session',
        progress: 30,
        target: 30,
        xpReward: 30,
        completed: true
      },
      {
        id: 3,
        title: 'Peer Interaction',
        description: 'Participate in a study group discussion',
        progress: 0,
        target: 1,
        xpReward: 40,
        completed: false
      }
    ],
    weeklyMissions: [
      {
        id: 1,
        title: 'Skill Builder',
        description: 'Complete 3 skill-building activities',
        progress: 2,
        target: 3,
        xpReward: 150,
        completed: false
      },
      {
        id: 2,
        title: 'Perfect Attendance',
        description: 'Maintain 100% attendance this week',
        progress: 5,
        target: 7,
        xpReward: 200,
        completed: false
      }
    ]
  });

  const getBadgeRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'platinum': return 'bg-gradient-to-r from-slate-400 to-slate-600 text-white';
      case 'gold': return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'silver': return 'bg-gradient-to-r from-slate-300 to-slate-500 text-white';
      case 'bronze': return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 15) return 'text-purple-500';
    if (level >= 10) return 'text-blue-500';
    if (level >= 5) return 'text-green-500';
    return 'text-gray-500';
  };

  const xpProgress = (gamificationData.playerStats.currentXP / gamificationData.playerStats.nextLevelXP) * 100;

  return (
    <div className="space-y-6">
      {/* Player Stats Header */}
      <Card className="glass-card border-student-primary/20 glow-student">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Level & XP */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className={`text-4xl font-bold ${getLevelColor(gamificationData.playerStats.level)}`}>
                  {gamificationData.playerStats.level}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Level {gamificationData.playerStats.level}</h3>
                  <p className="text-sm text-muted-foreground">Student Explorer</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to Level {gamificationData.playerStats.level + 1}</span>
                  <span>{gamificationData.playerStats.currentXP}/{gamificationData.playerStats.nextLevelXP} XP</span>
                </div>
                <Progress value={xpProgress} className="h-3" />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-warning/5">
                <div className="flex items-center justify-center mb-1">
                  <Flame className="h-5 w-5 text-warning" />
                </div>
                <p className="text-2xl font-bold text-warning">{gamificationData.playerStats.streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-student-primary/5">
                <div className="flex items-center justify-center mb-1">
                  <Trophy className="h-5 w-5 text-student-primary" />
                </div>
                <p className="text-2xl font-bold text-student-primary">#{gamificationData.playerStats.rank}</p>
                <p className="text-xs text-muted-foreground">Class Rank</p>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-success/5">
                <div className="flex items-center justify-center mb-1">
                  <Star className="h-5 w-5 text-success" />
                </div>
                <p className="text-2xl font-bold text-success">{gamificationData.playerStats.totalPoints}</p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
              
              <div className="text-center p-3 rounded-lg bg-student-accent/5">
                <div className="flex items-center justify-center mb-1">
                  <Users className="h-5 w-5 text-student-accent" />
                </div>
                <p className="text-2xl font-bold text-student-accent">{gamificationData.playerStats.totalStudents}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 p-1 bg-muted/30 rounded-lg">
        <Button
          variant={activeTab === 'achievements' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('achievements')}
          className="flex-1"
        >
          <Award className="h-4 w-4 mr-2" />
          Achievements
        </Button>
        <Button
          variant={activeTab === 'leaderboard' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('leaderboard')}
          className="flex-1"
        >
          <Trophy className="h-4 w-4 mr-2" />
          Leaderboard
        </Button>
        <Button
          variant={activeTab === 'missions' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('missions')}
          className="flex-1"
        >
          <Target className="h-4 w-4 mr-2" />
          Missions
        </Button>
      </div>

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Achievement Badges</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gamificationData.badges.map((badge) => (
              <Card 
                key={badge.id} 
                className={`glass-card transition-all hover:scale-105 ${
                  badge.earned ? 'border-student-primary/30' : 'opacity-60'
                }`}
              >
                <CardContent className="p-4 text-center">
                  <div className="space-y-3">
                    <div className="text-4xl">{badge.icon}</div>
                    
                    <div>
                      <h4 className="font-semibold">{badge.name}</h4>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                    </div>
                    
                    <Badge className={getBadgeRarityColor(badge.rarity)}>
                      {badge.rarity.toUpperCase()}
                    </Badge>
                    
                    {badge.earned ? (
                      <div className="flex items-center justify-center space-x-1 text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Earned {badge.earnedDate}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Progress value={badge.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {badge.progress}% Complete
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Class Leaderboard</h3>
            <Badge variant="outline">Updated 1 hour ago</Badge>
          </div>
          
          <Card className="glass-card">
            <CardContent className="p-0">
              <div className="space-y-0">
                {gamificationData.leaderboard.map((student, index) => (
                  <div 
                    key={student.rank} 
                    className={`p-4 flex items-center justify-between border-b last:border-b-0 ${
                      student.isCurrentUser ? 'bg-student-primary/5 border-student-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        student.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                        student.rank === 2 ? 'bg-gray-100 text-gray-800' :
                        student.rank === 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {student.rank <= 3 ? (
                          student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : '🥉'
                        ) : (
                          student.rank
                        )}
                      </div>
                      
                      <Avatar>
                        <AvatarFallback>{student.avatar}</AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <p className={`font-medium ${student.isCurrentUser ? 'text-student-primary' : ''}`}>
                          {student.name} {student.isCurrentUser && '(You)'}
                        </p>
                        <p className="text-sm text-muted-foreground">Level {student.level}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-student-primary">{student.points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Missions Tab */}
      {activeTab === 'missions' && (
        <div className="space-y-6">
          {/* Daily Missions */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-5 w-5 text-student-primary" />
              <h3 className="text-lg font-semibold">Daily Missions</h3>
              <Badge variant="outline">Resets in 8h 32m</Badge>
            </div>
            
            <div className="space-y-3">
              {gamificationData.dailyMissions.map((mission) => (
                <Card key={mission.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {mission.completed ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <Target className="h-4 w-4 text-muted-foreground" />
                          )}
                          <h4 className={`font-medium ${mission.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {mission.title}
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{mission.description}</p>
                        
                        {!mission.completed && (
                          <div className="mt-2">
                            <Progress value={(mission.progress / mission.target) * 100} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {mission.progress}/{mission.target}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="flex items-center space-x-1">
                          <Zap className="h-4 w-4 text-warning" />
                          <span className="font-medium text-warning">{mission.xpReward} XP</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Weekly Missions */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-5 w-5 text-student-primary" />
              <h3 className="text-lg font-semibold">Weekly Challenges</h3>
              <Badge variant="outline">Resets in 3 days</Badge>
            </div>
            
            <div className="space-y-3">
              {gamificationData.weeklyMissions.map((mission) => (
                <Card key={mission.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Target className="h-4 w-4 text-student-primary" />
                          <h4 className="font-medium">{mission.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{mission.description}</p>
                        
                        <div className="mt-2">
                          <Progress value={(mission.progress / mission.target) * 100} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {mission.progress}/{mission.target} completed
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="flex items-center space-x-1">
                          <Zap className="h-4 w-4 text-warning" />
                          <span className="font-medium text-warning">{mission.xpReward} XP</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};