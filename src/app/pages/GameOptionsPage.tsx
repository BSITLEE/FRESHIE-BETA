import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BackButton } from '../components/BackButton';
import { Palette, Shapes, Move } from 'lucide-react';
import backgroundImg from '../../artassets/background.webp';
import { useUserStore } from '../utils/useUserStore';

export default function GameOptionsPage() {
  const navigate = useNavigate();
  const { userState } = useUserStore();

  const gameOptions = [
    {
      id: 'color-quiz',
      title: 'Color Quiz',
      description: 'Which is the [color]?',
      icon: Palette,
      color: 'from-pink-400 to-purple-500',
      borderColor: 'border-pink-500',
      route: '/color-quiz',
    },
    {
      id: 'shape-quiz',
      title: 'Shape Quiz',
      description: 'Which is the [shape]?',
      icon: Shapes,
      color: 'from-blue-400 to-cyan-500',
      borderColor: 'border-blue-500',
      route: '/shape-quiz',
    },
    {
      id: 'drag-match',
      title: 'Drag & Match',
      description: 'Place the shapes in the right box!',
      icon: Move,
      color: 'from-green-400 to-emerald-500',
      borderColor: 'border-green-500',
      route: '/drag-match',
    },
  ];

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
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between bg-white/90 rounded-3xl p-4 md:p-6 shadow-lg border-4 border-amber-500">
          <div className="flex items-center gap-4">
            <BackButton to="/menu" />
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-green-800" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                Choose Your Game!
              </h1>
            </div>
          </div>

          {/* Profile Icon */}
          <Button 
            variant="outline"
            size="lg"
            onClick={() => navigate('/menu')}
            className="rounded-full w-12 h-12 md:w-16 md:h-16 border-4 border-green-500 bg-white text-2xl md:text-4xl"
          >
            {userState.currentChild?.avatar || 'U'}
          </Button>
        </div>
      </div>

      {/* Game Options Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {gameOptions.map((game) => {
            const Icon = game.icon;
            return (
              <Card
                key={game.id}
                className={`border-8 ${game.borderColor} cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-2xl overflow-hidden bg-white`}
                onClick={() => navigate(game.route)}
              >
                <div className={`bg-gradient-to-br ${game.color} p-8 md:p-12 flex items-center justify-center`}>
                  <Icon className="w-24 h-24 md:w-32 md:h-32 text-white drop-shadow-lg" />
                </div>
                <CardHeader className="text-center pb-3">
                  <CardTitle className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                    {game.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-8">
                  <CardDescription className="text-lg md:text-xl text-gray-700 mb-6">
                    {game.description}
                  </CardDescription>
                  <Button
                    size="lg"
                    className={`h-14 md:h-16 px-8 md:px-12 text-xl md:text-2xl rounded-full shadow-lg bg-gradient-to-r ${game.color} text-white border-none hover:shadow-xl`}
                  >
                    Play Now!
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Instructions Card */}
        <Card className="mt-8 border-4 border-yellow-400 bg-yellow-50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl text-yellow-800">
              How to Play
            </CardTitle>
          </CardHeader>
          <CardContent className="text-base md:text-lg text-gray-700 space-y-2">
            <p><strong>Color Quiz:</strong> Tap the correct color!</p>
            <p><strong>Shape Quiz:</strong> Find the right shape!</p>
            <p><strong>Drag & Match:</strong> Drag shapes to the matching box!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}