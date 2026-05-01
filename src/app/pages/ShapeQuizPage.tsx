import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { generateShapeQuiz, getShapeSvg, QuizQuestion } from '../utils/mockData';
import { QuizSettings } from '../components/QuizSettings';
import { BackButton } from '../components/BackButton';
import { motion, AnimatePresence } from 'motion/react';
import backgroundImg from '../../artassets/background.webp';
import freshieBoardImg from '../../artassets/freshieboard.webp';
import freshieIdleImg from '../../artassets/freshieidle.webp';
import freshieCorrectImg from '../../artassets/freshiecorrect.webp';
import freshieWrongImg from '../../artassets/freshiewrong.webp';
import freshieBushImg from '../../artassets/freshiebush.webp';

export default function ShapeQuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const assignmentId = (location.state as { assignmentId?: string } | null)?.assignmentId;
  const assignedQuestionCount = (location.state as { assignedQuestionCount?: number | null } | null)?.assignedQuestionCount;
  const [gameStarted, setGameStarted] = useState(Boolean(assignmentId && assignedQuestionCount));
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    assignmentId && assignedQuestionCount ? generateShapeQuiz(assignedQuestionCount) : []
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // determines which sprite to trigger based on the answer
  const characterImage = feedback === 'correct'
    ? freshieCorrectImg
    : feedback === 'wrong'
    ? freshieWrongImg
    : freshieIdleImg;

  const handleStartGame = (questionCount: number) => {
    setQuestions(generateShapeQuiz(questionCount));
    setGameStarted(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setFeedback(null);
    setSelectedAnswer(null);
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;

    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setScore(score + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    // moves to next question /finish
    setTimeout(() => {
      if (isLastQuestion) {
        const finalScore = Math.round(((isCorrect ? score + 1 : score) / questions.length) * 100);
        navigate('/score', {
          state: {
            score: finalScore,
            correct: isCorrect ? score + 1 : score,
            total: questions.length,
            gameType: 'shape',
            assignmentId: assignmentId ?? null,
          }
        });
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setFeedback(null);
        setSelectedAnswer(null);
      }
    }, 1500);
  };

  // settings screen
  if (!gameStarted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: `url(${backgroundImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <BackButton to="/game-options" />
        <QuizSettings
          onStart={handleStartGame}
          gameTitle="Shape Quiz"
          gameIcon=""
        />
      </div>
    );
  }

  // Game screen with layering
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Layer 1: Board Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${freshieBoardImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Layer 2: Character on RIGHT side */}
      <AnimatePresence mode="wait">
        <motion.div
          key={feedback || 'idle'}
          className="absolute right-0 md:right-2 bottom-0 z-10"
          initial={{ y: 0 }}
          animate={{
            y: feedback ? [-25, 0, -20, 0] : 0,
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
          style={{
            width: '280px',
            height: 'auto',
            maxWidth: '32vw',
          }}
        >
          <img
            src={characterImage}
            alt="Freshie"
            className="w-full h-auto"
            style={{
              imageRendering: 'auto',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Layer 3: Quiz Content - Centered within board */}
      <div className="relative z-20 w-full max-w-4xl px-6 md:px-12">
        <BackButton to="/game-options" className="absolute top-4 left-4 bg-white/90 hover:bg-white z-30" />

        <div className="flex flex-col items-center justify-center min-h-[70vh] py-8">
          {/* Progress Counter */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6"
          >
            <div
              className="text-xl md:text-2xl font-bold text-white px-6 py-2 rounded-full bg-black/20 border-2 border-white/40"
              style={{
                fontFamily: "'Cabin Sketch', cursive",
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              {currentQuestionIndex + 1} / {questions.length}
            </div>
          </motion.div>

          {/* Question */}
          <motion.h2
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-4xl font-bold text-white mb-8 text-center px-4"
            style={{
              fontFamily: "'Cabin Sketch', cursive",
              textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
              letterSpacing: '1px',
            }}
          >
            Which is the {currentQuestion.correctAnswer.toLowerCase()}?
          </motion.h2>

          {/* Answer Options */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-2xl w-full">
            {currentQuestion.options.map((option, index) => {
              const shapePath = getShapeSvg(option);
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;

              let borderColor = 'rgba(255, 255, 255, 0.9)';
              let shadowStyle = '0 4px 12px rgba(0, 0, 0, 0.3)';

              if (isSelected && feedback) {
                borderColor = isCorrect ? '#22c55e' : '#ef4444';
                shadowStyle = isCorrect
                  ? '0 0 25px #22c55e, 0 4px 12px rgba(0, 0, 0, 0.4)'
                  : '0 0 25px #ef4444, 0 4px 12px rgba(0, 0, 0, 0.4)';
              }

              return (
                <motion.button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={!!selectedAnswer}
                  whileHover={!selectedAnswer ? { scale: 1.08 } : {}}
                  whileTap={!selectedAnswer ? { scale: 0.92 } : {}}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.06, type: 'spring', stiffness: 200 }}
                  className="aspect-square rounded-2xl disabled:cursor-not-allowed bg-white/95 flex items-center justify-center p-4 md:p-6"
                  style={{
                    border: `6px solid ${borderColor}`,
                    boxShadow: shadowStyle,
                    minHeight: '100px',
                  }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full max-w-[120px] max-h-[120px]">
                    <path
                      d={shapePath}
                      fill="#4F46E5"
                      stroke="#312E81"
                      strokeWidth="3"
                    />
                  </svg>
                </motion.button>
              );
            })}
          </div>

          {/* Feedback Message */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8"
            >
              <p
                className="text-3xl md:text-5xl font-bold"
                style={{
                  fontFamily: "'Cabin Sketch', cursive",
                  color: feedback === 'correct' ? '#22c55e' : '#ef4444',
                  textShadow: '3px 3px 8px rgba(0,0,0,0.9)',
                }}
              >
                {feedback === 'correct' ? 'Great Job!' : 'Try Again!'}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Layer 4: Bush Foreground Overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none"
        style={{
          backgroundImage: `url(${freshieBushImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom',
          backgroundRepeat: 'no-repeat',
          height: '30vh',
        }}
      />
    </div>
  );
}
