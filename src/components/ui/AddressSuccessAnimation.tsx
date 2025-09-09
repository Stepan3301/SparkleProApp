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
    setShowParticles(true);
    setShowSuccessMessage(true);
    
    // Complete the action after showing message and particles
    setTimeout(() => {
      onComplete();
    }, 2500);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50 backdrop-blur-sm">
      <div className="relative flex flex-col items-center justify-center">
        {/* Globe Lottie Animation */}
        {animationData && !showParticles && (
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

        {/* Success Text Animation */}
        {showSuccessMessage && (
          <div className="relative flex justify-center items-center px-4 py-2 z-20 mt-4">
            <p 
              className={`text-white font-bold text-3xl tracking-wide transform transition-all duration-800 ease-out ${
                showSuccessMessage 
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

      {/* Background Celebration Particles */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none z-5">
          {/* Large green celebration particles */}
          {[...Array(20)].map((_, i) => {
            const angle = (i * 360) / 20;
            const startRadius = 50;
            const finalDistance = 350 + Math.random() * 150;
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
                  animation: `addressSuccessBurst 2s ease-out forwards`,
                  animationDelay: `0s`,
                  '--start-x': `${startX}px`,
                  '--start-y': `${startY}px`,
                  '--final-x': `${finalX}px`,
                  '--final-y': `${finalY}px`,
                } as React.CSSProperties & { '--start-x': string; '--start-y': string; '--final-x': string; '--final-y': string }}
              />
            );
          })}
          
          {/* Golden sparkle stars */}
          {[...Array(15)].map((_, i) => {
            const angle = (i * 360) / 15 + 12;
            const startRadius = 40;
            const finalDistance = 280 + Math.random() * 120;
            const startX = Math.cos(angle * Math.PI / 180) * startRadius;
            const startY = Math.sin(angle * Math.PI / 180) * startRadius;
            const finalX = Math.cos(angle * Math.PI / 180) * finalDistance;
            const finalY = Math.sin(angle * Math.PI / 180) * finalDistance;
            
            return (
              <div
                key={`star-${i}`}
                className="absolute text-yellow-300 opacity-80"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${startX}px), calc(-50% + ${startY}px))`,
                  fontSize: `${20 + Math.random() * 8}px`,
                  animation: `addressSuccessStarBurst 2.2s ease-out forwards`,
                  animationDelay: `0s`,
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
          
          {/* Small blue celebration particles */}
          {[...Array(25)].map((_, i) => {
            const angle = (i * 360) / 25 + 6;
            const startRadius = 30;
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
                  animation: `addressSuccessBurst 1.8s ease-out forwards`,
                  animationDelay: `0s`,
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

export default AddressSuccessAnimation;
