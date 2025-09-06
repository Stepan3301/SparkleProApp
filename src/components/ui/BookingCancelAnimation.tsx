import React, { useState, useEffect, useRef } from 'react';
import Lottie from 'lottie-react';

interface BookingCancelAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

const BookingCancelAnimation: React.FC<BookingCancelAnimationProps> = ({
  isVisible,
  onComplete
}) => {
  const [animationData, setAnimationData] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const lottieRef = useRef<any>(null);

  // Load animation data when component mounts
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const response = await fetch('/delete-animation.lottie');
        const data = await response.json();
        setAnimationData(data);
      } catch (error) {
        console.error('Error loading animation:', error);
        // Fallback - proceed without animation
        setShowSuccessMessage(true);
      }
    };

    if (isVisible && !animationData) {
      loadAnimation();
    }
  }, [isVisible, animationData]);

  // Set animation speed and ensure proper playback when animation is loaded
  useEffect(() => {
    if (lottieRef.current && animationData) {
      // Set speed to 0.5x (half speed)
      lottieRef.current.setSpeed(0.5);
      // Ensure animation plays from start
      lottieRef.current.goToAndPlay(0, true);
    }
  }, [animationData]);

  // Handle animation completion
  const handleAnimationComplete = () => {
    // Show success message after animation completes
    setTimeout(() => {
      setShowSuccessMessage(true);
      
      // Keep both animation and message visible for 2 seconds, then complete
      setTimeout(() => {
        onComplete();
      }, 2000);
    }, 100); // Small delay to ensure animation frame is stable
  };

  // Reset states when visibility changes
  useEffect(() => {
    if (!isVisible) {
      setShowSuccessMessage(false);
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-gray-500 bg-opacity-50 backdrop-blur-sm" />
      
      {/* Animation Content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        
        {/* Lottie Animation */}
        {animationData && (
          <div className="w-32 h-32 mb-4">
            <Lottie
              lottieRef={lottieRef}
              animationData={animationData}
              loop={false}
              autoplay={true}
              onComplete={handleAnimationComplete}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        )}

        {/* Fallback if no animation data */}
        {!animationData && (
          <div className="w-32 h-32 mb-4 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Success Message - matches error message styling */}
        {showSuccessMessage && (
          <div className={`transform transition-all duration-500 ease-out ${
            showSuccessMessage 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-8 opacity-0'
          }`}>
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold text-lg tracking-wide">Successfully Cancelled</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCancelAnimation;
