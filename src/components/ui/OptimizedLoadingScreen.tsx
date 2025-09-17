import React, { useEffect, useState, useCallback } from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
  onLoadingComplete?: () => void;
  minDuration?: number;
  smartLoading?: boolean;
}

const OptimizedLoadingScreen: React.FC<LoadingScreenProps> = ({ 
  isLoading, 
  onLoadingComplete,
  minDuration = 800, // Reduced default minimum duration
  smartLoading = true // Default to smart loading for better UX
}) => {
  const [showLoader, setShowLoader] = useState(isLoading);
  const [fadeOut, setFadeOut] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Optimized loading completion handler
  const handleLoadingComplete = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      setShowLoader(false);
      onLoadingComplete?.();
    }, 200); // Reduced fade out duration
  }, [onLoadingComplete]);

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
      setFadeOut(false);
      setStartTime(Date.now());
    } else {
      const endTime = Date.now();
      const loadTime = startTime ? endTime - startTime : 0;
      
      if (smartLoading) {
        // Smart loading: use actual load time with minimal buffer
        const smartDuration = Math.max(loadTime + 50, 200); // At least 200ms for smooth UX
        
        const timer = setTimeout(handleLoadingComplete, smartDuration);
        return () => clearTimeout(timer);
      } else {
        // Traditional loading: use minimum duration
        const timer = setTimeout(handleLoadingComplete, minDuration);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, minDuration, smartLoading, startTime, handleLoadingComplete]);

  if (!showLoader) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-200 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ 
        backgroundColor: '#ffffff',
        // Optimize for mobile rendering
        willChange: 'opacity',
        transform: 'translateZ(0)', // Force hardware acceleration
      }}
    >
      <div className="text-center">
        {/* Optimized loading animation - use CSS instead of video for better performance */}
        <div className="w-32 h-32 flex items-center justify-center">
          <div className="relative">
            {/* Spinning circle animation */}
            <div 
              className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"
              style={{
                animation: 'spin 1s linear infinite',
                willChange: 'transform'
              }}
            />
            {/* Inner pulsing dot */}
            <div 
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2"
              style={{
                animation: 'pulse 1.5s ease-in-out infinite',
                willChange: 'opacity'
              }}
            />
          </div>
        </div>
        
        {/* Add CSS animations inline for better performance */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default OptimizedLoadingScreen;
