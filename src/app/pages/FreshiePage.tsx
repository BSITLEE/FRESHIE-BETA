import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import backgroundImg from '../../artassets/background.webp';
import freshieProfileImg from '../../artassets/freshieprofile.webp';

export default function FreshiePage() {
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
      {/* Decorative paw prints */}
      <motion.div
        className="absolute top-1/4 left-10 opacity-10"
        animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="text-8xl text-green-600">🐾</div>
      </motion.div>

      <motion.div
        className="absolute bottom-1/4 right-20 opacity-10"
        animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="text-7xl text-amber-600">🐾</div>
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
        className="max-w-6xl mx-auto bg-white/95 rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-green-600"
      >
        <h1
          className="text-4xl md:text-5xl font-bold text-green-800 mb-8 text-center"
          style={{
            fontFamily: "'Cabin Sketch', cursive",
            textShadow: '2px 2px 4px rgba(251, 191, 36, 0.3)',
          }}
        >
          Meet Freshie
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left side - Text */}
          <div className="space-y-6 text-lg md:text-xl text-gray-800 leading-relaxed order-2 md:order-1 bg-gradient-to-br from-green-50 to-amber-50 rounded-2xl p-6 border-3 border-amber-400">
            <p style={{ fontFamily: "'Chelsea Market', cursive" }}>
              Meet Freshie, your guide on this journey. He's a one of a kind, hamster like
              tiger with a curious mind and a passion for learning. While he might look a
              bit grumpy at first, don't be fooled. Freshie is a warm and encouraging companion
              who is always ready to cheer learners on. From the very first activity to every
              new discovery, he inspires children and even adults to stay curious, keep trying,
              and enjoy the process of learning something new.
            </p>
            <p style={{ fontFamily: "'Chelsea Market', cursive" }}>
              With Freshie by your side, every lesson becomes a small adventure filled with
              color, creativity, and moments of achievement.
            </p>
          </div>

          {/* Right side - Image */}
          <div className="order-1 md:order-2 flex justify-center">
            <div className="bg-gradient-to-br from-amber-100 to-green-100 rounded-3xl p-6 shadow-lg border-4 border-green-600">
              <img
                src={freshieProfileImg}
                alt="Freshie Profile"
                className="w-full max-w-sm h-auto rounded-2xl"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
