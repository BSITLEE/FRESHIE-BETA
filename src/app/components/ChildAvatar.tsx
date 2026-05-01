import { memo } from 'react';

interface ChildAvatarProps {
  avatar: string;
  size?: 'sm' | 'md' | 'lg';
  showBorder?: boolean;
}

export const ChildAvatar = memo(({ avatar, size = 'md', showBorder = true }: ChildAvatarProps) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-2xl',
    md: 'w-14 h-14 text-3xl',
    lg: 'w-20 h-20 text-5xl',
  };

  // Generate a colorful background based on the emoji
  const getBackgroundGradient = (emoji: string) => {
    const gradients = [
      'from-orange-400 to-yellow-500',
      'from-blue-400 to-cyan-500',
      'from-pink-400 to-rose-500',
      'from-green-400 to-emerald-500',
      'from-purple-400 to-indigo-500',
      'from-red-400 to-pink-500',
      'from-amber-400 to-orange-500',
      'from-teal-400 to-cyan-500',
      'from-yellow-400 to-amber-500',
      'from-indigo-400 to-purple-500',
    ];

    // Use emoji code to consistently select a gradient
    const index = emoji.codePointAt(0) || 0;
    return gradients[index % gradients.length];
  };

  const backgroundGradient = getBackgroundGradient(avatar);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${backgroundGradient}
        flex items-center justify-center font-bold
        ${showBorder ? 'border-4 border-white shadow-lg' : ''}
        relative overflow-hidden`}
    >
      {/* shine effect again*/}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />

      {/* emojis */}
      <span className="relative z-10">{avatar}</span>
    </div>
  );
});

ChildAvatar.displayName = 'ChildAvatar';
