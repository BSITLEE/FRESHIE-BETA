import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  className?: string;
}

export const BackButton = memo(({ to, className = '' }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  }, [to, navigate]);

  return (
    <Button
      onClick={handleBack}
      variant="outline"
      size="lg"
      className={`
        fixed top-4 left-4 z-50 h-14 px-6 text-xl
        bg-white/90 hover:bg-white border-4 border-yellow-400 
        hover:border-yellow-500 shadow-lg rounded-full
        ${className}
      `}
      style={{ fontFamily: "'Chelsea Market', cursive" }}
    >
      <ArrowLeft className="w-6 h-6 mr-2" />
      Back
    </Button>
  );
});

BackButton.displayName = 'BackButton';
