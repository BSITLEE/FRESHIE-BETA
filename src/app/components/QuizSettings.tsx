import { useState, memo } from 'react';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface QuizSettingsProps {
  onStart: (questionCount: number) => void;
  gameTitle: string;
  gameIcon: string;
}

const QuizSettings = memo(({ onStart, gameTitle, gameIcon }: QuizSettingsProps) => {
  const [questionCount, setQuestionCount] = useState(10);

  const questionOptions = [5, 10, 15, 20];

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8 max-w-2xl w-full px-4"
      >
        {/* Title */}
        <div className="space-y-4">
          {gameIcon && <div className="text-8xl md:text-9xl">{gameIcon}</div>}
          <h1
            className="text-4xl md:text-6xl font-bold text-white"
            style={{
              fontFamily: "'Cabin Sketch', cursive",
              textShadow: '4px 4px 8px rgba(0,0,0,0.3)'
            }}
          >
            {gameTitle}
          </h1>
        </div>

        {/* Question Count Selection */}
        <div className="space-y-6">
          <h2 
            className="text-3xl md:text-4xl font-bold text-white"
            style={{ 
              fontFamily: "'Chelsea Market', cursive",
              textShadow: '3px 3px 6px rgba(0,0,0,0.3)'
            }}
          >
            How many questions?
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {questionOptions.map((count) => (
              <motion.button
                key={count}
                onClick={() => setQuestionCount(count)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  p-6 md:p-8 rounded-3xl border-8 transition-all text-5xl md:text-6xl font-bold
                  ${questionCount === count
                    ? 'bg-white text-green-600 border-green-500 shadow-2xl scale-110'
                    : 'bg-white/80 text-gray-700 border-yellow-400 hover:border-green-400'
                  }
                `}
                style={{ fontFamily: "'Pangolin', cursive" }}
              >
                {count}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={() => onStart(questionCount)}
          size="lg"
          className="h-20 px-12 text-3xl md:text-4xl bg-green-600 hover:bg-green-700 rounded-full shadow-2xl border-4 border-white"
          style={{ fontFamily: "'Chelsea Market', cursive" }}
        >
          Let's Play! <ArrowRight className="w-10 h-10 ml-3" />
        </Button>
      </motion.div>
    </div>
  );
});

QuizSettings.displayName = 'QuizSettings';

export { QuizSettings };
