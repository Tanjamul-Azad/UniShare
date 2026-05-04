import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  /** Fallback path if there's no history to go back to */
  fallback?: string;
  label?: string;
  className?: string;
}

/**
 * A universal back-navigation button.
 * Uses browser history if available, otherwise navigates to `fallback`.
 */
export default function BackButton({
  fallback = '/',
  label = 'Back',
  className = '',
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    // If there's history to go back to, use it; otherwise use fallback
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`back-btn ${className}`}
      aria-label={`Go back to ${label}`}
    >
      <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
      {label}
    </button>
  );
}
