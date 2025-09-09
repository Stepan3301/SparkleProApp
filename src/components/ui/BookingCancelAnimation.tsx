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
  const [textSlideUp, setTextSlideUp] = useState(false);
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

  // Handle animation completion - start text animation
  const handleAnimationComplete = () => {
    setShowTextAnimation(true);
    // Trigger slide-up animation after a short delay
    setTimeout(() => {
      setTextSlideUp(true);
    }, 50);
  };

  // Text animation with proper slide-up timing
  useEffect(() => {
    if (textSlideUp) {
      // Keep text visible for a moment, then start particles
      const particleTimer = setTimeout(() => {
        setShowParticles(true);
        // Complete the animation after particles
        setTimeout(() => {
          onComplete();
        }, 2000);
      }, 800); // Give text time to be visible and appreciated

      return () => clearTimeout(particleTimer);
    }
  }, [textSlideUp, onComplete]);

  // Reset states when visibility changes
  useEffect(() => {
    if (!isVisible) {
      setShowTextAnimation(false);
      setTextSlideUp(false);
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

        {/* Smooth Slide-Up Text Animation - Disappears when particles start */}
        {showTextAnimation && !showParticles && (
          <div className="relative flex justify-center items-center px-4 py-2">
            <p 
              className={`text-white font-bold text-2xl tracking-wide transform transition-all duration-700 ease-out ${
                textSlideUp 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-12'
              }`}
              style={{
                textShadow: '0 0 15px rgba(255,255,255,0.9)',
                filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))',
              }}
            >
              {successText}
            </p>
          </div>
        )}

        {/* Success Particles - Better distributed and animated */}
        {showParticles && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Green Particles - Better distribution in a circle pattern */}
            {[...Array(15)].map((_, i) => {
              const angle = (i * 360) / 15; // Distribute evenly in circle
              const radius = 80 + Math.random() * 40; // Vary radius for depth
              const x = 50 + (radius * Math.cos(angle * Math.PI / 180)) / 3;
              const y = 50 + (radius * Math.sin(angle * Math.PI / 180)) / 3;
              
              return (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-green-400 rounded-full animate-ping"
                  style={{
                    left: `${Math.min(Math.max(x, 10), 90)}%`,
                    top: `${Math.min(Math.max(y, 10), 90)}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${1.2 + Math.random() * 0.6}s`,
                  }}
                />
              );
            })}
            
            {/* Sparkle Stars - Strategic positioning */}
            {[...Array(10)].map((_, i) => {
              // Position stars in different quadrants to avoid clustering
              const quadrant = i % 4;
              let x, y;
              
              switch(quadrant) {
                case 0: // Top-left
                  x = 20 + Math.random() * 25;
                  y = 20 + Math.random() * 25;
                  break;
                case 1: // Top-right
                  x = 55 + Math.random() * 25;
                  y = 20 + Math.random() * 25;
                  break;
                case 2: // Bottom-left
                  x = 20 + Math.random() * 25;
                  y = 55 + Math.random() * 25;
                  break;
                default: // Bottom-right
                  x = 55 + Math.random() * 25;
                  y = 55 + Math.random() * 25;
              }
              
              return (
                <div
                  key={`star-${i}`}
                  className="absolute text-yellow-300 animate-bounce"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    animationDelay: `${0.2 + i * 0.15}s`,
                    fontSize: `${14 + Math.random() * 6}px`,
                    animationDuration: `${0.8 + Math.random() * 0.4}s`,
                  }}
                >
                  ✨
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCancelAnimation;
