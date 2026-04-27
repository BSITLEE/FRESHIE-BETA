import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import landingImg from '../../artassets/freshielanding.png';
import logoImg from '../../artassets/freshielogo.png';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${landingImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Decorative floating shapes */}
      <motion.div
        className="absolute top-20 left-10 opacity-20"
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="60" height="60" viewBox="0 0 100 100" className="text-yellow-400">
          <circle cx="50" cy="50" r="40" fill="currentColor" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute top-40 right-20 opacity-15"
        animate={{ y: [0, 20, 0], rotate: [0, -15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <svg width="70" height="70" viewBox="0 0 100 100" className="text-green-500">
          <polygon points="50,10 90,80 10,80" fill="currentColor" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-32 left-1/4 opacity-20"
        animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <svg width="50" height="50" viewBox="0 0 100 100" className="text-orange-400">
          <rect x="10" y="10" width="80" height="80" fill="currentColor" rx="10" />
        </svg>
      </motion.div>

      {/* Logo at Top Right */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute top-2 right-6 z-20"
      >
        <img
          src={logoImg}
          alt="Freshie's Safari Logo"
          className="w-32 md:w-48 h-auto"
          style={{
            filter: 'drop-shadow(4px 4px 8px rgba(0,0,0,0.8)) drop-shadow(0 0 12px rgba(255,255,255,0.6))',
          }}
        />
      </motion.div>

      {/* Top Navigation Bar - WITHOUT Home button */}
      <nav className="flex justify-center gap-6 md:gap-8 pt-8 pb-4 z-10">
        <motion.button
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate('/about')}
          className="text-2xl md:text-3xl font-bold text-green-800 hover:text-green-700 transition-colors bg-white hover:bg-gray-50 px-8 py-3 rounded-2xl border-3 border-green-600 shadow-lg"
          style={{
            fontFamily: "'Cabin Sketch', cursive",
          }}
        >
          About
        </motion.button>
        <motion.button
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate('/freshie')}
          className="text-2xl md:text-3xl font-bold text-green-800 hover:text-green-700 transition-colors bg-white hover:bg-gray-50 px-8 py-3 rounded-2xl border-3 border-green-600 shadow-lg"
          style={{
            fontFamily: "'Cabin Sketch', cursive",
          }}
        >
          Freshie
        </motion.button>
      </nav>

      {/* CTA Button Below Navigation */}
      <div className="flex justify-center mt-8 md:mt-12 z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
        >
          <Button
            onClick={() => navigate('/login')}
            className="text-3xl md:text-4xl px-16 py-10 rounded-3xl bg-green-600 hover:bg-green-700 shadow-2xl font-bold hover:scale-105 transition-transform border-0"
            style={{
              fontFamily: "'Cabin Sketch', cursive",
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            Start Learning!
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
