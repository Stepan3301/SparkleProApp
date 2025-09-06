import React, { useState, useEffect } from 'react';
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
  const [animationComplete, setAnimationComplete] = useState(false);

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
        setAnimationComplete(true);
        setShowSuccessMessage(true);
      }
    };

    if (isVisible && !animationData) {
      loadAnimation();
    }
  }, [isVisible, animationData]);

  // Handle animation completion
  const handleAnimationComplete = () => {
    setAnimationComplete(true);
    setShowSuccessMessage(true);
    
    // Show success message for 1.5 seconds, then complete
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  // Reset states when visibility changes
  useEffect(() => {
    if (!isVisible) {
      setShowSuccessMessage(false);
      setAnimationComplete(false);
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
        {!animationComplete && animationData && (
          <div className="w-32 h-32 mb-4">
            <Lottie
              animationData={animationData}
              loop={false}
              autoplay={true}
              onComplete={handleAnimationComplete}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        )}

        {/* Fallback if no animation data */}
        {!animationComplete && !animationData && (
          <div className="w-32 h-32 mb-4 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <div className={`transform transition-all duration-500 ease-out ${
            showSuccessMessage 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-8 opacity-0'
          }`}>
            <div className="bg-white rounded-2xl px-8 py-4 shadow-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-900 font-semibold">Successfully Cancelled</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCancelAnimation;
