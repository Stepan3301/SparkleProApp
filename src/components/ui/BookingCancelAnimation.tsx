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
  const [visibleLetters, setVisibleLetters] = useState(0);
  const lottieRef = useRef<any>(null);

  const successText = "Successfully Cancelled";
  const letters = successText.split('');

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
      // Set speed to 0.5x (half speed)
      lottieRef.current.setSpeed(0.5);
      // Ensure animation plays from start
      lottieRef.current.goToAndPlay(0, true);
    }
  }, [animationData]);

  // Handle animation completion - start text burst animation
  const handleAnimationComplete = () => {
    setShowTextAnimation(true);
  };

  // Text burst animation effect
  useEffect(() => {
    if (showTextAnimation) {
      const timer = setInterval(() => {
        setVisibleLetters(prev => {
          if (prev >= letters.length) {
            clearInterval(timer);
            // After all letters are shown, start particle explosion
            setTimeout(() => {
              setShowParticles(true);
              // Complete the animation after particles
              setTimeout(() => {
                onComplete();
              }, 2000);
            }, 300);
            return prev;
          }
          return prev + 1;
        });
      }, 80); // 80ms between each letter

      return () => clearInterval(timer);
    }
  }, [showTextAnimation, letters.length, onComplete]);

  // Reset states when visibility changes
  useEffect(() => {
    if (!isVisible) {
      setShowTextAnimation(false);
      setShowParticles(false);
      setVisibleLetters(0);
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
        {animationData && !showTextAnimation && (
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
        {!animationData && !showTextAnimation && (
          <div className="w-32 h-32 mb-4 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Burst Text Animation */}
        {showTextAnimation && (
          <div className="relative flex flex-wrap justify-center items-center gap-1 px-4 py-2">
            {letters.map((letter, index) => (
              <span
                key={index}
                className={`inline-block text-white font-bold text-2xl tracking-wide transform transition-all duration-300 ${
                  index < visibleLetters
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-150 translate-y-4'
                } ${letter === ' ' ? 'w-2' : ''}`}
                style={{
                  transitionDelay: `${index * 50}ms`,
                  textShadow: '0 0 10px rgba(255,255,255,0.8)',
                }}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </span>
            ))}
            
            {/* Success Particles */}
            {showParticles && (
              <>
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCancelAnimation;
