import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { QuizSettings } from '../components/QuizSettings';
import { BackButton } from '../components/BackButton';
import { generateDragMatchQuestion, getColorHex, getShapeSvg } from '../utils/mockData';
import { Check } from 'lucide-react';
import backgroundImg from '../../artassets/background.png';
import { useUserStore } from '../utils/useUserStore';

const ItemType = 'SHAPE';

// Detect if device supports touch
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const backend = isTouchDevice ? TouchBackend : HTML5Backend;

interface DraggableShapeProps {
  color: string;
  shape: string;
  id: string;
}

function DraggableShape({ color, shape, id }: DraggableShapeProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType,
    item: { color, shape, id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const colorHex = getColorHex(color);
  const shapePath = getShapeSvg(shape);

  return (
    <div
      ref={drag}
      className={`cursor-move p-4 md:p-6 bg-white rounded-2xl border-4 border-gray-300 shadow-lg hover:shadow-xl transition-all ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <svg viewBox="0 0 100 100" className="w-20 h-20 md:w-24 md:h-24">
        <path 
          d={shapePath} 
          fill={colorHex}
          stroke="#000"
          strokeWidth="2"
        />
      </svg>
      <p className="text-center text-sm md:text-base font-bold mt-2">
        {color} {shape}
      </p>
    </div>
  );
}

interface DropZoneProps {
  targetColor: string;
  targetShape: string;
  droppedItem: { color: string; shape: string } | null;
  onDrop: (item: { color: string; shape: string }) => void;
  feedback: 'correct' | 'wrong' | null;
}

function DropZone({ targetColor, targetShape, droppedItem, onDrop, feedback }: DropZoneProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item: { color: string; shape: string }) => onDrop(item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  let borderColor = 'border-amber-400';
  let bgColor = 'bg-amber-50';

  if (isOver) {
    borderColor = 'border-blue-500';
    bgColor = 'bg-blue-50';
  }

  if (feedback === 'correct') {
    borderColor = 'border-green-500';
    bgColor = 'bg-green-100';
  } else if (feedback === 'wrong') {
    borderColor = 'border-red-500';
    bgColor = 'bg-red-100';
  }

  return (
    <div
      ref={drop}
      className={`min-h-[200px] md:min-h-[250px] p-6 md:p-8 rounded-3xl border-8 ${borderColor} ${bgColor} transition-all duration-300 flex flex-col items-center justify-center`}
    >
      <p className="text-xl md:text-2xl font-bold text-gray-800 mb-4 text-center">
        Drop the {targetColor.toLowerCase()} {targetShape.toLowerCase()} here
      </p>
      
      {droppedItem ? (
        <div className="p-4 bg-white rounded-2xl border-4 border-gray-300 shadow-lg">
          <svg viewBox="0 0 100 100" className="w-20 h-20 md:w-24 md:h-24">
            <path 
              d={getShapeSvg(droppedItem.shape)} 
              fill={getColorHex(droppedItem.color)}
              stroke="#000"
              strokeWidth="2"
            />
          </svg>
          <p className="text-center text-sm md:text-base font-bold mt-2">
            {droppedItem.color} {droppedItem.shape}
          </p>
        </div>
      ) : (
        <div className="w-32 h-32 md:w-40 md:h-40 border-4 border-dashed border-gray-400 rounded-2xl flex items-center justify-center">
          <p className="text-gray-400 text-center text-sm md:text-base">
            Drop here
          </p>
        </div>
      )}

      {feedback && (
        <p className={`mt-4 text-2xl md:text-3xl font-bold ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
          {feedback === 'correct' ? 'Correct!' : 'Try Again!'}
        </p>
      )}
    </div>
  );
}

function DragMatchGame() {
  const navigate = useNavigate();
  const { userState } = useUserStore();
  const [gameStarted, setGameStarted] = useState(false);
  const [question, setQuestion] = useState(() => generateDragMatchQuestion());
  const [droppedItem, setDroppedItem] = useState<{ color: string; shape: string } | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const handleStartGame = () => {
    setGameStarted(true);
    setQuestion(generateDragMatchQuestion());
    setDroppedItem(null);
    setFeedback(null);
    setScore(0);
    setAttempts(0);
  };

  const handleDrop = (item: { color: string; shape: string }) => {
    setDroppedItem(item);
    setFeedback(null); // Reset feedback on new drop
  };

  const handleCheckAnswer = () => {
    if (!droppedItem) return;

    const isCorrect = 
      droppedItem.color === question.targetColor && 
      droppedItem.shape === question.targetShape;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    setAttempts(attempts + 1);

    if (isCorrect) {
      setScore(100);
      setTimeout(() => {
        navigate('/score', {
          state: {
            score: 100,
            correct: 1,
            total: 1,
            gameType: 'dragMatch'
          }
        });
      }, 2000);
    }
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
      <BackButton to="/game-options" />
      
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between bg-white/90 rounded-3xl p-4 md:p-6 shadow-lg border-4 border-amber-500">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-green-800" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
              Drag & Match! 🎯
            </h1>
          </div>

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

      {/* Game Content */}
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Instructions */}
        <Card className="bg-white/95 border-8 border-purple-500 shadow-2xl">
          <div className="p-6 md:p-8 text-center">
            <h2 
              className="text-2xl md:text-4xl font-bold text-purple-800"
              style={{ fontFamily: 'Comic Sans MS, cursive' }}
            >
              {question.instruction}
            </h2>
          </div>
        </Card>

        {/* Drop Zone */}
        <DropZone
          targetColor={question.targetColor}
          targetShape={question.targetShape}
          droppedItem={droppedItem}
          onDrop={handleDrop}
          feedback={feedback}
        />

        {/* Available Shapes */}
        <Card className="bg-white/95 border-6 border-green-400 shadow-xl">
          <div className="p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-green-800 mb-6 text-center">
              Drag a shape from here:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {question.options.map((option) => (
                <DraggableShape
                  key={option.id}
                  color={option.color}
                  shape={option.shape}
                  id={option.id}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Check Answer Button */}
        {droppedItem && !feedback && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={handleCheckAnswer}
              className="h-16 md:h-20 px-12 md:px-16 text-2xl md:text-3xl bg-blue-600 hover:bg-blue-700 rounded-full shadow-xl"
            >
              <Check className="w-8 h-8 mr-3" />
              Check Answer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DragMatchPage() {
  return (
    <DndProvider backend={backend}>
      <DragMatchGame />
    </DndProvider>
  );
}