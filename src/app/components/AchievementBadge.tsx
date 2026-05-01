import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { Star, Trophy, Medal, Award, Sparkles, Heart } from 'lucide-react';

interface AchievementBadgeProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const AchievementBadge = memo(({ type, size = 'md', animated = true }: AchievementBadgeProps) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'Star':
        return {
          icon: Star,
          gradient: 'from-yellow-300 via-yellow-400 to-orange-400',
          border: 'border-yellow-500',
          glow: 'shadow-yellow-400/50',
        };
      case 'Trophy':
        return {
          icon: Trophy,
          gradient: 'from-amber-300 via-yellow-400 to-amber-500',
          border: 'border-amber-600',
          glow: 'shadow-amber-400/50',
        };
      case 'Medal':
        return {
          icon: Medal,
          gradient: 'from-blue-300 via-blue-400 to-purple-400',
          border: 'border-blue-500',
          glow: 'shadow-blue-400/50',
        };
      case 'Perfect':
        return {
          icon: Award,
          gradient: 'from-pink-300 via-rose-400 to-pink-500',
          border: 'border-pink-500',
          glow: 'shadow-pink-400/50',
        };
      case 'Sparkle':
        return {
          icon: Sparkles,
          gradient: 'from-purple-300 via-purple-400 to-indigo-400',
          border: 'border-purple-500',
          glow: 'shadow-purple-400/50',
        };
      case 'Heart':
        return {
          icon: Heart,
          gradient: 'from-red-300 via-rose-400 to-pink-400',
          border: 'border-red-500',
          glow: 'shadow-red-400/50',
        };
      default:
        return {
          icon: Star,
          gradient: 'from-gray-300 via-gray-400 to-gray-500',
          border: 'border-gray-500',
          glow: 'shadow-gray-400/50',
        };
    }
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const badge = (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${config.gradient}
        flex items-center justify-center shadow-lg ${config.glow} border-4 ${config.border}
        relative overflow-hidden`}
    >
      {/* shine effect because i think it looks cool */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />

      {/* icon!!! */}
      <Icon className={`${iconSizes[size]} text-white relative z-10`} fill="white" />

      {/* decorative dots */}
      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white/70 rounded-full" />
      <div className="absolute bottom-1 left-1 w-1 h-1 bg-white/50 rounded-full" />
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
});

AchievementBadge.displayName = 'AchievementBadge';
