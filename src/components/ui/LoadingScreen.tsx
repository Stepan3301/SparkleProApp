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
        }, 500); // 500ms fade out duration
        
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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
      
      {/* Loading Content */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Logo Video Loader */}
        <div className="mb-8">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-32 h-32 object-contain"
            onError={(e) => {
              console.error('Video loading failed:', e);
              // Fallback to static logo if video fails
              e.currentTarget.style.display = 'none';
            }}
          >
            <source src="/sparkleproloader.mp4" type="video/mp4" />
            {/* Fallback for browsers that don't support video */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">SP</span>
            </div>
          </video>
        </div>

        {/* App Name */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">SparklePro</h1>
        <p className="text-gray-600 text-lg mb-8">Professional Cleaning Services</p>

        {/* Loading Indicator */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Loading Text */}
        <p className="text-gray-500 text-sm mt-4 animate-pulse">Loading your dashboard...</p>
      </div>

      {/* Floating Elements for Visual Appeal */}
      <div className="absolute top-20 left-20 w-4 h-4 bg-blue-300 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute top-40 right-32 w-3 h-3 bg-purple-300 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-32 left-1/4 w-5 h-5 bg-indigo-300 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 right-20 w-2 h-2 bg-pink-300 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
    </div>
  );
};

export default LoadingScreen;