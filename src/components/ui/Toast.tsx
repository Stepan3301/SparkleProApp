import React, { useEffect, useState, memo, useMemo } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  duration = 3000, 
  isVisible, 
  onClose 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300); // Allow exit animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  // ✅ Memoize type styles to avoid recalculation
  const typeStyles = useMemo(() => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-emerald-500 text-white';
    }
  }, [type]);

  // ✅ Memoize icon to avoid recreation
  const icon = useMemo(() => {
    switch (type) {
      case 'success':
        return <CheckIcon className="w-5 h-5" />;
      case 'error':
        return <XMarkIcon className="w-5 h-5" />;
      default:
        return <CheckIcon className="w-5 h-5" />;
    }
  }, [type]);

  if (!isVisible && !isAnimating) return null;

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] transition-all duration-300 ${
        isAnimating && isVisible
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg ${typeStyles}`}>
        {icon}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

// ✅ Memoize Toast component
export default memo(Toast);
