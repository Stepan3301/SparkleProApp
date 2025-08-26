import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
  onLoadingComplete?: () => void;
  minDuration?: number; // Minimum loading duration in milliseconds
  smartLoading?: boolean; // Enable smart loading based on actual data fetch time
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  isLoading, 
  onLoadingComplete,
  minDuration = 1500, // Default minimum 1.5 seconds
  smartLoading = false // Default to traditional loading
}) => {
  const [showLoader, setShowLoader] = useState(isLoading);
  const [fadeOut, setFadeOut] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [actualLoadTime, setActualLoadTime] = useState<number>(0);

  useEffect(() => {
    if (isLoading) {
      // Start loading - record start time
      setShowLoader(true);
      setFadeOut(false);
      setStartTime(Date.now());
    } else {
      // Loading complete - calculate actual load time
      const endTime = Date.now();
      const loadTime = startTime ? endTime - startTime : 0;
      setActualLoadTime(loadTime);
      
      if (smartLoading) {
        // Smart loading: use actual load time with a small buffer
        const smartDuration = Math.max(loadTime + 100, 300); // At least 300ms for smooth UX
        
        const timer = setTimeout(() => {
          setFadeOut(true);
          
          // Complete fade out after animation
          setTimeout(() => {
            setShowLoader(false);
            onLoadingComplete?.();
          }, 300); // 300ms fade out duration
          
        }, smartDuration);

        return () => clearTimeout(timer);
      } else {
        // Traditional loading: use minimum duration
        const timer = setTimeout(() => {
          setFadeOut(true);
          
          // Complete fade out after animation
          setTimeout(() => {
            setShowLoader(false);
            onLoadingComplete?.();
          }, 300); // 300ms fade out duration
          
        }, minDuration);

        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, minDuration, onLoadingComplete, smartLoading, startTime]);

  if (!showLoader) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="text-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-32 h-32 object-contain"
          onError={(e) => {
            console.error('Video loading failed:', e);
          }}
        >
          <source src="/finalncsloader.mp4" type="video/mp4" />
        </video>
        
        {/* Debug info - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-gray-500">
            {smartLoading ? (
              <div>
                <div>Smart Loading: {actualLoadTime}ms</div>
                <div>Min Duration: {minDuration}ms</div>
              </div>
            ) : (
              <div>Traditional Loading: {minDuration}ms</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;