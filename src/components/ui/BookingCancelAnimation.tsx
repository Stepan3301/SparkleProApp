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
  const [showTextAnimation, setShowTextAnimation] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const lottieRef = useRef<any>(null);

  const successText = "Successfully Cancelled";

  // Load animation data when component mounts
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const response = await fetch('/delete-animation.json');
        const data = await response.json();
        setAnimationData(data);
      } catch (error) {
        console.error('Error loading animation:', error);
        // Fallback - proceed without animation
        setShowTextAnimation(true);
      }
    };

    if (isVisible && !animationData) {
      loadAnimation();
    }
  }, [isVisible, animationData]);

  // Set animation speed and ensure proper playback when animation is loaded
  useEffect(() => {
    if (lottieRef.current && animationData) {
      // Set speed to 1x (normal speed)
      lottieRef.current.setSpeed(1);
      // Ensure animation plays from start
      lottieRef.current.goToAndPlay(0, true);
    }
  }, [animationData]);

  // Handle animation completion - start text burst animation
  const handleAnimationComplete = () => {
    setShowTextAnimation(true);
  };

  // Simple text animation with slide up effect
  useEffect(() => {
    if (showTextAnimation) {
      // Start particle explosion after a brief delay
      const particleTimer = setTimeout(() => {
        setShowParticles(true);
        // Complete the animation after particles
        setTimeout(() => {
          onComplete();
        }, 2000);
      }, 500); // Give text time to slide in

      return () => clearTimeout(particleTimer);
    }
  }, [showTextAnimation, onComplete]);

  // Reset states when visibility changes
  useEffect(() => {
    if (!isVisible) {
      setShowTextAnimation(false);
      setShowParticles(false);
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
        
        {/* Lottie Animation - Disappears when particles start */}
        {animationData && !showParticles && (
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
        {!animationData && !showParticles && (
          <div className="w-32 h-32 mb-4 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Simple Slide-Up Text Animation - Disappears when particles start */}
        {showTextAnimation && !showParticles && (
          <div className="relative flex justify-center items-center px-4 py-2">
            <p 
              className={`text-white font-bold text-2xl tracking-wide transform transition-all duration-500 ease-out ${
                showTextAnimation 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{
                textShadow: '0 0 10px rgba(255,255,255,0.8)',
              }}
            >
              {successText}
            </p>
          </div>
        )}

        {/* Success Particles - Show separately after both text and animation disappear */}
        {showParticles && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-green-400 rounded-full animate-ping"
                style={{
                  left: `${50 + (Math.random() - 0.5) * 200}%`,
                  top: `${50 + (Math.random() - 0.5) * 200}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
            {[...Array(8)].map((_, i) => (
              <div
                key={`star-${i}`}
                className="absolute text-yellow-300 animate-bounce"
                style={{
                  left: `${30 + Math.random() * 40}%`,
                  top: `${30 + Math.random() * 40}%`,
                  animationDelay: `${Math.random() * 0.3}s`,
                  fontSize: `${12 + Math.random() * 8}px`,
                }}
              >
                ✨
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCancelAnimation;
