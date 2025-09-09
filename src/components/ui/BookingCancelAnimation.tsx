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

  // Handle animation completion - start text and particles simultaneously
  const handleAnimationComplete = () => {
    // Start particles immediately when animation stops (background burst)
    setShowParticles(true);
    
    // Start text animation at the same time
    setShowTextAnimation(true);
    setTimeout(() => {
      setTextSlideUp(true);
    }, 100); // Small delay for smooth fade + slide effect
  };

  // Complete the entire animation after particles have had time to flow
  useEffect(() => {
    if (showParticles) {
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 2500); // Give particles time to flow across background

      return () => clearTimeout(completeTimer);
    }
  }, [showParticles, onComplete]);

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
        
        {/* Lottie Animation - Stays visible on final frame */}
        {animationData && (
          <div className="w-32 h-32 mb-4 relative z-20">
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
          <div className="w-32 h-32 mb-4 flex items-center justify-center relative z-20">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Smooth Fade-In + Slide-Up Text Animation */}
        {showTextAnimation && (
          <div className="relative flex justify-center items-center px-4 py-2 z-20">
            <p 
              className={`text-white font-bold text-2xl tracking-wide transform transition-all duration-800 ease-out ${
                textSlideUp 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
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

      </div>

      {/* Background Particle Burst - Behind everything with lower z-index */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none z-5">
          {/* Large background burst particles flowing across entire screen */}
          {[...Array(20)].map((_, i) => {
            const angle = (i * 360) / 20; // More particles for fuller effect
            const startRadius = 60; // Start from behind the animation
            const finalDistance = 300 + Math.random() * 200; // Flow much further across background
            const startX = Math.cos(angle * Math.PI / 180) * startRadius;
            const startY = Math.sin(angle * Math.PI / 180) * startRadius;
            const finalX = Math.cos(angle * Math.PI / 180) * finalDistance;
            const finalY = Math.sin(angle * Math.PI / 180) * finalDistance;
            
            return (
              <div
                key={i}
                className="absolute w-3 h-3 bg-green-400 rounded-full opacity-80"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px))`,
                  animation: `backgroundBurst 2.2s ease-out forwards`,
                  animationDelay: `${i * 0.03}s`,
                  '--start-x': `${startX}px`,
                  '--start-y': `${startY}px`,
                  '--final-x': `${finalX}px`,
                  '--final-y': `${finalY}px`,
                } as React.CSSProperties & { '--start-x': string; '--start-y': string; '--final-x': string; '--final-y': string }}
              />
            );
          })}
          
          {/* Background sparkle stars flowing across screen */}
          {[...Array(15)].map((_, i) => {
            const angle = (i * 360) / 15 + 12; // Offset for variety
            const startRadius = 40;
            const finalDistance = 250 + Math.random() * 150;
            const startX = Math.cos(angle * Math.PI / 180) * startRadius;
            const startY = Math.sin(angle * Math.PI / 180) * startRadius;
            const finalX = Math.cos(angle * Math.PI / 180) * finalDistance;
            const finalY = Math.sin(angle * Math.PI / 180) * finalDistance;
            
            return (
              <div
                key={`bg-star-${i}`}
                className="absolute text-yellow-300 opacity-70"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px))`,
                  fontSize: `${18 + Math.random() * 10}px`,
                  animation: `backgroundStarBurst 2.5s ease-out forwards`,
                  animationDelay: `${0.05 + i * 0.04}s`,
                  '--start-x': `${startX}px`,
                  '--start-y': `${startY}px`,
                  '--final-x': `${finalX}px`,
                  '--final-y': `${finalY}px`,
                } as React.CSSProperties & { '--start-x': string; '--start-y': string; '--final-x': string; '--final-y': string }}
              >
                ✨
              </div>
            );
          })}
          
          {/* Additional smaller particles for richness */}
          {[...Array(25)].map((_, i) => {
            const angle = (i * 360) / 25 + 7.2; // Small offset
            const startRadius = 30;
            const finalDistance = 200 + Math.random() * 250;
            const startX = Math.cos(angle * Math.PI / 180) * startRadius;
            const startY = Math.sin(angle * Math.PI / 180) * startRadius;
            const finalX = Math.cos(angle * Math.PI / 180) * finalDistance;
            const finalY = Math.sin(angle * Math.PI / 180) * finalDistance;
            
            return (
              <div
                key={`small-${i}`}
                className="absolute w-1 h-1 bg-blue-300 rounded-full opacity-60"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px))`,
                  animation: `backgroundBurst 2s ease-out forwards`,
                  animationDelay: `${0.1 + i * 0.02}s`,
                  '--start-x': `${startX}px`,
                  '--start-y': `${startY}px`,
                  '--final-x': `${finalX}px`,
                  '--final-y': `${finalY}px`,
                } as React.CSSProperties & { '--start-x': string; '--start-y': string; '--final-x': string; '--final-y': string }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingCancelAnimation;
