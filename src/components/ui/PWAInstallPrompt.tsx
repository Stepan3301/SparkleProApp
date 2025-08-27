import React, { useState, useEffect } from 'react';

interface PWAInstallPromptProps {
  variant?: 'card' | 'banner';
  className?: string;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ 
  variant = 'card',
  className = ''
}) => {
  const [isPWA, setIsPWA] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    // Check if app is running as PWA
    const checkPWAStatus = () => {
      try {
        // Check if running in standalone mode (PWA)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        
        // Check if running in fullscreen mode (iOS PWA)
        const isFullscreen = window.navigator.standalone === true;
        
        // Additional PWA indicators
        const isInApp = window.location.search.includes('source=pwa') || 
                       window.location.hash.includes('source=pwa');
        
        // Check if running in a browser tab
        const isInBrowser = !isStandalone && !isFullscreen && !isInApp;
        
        setIsPWA(!isInBrowser);
      } catch (error) {
        console.warn('PWA detection failed:', error);
        // Fallback: assume browser mode if detection fails
        setIsPWA(false);
        setIsIOS(false);
      }
    };

    checkPWAStatus();
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkPWAStatus();
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Don't show anything if user is already using PWA
  if (isPWA) {
    return null;
  }

  const handleVideoClick = () => {
    setShowVideo(true);
  };

  const handleCloseVideo = () => {
    setShowVideo(false);
  };

  if (variant === 'banner') {
    return (
      <>
        <div className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg ${className}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">📱 Install Our App</h3>
              <p className="text-blue-100 mb-3">
                Install our app to your homescreen for better experience
              </p>
              
              <div className="space-y-2 text-sm text-blue-100">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Click "Share" <img src="/share-icon.svg" alt="Share" className="inline w-4 h-4" /> in the bottom of your Safari browser</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Scroll down and find "Add to Home Screen" button</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Click "Add" button in the top right corner</span>
                </div>
              </div>
              
              <button
                onClick={handleVideoClick}
                className="mt-3 text-blue-200 underline hover:text-white transition-colors text-sm"
              >
                Watch video guide
              </button>
            </div>
            
            <div className="ml-4 text-right">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Modal */}
        {showVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Installation Guide</h3>
                <button
                  onClick={handleCloseVideo}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <video
                  controls
                  className="w-full h-auto rounded-lg"
                  onError={(e) => {
                    console.error('Video loading failed:', e);
                  }}
                >
                  <source src="/download-guide.mov" type="video/quicktime" />
                  <source src="/download-guide.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Card variant (default)
  return (
    <>
      <div className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 ${className}`}>
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl text-white">📱</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Install Our App</h3>
          <p className="text-gray-600 text-sm">
            Install our app to your homescreen for better experience
          </p>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span className="text-sm text-gray-700">
                             Click "Share" <img src="/share-icon.svg" alt="Share" className="inline w-4 h-4" /> in the bottom of your Safari browser
            </span>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span className="text-sm text-gray-700">
              Scroll down and find "Add to Home Screen" button
            </span>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span className="text-sm text-gray-700">
              Click "Add" button in the top right corner
            </span>
          </div>
        </div>
        
        <button
          onClick={handleVideoClick}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
        >
          Watch video guide
        </button>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Installation Guide</h3>
              <button
                onClick={handleCloseVideo}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <video
                controls
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  console.error('Video loading failed:', e);
                }}
              >
                <source src="/download-guide.mov" type="video/quicktime" />
                <source src="/download-guide.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt; 