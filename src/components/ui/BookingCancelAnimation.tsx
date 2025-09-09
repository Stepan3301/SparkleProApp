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

        {/* Success Particles - Released from text center and flowing outward */}
        {showParticles && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Green Particles - Released from text center with custom animations */}
            {[...Array(12)].map((_, i) => {
              const angle = (i * 360) / 12;
              const finalDistance = 60 + Math.random() * 80;
              const finalX = Math.cos(angle * Math.PI / 180) * finalDistance;
              const finalY = Math.sin(angle * Math.PI / 180) * finalDistance;
              
              return (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-green-400 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: `particleFlow 1.5s ease-out forwards`,
                    animationDelay: `${i * 0.05}s`,
                    '--final-x': `${finalX}px`,
                    '--final-y': `${finalY}px`,
                  } as React.CSSProperties & { '--final-x': string; '--final-y': string }}
                />
              );
            })}
            
            {/* Sparkle Stars - Released from text center with rotation */}
            {[...Array(8)].map((_, i) => {
              const angle = (i * 360) / 8 + 22.5;
              const finalDistance = 40 + Math.random() * 60;
              const finalX = Math.cos(angle * Math.PI / 180) * finalDistance;
              const finalY = Math.sin(angle * Math.PI / 180) * finalDistance;
              
              return (
                <div
                  key={`star-${i}`}
                  className="absolute text-yellow-300"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${16 + Math.random() * 8}px`,
                    animation: `starFlow 1.8s ease-out forwards`,
                    animationDelay: `${0.1 + i * 0.08}s`,
                    '--final-x': `${finalX}px`,
                    '--final-y': `${finalY}px`,
                  } as React.CSSProperties & { '--final-x': string; '--final-y': string }}
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
