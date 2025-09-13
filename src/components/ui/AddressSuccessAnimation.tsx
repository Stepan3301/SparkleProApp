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
  const [showParticles, setShowParticles] = useState(false);
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
    // First show the text
    setShowSuccessMessage(true);
    
    // Then show particles after a small delay
    setTimeout(() => {
      setShowParticles(true);
    }, 300);
    
    // Complete the action after showing message and particles
    setTimeout(() => {
      onComplete();
    }, 2800);
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

      {/* Confetti Celebration Particles */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none z-5">
          {/* Confetti pieces with random colors and shapes */}
          {[...Array(40)].map((_, i) => {
            // Random angle for more natural confetti spread
            const angle = Math.random() * 360;
            // Random start radius for more scattered effect
            const startRadius = Math.random() * 80;
            // Random final distance for varied confetti travel
            const finalDistance = 200 + Math.random() * 300;
            // Add some randomness to the trajectory
            const angleVariation = (Math.random() - 0.5) * 60; // ±30 degrees variation
            const finalAngle = angle + angleVariation;
            
            const startX = Math.cos(angle * Math.PI / 180) * startRadius;
            const startY = Math.sin(angle * Math.PI / 180) * startRadius;
            const finalX = Math.cos(finalAngle * Math.PI / 180) * finalDistance;
            const finalY = Math.sin(finalAngle * Math.PI / 180) * finalDistance;
            
            // Random colors for confetti
            const colors = ['bg-green-400', 'bg-blue-400', 'bg-yellow-400', 'bg-pink-400', 'bg-purple-400', 'bg-red-400'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Random sizes
            const size = Math.random() > 0.5 ? 'w-2 h-2' : 'w-3 h-3';
            
            return (
              <div
                key={i}
                className={`absolute ${color} ${size} rounded-full opacity-90`}
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px))`,
                  animation: `addressConfettiBurst 2.5s ease-out forwards`,
                  animationDelay: `${Math.random() * 0.3}s`, // Staggered start times
                  '--start-x': `${startX}px`,
                  '--start-y': `${startY}px`,
                  '--final-x': `${finalX}px`,
                  '--final-y': `${finalY}px`,
                } as React.CSSProperties & { '--start-x': string; '--start-y': string; '--final-x': string; '--final-y': string }}
              />
            );
          })}
          
          {/* Sparkle stars with random distribution */}
          {[...Array(20)].map((_, i) => {
            // Random angle
            const angle = Math.random() * 360;
            // Random start radius
            const startRadius = Math.random() * 60;
            // Random final distance
            const finalDistance = 150 + Math.random() * 250;
            // Random trajectory variation
            const angleVariation = (Math.random() - 0.5) * 80;
            const finalAngle = angle + angleVariation;
            
            const startX = Math.cos(angle * Math.PI / 180) * startRadius;
            const startY = Math.sin(angle * Math.PI / 180) * startRadius;
            const finalX = Math.cos(finalAngle * Math.PI / 180) * finalDistance;
            const finalY = Math.sin(finalAngle * Math.PI / 180) * finalDistance;
            
            return (
              <div
                key={`star-${i}`}
                className="absolute text-yellow-300 opacity-90"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px))`,
                  fontSize: `${16 + Math.random() * 12}px`,
                  animation: `addressConfettiStarBurst 2.8s ease-out forwards`,
                  animationDelay: `${Math.random() * 0.4}s`,
                  '--start-x': `${startX}px`,
                  '--start-y': `${startY}px`,
                  '--final-x': `${finalX}px`,
                  '--final-y': `${finalY}px`,
                } as React.CSSProperties & { '--start-x': string; '--start-y': string; '--final-x': string; '--final-y': string }}
              >
                ⭐
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AddressSuccessAnimation;
