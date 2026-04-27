import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { useUserStore } from '../utils/useUserStore';
import { ArrowLeft, TrendingUp, Award, Calendar, Target } from 'lucide-react';
import backgroundImg from '../../artassets/background.png';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { userState, switchChild } = useUserStore();

  const getRecentActivity = () => {
    // Return empty array if no games played
    if ((userState.currentChild?.progress.totalGamesPlayed || 0) === 0) {
      return [];
    }
    
    return [
      { date: 'April 15, 2026', activity: 'Color Quiz', score: 85 },
      { date: 'April 14, 2026', activity: 'Shape Quiz', score: 90 },
      { date: 'April 13, 2026', activity: 'Drag & Match', score: 100 },
      { date: 'April 12, 2026', activity: 'Color Quiz', score: 75 },
    ];
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-4 bg-white/90 rounded-3xl p-4 md:p-6 shadow-lg border-4 border-amber-500">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/menu')}
            className="rounded-full w-12 h-12 md:w-14 md:h-14 border-3 border-green-500"
          >
            <ArrowLeft className="w-6 h-6 md:w-7 md:h-7" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-green-800" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Parent Dashboard
            </h1>
            <p className="text-base md:text-lg text-amber-700">
              Track your child's learning journey
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Child Selector */}
        {userState.children.length > 1 && (
          <Card className="border-4 border-purple-400 bg-white/95 shadow-lg">
            <CardHeader>
              <CardTitle>Select Child Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                {userState.children.map((child) => (
                  <Button
                    key={child.id}
                    variant={child.id === userState.currentChild?.id ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => switchChild(child.id)}
                    className={`h-16 px-6 text-lg ${
                      child.id === userState.currentChild?.id
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'border-2 border-green-400'
                    }`}
                  >
                    {child.avatar} {child.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Child Overview */}
        {userState.currentChild && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="border-4 border-blue-400 bg-white/95 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-6 h-6 text-blue-600" />
                    <CardTitle className="text-lg">Games Played</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-blue-800">
                    {userState.currentChild.progress.totalGamesPlayed}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-4 border-pink-400 bg-white/95 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-pink-600" />
                    <CardTitle className="text-lg">Color Quiz</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-pink-800">
                    {userState.currentChild.progress.colorQuizScore}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border-4 border-purple-400 bg-white/95 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                    <CardTitle className="text-lg">Shape Quiz</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-purple-800">
                    {userState.currentChild.progress.shapeQuizScore}%
                  </p>
                </CardContent>
              </Card>

              <Card className="border-4 border-green-400 bg-white/95 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-green-600" />
                    <CardTitle className="text-lg">Badges</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-green-800">
                    {userState.currentChild.progress.badges.length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-4 border-amber-400 bg-white/95 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Learning Progress</CardTitle>
                  <CardDescription>Skill development overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Color Recognition</span>
                      <span className="font-bold text-blue-600">
                        {userState.currentChild.progress.colorQuizScore}%
                      </span>
                    </div>
                    <Progress 
                      value={userState.currentChild.progress.colorQuizScore} 
                      className="h-3"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Shape Recognition</span>
                      <span className="font-bold text-purple-600">
                        {userState.currentChild.progress.shapeQuizScore}%
                      </span>
                    </div>
                    <Progress 
                      value={userState.currentChild.progress.shapeQuizScore} 
                      className="h-3"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Drag & Match</span>
                      <span className="font-bold text-green-600">
                        {userState.currentChild.progress.dragMatchScore}%
                      </span>
                    </div>
                    <Progress 
                      value={userState.currentChild.progress.dragMatchScore} 
                      className="h-3"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-4 border-yellow-400 bg-white/95 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    <Calendar className="inline w-6 h-6 mr-2" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Last 4 games played</CardDescription>
                </CardHeader>
                <CardContent>
                  {getRecentActivity().length > 0 ? (
                    <div className="space-y-4">
                      {getRecentActivity().map((item, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-200"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">{item.activity}</p>
                            <p className="text-sm text-gray-600">{item.date}</p>
                          </div>
                          <div className={`text-2xl font-bold ${
                            item.score >= 80 ? 'text-green-600' : 
                            item.score >= 60 ? 'text-yellow-600' : 'text-orange-600'
                          }`}>
                            {item.score}%
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-gray-400 text-lg mb-2">No games played yet</p>
                      <p className="text-gray-500 text-sm">Activity will appear here after completing games</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Badges Display */}
            <Card className="border-4 border-indigo-400 bg-white/95 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">
                  <Award className="inline w-6 h-6 mr-2" />
                  Achievements & Badges
                </CardTitle>
                <CardDescription>Rewards earned for excellent performance</CardDescription>
              </CardHeader>
              <CardContent>
                {userState.currentChild.progress.badges.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {userState.currentChild.progress.badges.map((badge, index) => (
                      <div 
                        key={index}
                        className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-yellow-200 to-amber-300 rounded-full flex items-center justify-center text-5xl md:text-6xl shadow-lg border-4 border-yellow-400"
                      >
                        {badge}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-gray-400 text-lg mb-2">No badges earned yet</p>
                    <p className="text-gray-500 text-sm">Score 80% or higher in games to earn badges!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="border-4 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-green-800">
                  💡 Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <p className="text-base flex-1">
                    <strong>{userState.currentChild.name}</strong> is doing great with colors! 
                    Try more shape recognition activities to balance skills.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <p className="text-base flex-1">
                    Playing 15-20 minutes daily helps reinforce learning and build confidence.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <p className="text-base flex-1">
                    Celebrate achievements! Use the earned badges as motivation to keep learning.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}