import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { BackButton } from '../components/BackButton';
import { AchievementBadge } from '../components/AchievementBadge';
import { useUserStore } from '../utils/useUserStore';
import { createGameSession, createActivityLog } from '../utils/databaseTypes';
import { Home, RotateCcw, Trophy, Star } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import backgroundImg from '../../artassets/background.png';

export default function ScorePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateChildProgress, userState } = useUserStore();
  const [showConfetti, setShowConfetti] = useState(false);

  const state = location.state as {
    score: number;
    correct: number;
    total: number;
    gameType: 'color' | 'shape' | 'dragMatch';
  } | null;

  const score = state?.score || 0;
  const correct = state?.correct || 0;
  const total = state?.total || 0;
  const gameType = state?.gameType || 'color';

  useEffect(() => {
    // Update child progress
    if (state && userState.currentChild) {
      updateChildProgress(score, gameType);

      // Log game session (database-ready structure)
      const gameTypeMap = {
        'color': 'color_quiz' as const,
        'shape': 'shape_quiz' as const,
        'dragMatch': 'drag_match' as const,
      };

      const gameSession = createGameSession(
        userState.currentChild.id,
        gameTypeMap[gameType],
        total,
        correct
      );

      // Log activity
      const activityLog = createActivityLog(
        userState.currentChild.id,
        'game_completed',
        {
          game_type: gameTypeMap[gameType],
          score_percentage: score,
          questions_total: total,
          questions_correct: correct,
        }
      );

      // In production, these would be sent to the backend API
      console.log('Game Session (DB-ready):', gameSession);
      console.log('Activity Log (DB-ready):', activityLog);
    }

    // Trigger confetti for good scores
    if (score >= 80) {
      setShowConfetti(true);
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#4CAF50', '#2196F3'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#4CAF50', '#2196F3'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [score, gameType]); // Removed 'state' and 'updateChildProgress' from dependencies

  const getPerformanceMessage = () => {
    if (score >= 90) return "Outstanding! You're a star!";
    if (score >= 70) return "Great job! Keep it up!";
    if (score >= 50) return "Good effort! Practice makes perfect!";
    return "Nice try! Let's play again!";
  };

  const getStarCount = () => {
    if (score >= 90) return 3;
    if (score >= 70) return 2;
    if (score >= 50) return 1;
    return 0;
  };

  const getBadges = () => {
    const badges = [];
    if (score === 100) badges.push('Trophy');
    if (score >= 90) badges.push('Star');
    if (score >= 80) badges.push('Medal');
    if (correct === total) badges.push('Perfect');
    return badges;
  };

  const handlePlayAgain = () => {
    if (gameType === 'color') {
      navigate('/color-quiz');
    } else if (gameType === 'shape') {
      navigate('/shape-quiz');
    } else {
      navigate('/drag-match');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/95 border-8 border-yellow-400 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-8 md:p-12 text-center">
              <Trophy className="w-20 h-20 md:w-24 md:h-24 mx-auto text-white mb-4" />
              <h1 
                className="text-4xl md:text-6xl font-bold text-white mb-2"
                style={{ fontFamily: 'Comic Sans MS, cursive' }}
              >
                Game Complete!
              </h1>
              <p className="text-xl md:text-2xl text-white">
                {userState.currentChild?.avatar} {userState.currentChild?.name}
              </p>
            </div>

            {/* Score Display */}
            <div className="p-8 md:p-12 space-y-8">
              {/* Main Score */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  className="inline-block"
                >
                  <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-2xl border-8 border-white">
                    <div className="text-center">
                      <p className="text-6xl md:text-7xl font-bold text-white">
                        {score}
                      </p>
                      <p className="text-xl md:text-2xl font-bold text-white">
                        Score
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Performance Message */}
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-green-800 mb-4">
                  {getPerformanceMessage()}
                </h2>
                <p className="text-xl md:text-2xl text-gray-700">
                  {correct} out of {total} correct
                </p>
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-4">
                {[...Array(3)].map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5 + index * 0.2 }}
                  >
                    <Star
                      className={`w-12 h-12 md:w-16 md:h-16 ${
                        index < getStarCount()
                          ? 'fill-yellow-400 text-yellow-500'
                          : 'fill-gray-300 text-gray-400'
                      }`}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Badges */}
              {getBadges().length > 0 && (
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-bold text-purple-800 mb-4">
                    Badges Earned!
                  </h3>
                  <div className="flex justify-center gap-4 md:gap-6 flex-wrap">
                    {getBadges().map((badge, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1 + index * 0.1, type: 'spring' }}
                      >
                        <AchievementBadge type={badge} size="lg" animated={false} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={handlePlayAgain}
                  className="h-16 md:h-18 text-xl md:text-2xl bg-green-600 hover:bg-green-700 rounded-full shadow-lg"
                >
                  <RotateCcw className="w-6 h-6 md:w-7 md:h-7 mr-2" />
                  Play Again
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/menu')}
                  className="h-16 md:h-18 text-xl md:text-2xl border-4 border-blue-500 text-blue-700 hover:bg-blue-50 rounded-full shadow-lg"
                >
                  <Home className="w-6 h-6 md:w-7 md:h-7 mr-2" />
                  Back to Menu
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}