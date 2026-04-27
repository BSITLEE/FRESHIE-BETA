import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import backgroundImg from '../../artassets/background.png';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Decorative elements */}
      <motion.div
        className="absolute top-10 right-10 opacity-15"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100" className="text-amber-400">
          <polygon points="50,5 61,40 98,40 68,62 82,95 50,73 18,95 32,62 2,40 39,40" fill="currentColor" />
        </svg>
      </motion.div>

      {/* Back Button */}
      <Button
        variant="outline"
        size="lg"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 rounded-full w-14 h-14 border-4 border-green-600 bg-amber-200/90 hover:bg-amber-300 shadow-lg"
      >
        <ArrowLeft className="w-7 h-7 text-green-800" />
      </Button>

      {/* Main Content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-green-600 bg-white/95"
      >
        <h1
          className="text-4xl md:text-5xl font-bold text-green-800 mb-8 text-center"
          style={{
            fontFamily: "'Cabin Sketch', cursive",
            textShadow: '2px 2px 4px rgba(251, 191, 36, 0.3)',
          }}
        >
          About Freshie's Safari
        </h1>

        <div className="bg-gradient-to-br from-amber-50 to-green-50 rounded-2xl p-6 md:p-8 shadow-lg border-3 border-amber-400">
          <div className="space-y-6 text-lg md:text-xl text-gray-800 leading-relaxed">
            <p style={{ fontFamily: "'Chelsea Market', cursive" }}>
              Freshie's Color and Shape Safari is a playful, interactive learning adventure
              designed to help young minds discover the world of colors and shapes. Through
              engaging activities, bright visuals, and simple challenges, little learners build
              confidence as they recognize, match, and explore fundamental concepts, all while
              having fun.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
