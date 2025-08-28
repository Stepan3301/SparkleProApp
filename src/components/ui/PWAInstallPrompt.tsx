import React, { useState, useEffect, useRef } from 'react';

interface PWAInstallPromptProps {
  variant?: 'card' | 'banner';
  className?: string;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ 
  variant = 'card',
  className = ''
}) => {
  const [isPWA, setIsPWA] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
        
        // Show prompt after a short delay for browser users
        if (isInBrowser) {
          setTimeout(() => setShowPrompt(true), 2000);
        }
      } catch (error) {
        console.warn('PWA detection failed:', error);
        // Fallback: assume browser mode if detection fails
        setIsPWA(false);
        setTimeout(() => setShowPrompt(true), 2000);
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
  if (isPWA || !showPrompt) {
    return null;
  }

  const handleClosePrompt = () => {
    setShowPrompt(false);
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowPrompt(false);
    }
  };

  const handleVideoClick = () => {
    setShowVideo(true);
    setVideoError(false);
  };

  const handleCloseVideo = () => {
    setShowVideo(false);
    setVideoError(false);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video loading failed:', e);
    setVideoError(true);
  };

  const handleVideoLoad = () => {
    setVideoError(false);
  };

  return (
    <>
      {/* Main PWA Installation Prompt Popup */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleOutsideClick}
      >
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header with close button */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <h3 className="text-lg font-semibold">📱 Install Our App</h3>
            <button
              onClick={handleClosePrompt}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors text-white"
            >
              ✕
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 mb-4 text-center">
              Install our app to your homescreen for better experience
            </p>
            
            <div className="space-y-3 mb-6">
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
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Installation Guide Video</h3>
              <button
                onClick={handleCloseVideo}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {videoError ? (
                // Fallback content when video fails to load
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📱</div>
                    <p className="text-sm font-medium mb-2">Video guide temporarily unavailable</p>
                    <p className="text-xs mb-3">Please follow the step-by-step instructions above</p>
                    <button
                      onClick={() => {
                        setVideoError(false);
                        if (videoRef.current) {
                          videoRef.current.load();
                        }
                      }}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
                // Video player
                <video
                  ref={videoRef}
                  controls
                  className="w-full h-auto rounded-lg"
                  onError={handleVideoError}
                  onLoadedData={handleVideoLoad}
                  preload="metadata"
                >
                  <source src="/download-tohomescreen.mp4" type="video/mp4" />
                  <source src="/download-guide.mp4" type="video/mp4" />
                  <source src="/download-guide.mov" type="video/quicktime" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt; 