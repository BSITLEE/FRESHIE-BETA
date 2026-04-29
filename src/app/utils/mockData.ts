// Mock data for the application

export const colors = [
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#00FF00' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Brown', hex: '#8B4513' },
];

/**
 * Shape Library - SVG Path-Based Shapes
 *
 * All shapes use SVG path data for scalable rendering.
 * Designed for database storage and dynamic rendering.
 * Each shape fits within a 100x100 viewBox for consistency.
 */
export const shapes = [
  // Basic Shapes
  { name: 'Circle', svg: 'M50,10 A40,40 0 1,1 49.99,10 Z' },
  { name: 'Square', svg: 'M10,10 L90,10 L90,90 L10,90 Z' },
  { name: 'Triangle', svg: 'M50,10 L90,80 L10,80 Z' },
  { name: 'Rectangle', svg: 'M10,30 L90,30 L90,70 L10,70 Z' },

  // Polygon Shapes
  { name: 'Pentagon', svg: 'M50,5 L95,40 L78,90 L22,90 L5,40 Z' },
  { name: 'Hexagon', svg: 'M50,5 L90,25 L90,65 L50,85 L10,65 L10,25 Z' },

  // Curved Shapes
  { name: 'Oval', svg: 'M50,10 A30,40 0 1,1 49.99,10 Z' },
  { name: 'Heart', svg: 'M50,85 C20,60 5,40 5,25 C5,15 12,10 20,10 C30,10 40,18 50,25 C60,18 70,10 80,10 C88,10 95,15 95,25 C95,40 80,60 50,85 Z' },
  { name: 'Crescent', svg: 'M50,10 A40,40 0 1,1 50,90 A30,30 0 1,0 50,10 Z' },

  // Angular Shapes
  { name: 'Diamond', svg: 'M50,10 L90,50 L50,90 L10,50 Z' },
  { name: 'Star', svg: 'M50,5 L61,40 L98,40 L68,62 L82,95 L50,73 L18,95 L32,62 L2,40 L39,40 Z' },
  { name: 'Arrow', svg: 'M10,40 L10,60 L70,60 L70,80 L95,50 L70,20 L70,40 Z' },
  { name: 'Cross', svg: 'M35,10 L65,10 L65,35 L90,35 L90,65 L65,65 L65,90 L35,90 L35,65 L10,65 L10,35 L35,35 Z' },
  { name: 'Trapezoid', svg: 'M20,20 L80,20 L95,80 L5,80 Z' },
];

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  parentId?: string;
  progress: {
    colorQuizScore: number;
    shapeQuizScore: number;
    dragMatchScore: number;
    totalGamesPlayed: number;
    badges: string[];
  };
}

export interface QuizQuestion {
  question: string;
  correctAnswer: string;
  options: string[];
  type: 'color' | 'shape';
}

export interface DragMatchQuestion {
  instruction: string;
  targetColor: string;
  targetShape: string;
  options: Array<{ color: string; shape: string; id: string }>;
}

// Available avatar emojis for child profiles
export const AVATAR_EMOJIS = [
  '🦁', '🐘', '🦒', '🐯', '🦓', '🐵', '🐼', '🐨', '🦊', '🐻',
  '🐶', '🐱', '🐰', '🐹', '🐸', '🐙', '🦋', '🐝', '🐢', '🦉'
];

// Mock child profiles - Default template for new accounts
export const mockChildProfiles: ChildProfile[] = [
  {
    id: '1',
    name: 'Emma',
    age: 4,
    avatar: '🦁',
    progress: {
      colorQuizScore: 0,
      shapeQuizScore: 0,
      dragMatchScore: 0,
      totalGamesPlayed: 0,
      badges: [],
    },
  },
  {
    id: '2',
    name: 'Liam',
    age: 5,
    avatar: '🐘',
    progress: {
      colorQuizScore: 0,
      shapeQuizScore: 0,
      dragMatchScore: 0,
      totalGamesPlayed: 0,
      badges: [],
    },
  },
];

// Generate random quiz questions
export const generateColorQuiz = (count: number = 5): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];
  
  for (let i = 0; i < count; i++) {
    const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
    const correctColor = shuffledColors[0];
    const options = [correctColor.name, shuffledColors[1].name, shuffledColors[2].name].sort(() => Math.random() - 0.5);
    
    questions.push({
      question: `Which of these is the color ${correctColor.name.toLowerCase()}?`,
      correctAnswer: correctColor.name,
      options,
      type: 'color',
    });
  }
  
  return questions;
};

export const generateShapeQuiz = (count: number = 5): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];
  
  for (let i = 0; i < count; i++) {
    const shuffledShapes = [...shapes].sort(() => Math.random() - 0.5);
    const correctShape = shuffledShapes[0];
    const options = [correctShape.name, shuffledShapes[1].name, shuffledShapes[2].name].sort(() => Math.random() - 0.5);
    
    questions.push({
      question: `Which of these is the ${correctShape.name.toLowerCase()}?`,
      correctAnswer: correctShape.name,
      options,
      type: 'shape',
    });
  }
  
  return questions;
};

export const generateDragMatchQuestion = (): DragMatchQuestion => {
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
  
  // Generate 4 shape-color combinations
  const options = [];
  const shuffledColors = [...colors].sort(() => Math.random() - 0.5).slice(0, 4);
  const shuffledShapes = [...shapes].sort(() => Math.random() - 0.5).slice(0, 4);
  
  for (let i = 0; i < 4; i++) {
    options.push({
      color: shuffledColors[i].name,
      shape: shuffledShapes[i].name,
      id: `option-${i}`,
    });
  }
  
  // Ensure at least one correct answer exists
  options[0] = {
    color: randomColor.name,
    shape: randomShape.name,
    id: 'option-0',
  };
  
  return {
    instruction: `Place the ${randomColor.name.toLowerCase()} ${randomShape.name.toLowerCase()} in the box`,
    targetColor: randomColor.name,
    targetShape: randomShape.name,
    options: options.sort(() => Math.random() - 0.5),
  };
};

// Helper to get color hex
export const getColorHex = (colorName: string): string => {
  return colors.find(c => c.name === colorName)?.hex || '#808080';
};

// Helper to get shape SVG path
export const getShapeSvg = (shapeName: string): string => {
  return shapes.find(s => s.name === shapeName)?.svg || '';
};