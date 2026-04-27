export function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Tiger face simplified logo */}
        <circle cx="50" cy="50" r="45" fill="#FF9500" stroke="#000" strokeWidth="2" />
        {/* Stripes */}
        <path d="M 20 30 Q 25 35 20 40" stroke="#000" strokeWidth="3" fill="none" />
        <path d="M 80 30 Q 75 35 80 40" stroke="#000" strokeWidth="3" fill="none" />
        {/* Eyes */}
        <circle cx="35" cy="45" r="6" fill="#fff" />
        <circle cx="65" cy="45" r="6" fill="#fff" />
        <circle cx="35" cy="45" r="3" fill="#000" />
        <circle cx="65" cy="45" r="3" fill="#000" />
        {/* Nose */}
        <path d="M 50 55 L 45 60 L 55 60 Z" fill="#000" />
        {/* Smile */}
        <path d="M 45 60 Q 50 65 55 60" stroke="#000" strokeWidth="2" fill="none" />
        {/* Ears */}
        <path d="M 25 20 L 20 10 L 35 15 Z" fill="#FF9500" stroke="#000" strokeWidth="2" />
        <path d="M 75 20 L 80 10 L 65 15 Z" fill="#FF9500" stroke="#000" strokeWidth="2" />
      </svg>
    </div>
  );
}
