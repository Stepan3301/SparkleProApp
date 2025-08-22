import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
  onLoadingComplete?: () => void;
  minDuration?: number; // Minimum loading duration in milliseconds
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  isLoading, 
  onLoadingComplete,
  minDuration = 1500 // Default minimum 1.5 seconds
}) => {
  const [showLoader, setShowLoader] = useState(isLoading);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Start fade out after minimum duration
      const timer = setTimeout(() => {
        setFadeOut(true);
        
        // Complete fade out after animation
        setTimeout(() => {
          setShowLoader(false);
          onLoadingComplete?.();
        }, 300); // 300ms fade out duration
        
      }, minDuration);

      return () => clearTimeout(timer);
    } else {
      setShowLoader(true);
      setFadeOut(false);
    }
  }, [isLoading, minDuration, onLoadingComplete]);

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
    </div>
  );
};

export default LoadingScreen;