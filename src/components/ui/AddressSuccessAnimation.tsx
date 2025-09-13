import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

interface AddressSuccessAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

const AddressSuccessAnimation: React.FC<AddressSuccessAnimationProps> = ({
  isVisible,
  onComplete
}) => {
  const [animationData, setAnimationData] = useState<any>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const successText = "Address Added Successfully";

  useEffect(() => {
    if (isVisible) {
      // Load the Globe animation
      fetch('/globe-animation.json')
        .then(response => response.json())
        .then(data => {
          setAnimationData(data);
        })
        .catch(error => {
          console.error('Error loading globe animation:', error);
        });
    }
  }, [isVisible]);

  // Animation will start automatically when loaded

  const handleAnimationComplete = () => {
    // Show the text when animation completes
    setShowSuccessMessage(true);
    
    // Complete the action after showing message
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50 backdrop-blur-sm">
      <div className="relative flex flex-col items-center justify-center">
        {/* Globe Lottie Animation - stays visible until end */}
        {animationData && (
          <div className="relative z-20">
            <Lottie
              animationData={animationData}
              style={{ width: 200, height: 200 }}
              loop={false}
              autoplay={true}
              onComplete={handleAnimationComplete}
            />
          </div>
        )}

        {/* Success Text Animation - centered under globe */}
        {showSuccessMessage && (
          <div className="relative flex justify-center items-center px-4 py-2 z-20 mt-6">
            <p 
              className="text-white font-bold text-3xl text-center tracking-wide animate-slideUpFadeIn"
            >
              {successText}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AddressSuccessAnimation;
