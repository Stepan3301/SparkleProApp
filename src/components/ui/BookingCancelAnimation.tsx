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
              className={`text-white font-bold text-3xl tracking-wide transform transition-all duration-800 ease-out ${
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
          {/* Large confetti burst particles exploding simultaneously */}
          {[...Array(25)].map((_, i) => {
            const angle = (i * 360) / 25; // Even distribution
            const startRadius = 40; // Start closer to center for true burst effect
            const finalDistance = 350 + Math.random() * 150; // Varied distances for natural look
            const startX = Math.cos(angle * Math.PI / 180) * startRadius;
            const startY = Math.sin(angle * Math.PI / 180) * startRadius;
            const finalX = Math.cos(angle * Math.PI / 180) * finalDistance;
            const finalY = Math.sin(angle * Math.PI / 180) * finalDistance;
            
            return (
              <div
                key={i}
                className="absolute w-3 h-3 bg-green-400 rounded-full opacity-90"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px))`,
                  animation: `confettiBurst 2s ease-out forwards`,
                  animationDelay: `0s`, // All start simultaneously!
                  '--start-x': `${startX}px`,
                  '--start-y': `${startY}px`,
                  '--final-x': `${finalX}px`,
                  '--final-y': `${finalY}px`,
                } as React.CSSProperties & { '--start-x': string; '--start-y': string; '--final-x': string; '--final-y': string }}
              />
            );
          })}
          
          {/* Sparkle confetti bursting simultaneously */}
          {[...Array(18)].map((_, i) => {
            const angle = (i * 360) / 18 + 10; // Offset for variety
            const startRadius = 35;
            const finalDistance = 280 + Math.random() * 120;
            const startX = Math.cos(angle * Math.PI / 180) * startRadius;
            const startY = Math.sin(angle * Math.PI / 180) * startRadius;
            const finalX = Math.cos(angle * Math.PI / 180) * finalDistance;
            const finalY = Math.sin(angle * Math.PI / 180) * finalDistance;
            
            return (
              <div
                key={`bg-star-${i}`}
                className="absolute text-yellow-300 opacity-80"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px))`,
                  fontSize: `${20 + Math.random() * 8}px`,
                  animation: `confettiStarBurst 2.2s ease-out forwards`,
                  animationDelay: `0s`, // All burst simultaneously!
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
          
          {/* Small confetti particles for richness - all burst together */}
          {[...Array(30)].map((_, i) => {
            const angle = (i * 360) / 30 + 6; // Small offset for variety
            const startRadius = 25;
            const finalDistance = 220 + Math.random() * 180;
            const startX = Math.cos(angle * Math.PI / 180) * startRadius;
            const startY = Math.sin(angle * Math.PI / 180) * startRadius;
            const finalX = Math.cos(angle * Math.PI / 180) * finalDistance;
            const finalY = Math.sin(angle * Math.PI / 180) * finalDistance;
            
            return (
              <div
                key={`small-${i}`}
                className="absolute w-2 h-2 bg-blue-300 rounded-full opacity-70"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px))`,
                  animation: `confettiBurst 1.8s ease-out forwards`,
                  animationDelay: `0s`, // Simultaneous burst!
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
