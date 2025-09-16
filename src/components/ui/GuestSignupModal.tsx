import React, { useEffect, useRef } from 'react';

interface GuestSignupModalProps {
  isVisible: boolean;
  onClose: () => void;
  message: string;
  onSignup: () => void;
}

const GuestSignupModal: React.FC<GuestSignupModalProps> = ({
  isVisible,
  onClose,
  message,
  onSignup
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const [isAnimating, setIsAnimating] = React.useState(false);

  useEffect(() => {
    if (isVisible) {
      // Store the currently focused element
      lastFocusedRef.current = document.activeElement as HTMLElement;
      
      // Prevent background scroll
      document.body.style.overflow = 'hidden';
      
      // Start entrance animation
      setIsAnimating(true);
      
      // Focus the first button after animation
      setTimeout(() => {
        const sureBtn = modalRef.current?.querySelector('#sureBtn') as HTMLElement;
        sureBtn?.focus();
      }, 350); // Wait for animation to complete
    } else {
      // Start exit animation
      setIsAnimating(false);
      
      // Clean up after animation
      setTimeout(() => {
        // Restore background scroll
        document.body.style.overflow = '';
        
        // Return focus to the previously focused element
        if (lastFocusedRef.current && typeof lastFocusedRef.current.focus === 'function') {
          lastFocusedRef.current.focus();
        }
      }, 250); // Wait for exit animation
    }
  }, [isVisible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      
      // ESC to close
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      
      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
        const list = Array.from(focusables) as HTMLElement[];
        if (!list.length) return;
        
        const first = list[0];
        const last = list[list.length - 1];
        
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className={`fixed inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-300 ease-out z-[99998] ${
          isVisible && isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={`fixed left-1/2 top-1/2 w-[92vw] max-w-[520px] bg-white/80 backdrop-blur-lg border border-white/60 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.12)] p-[22px_22px_18px] overflow-hidden z-[99999] ${
          isVisible && isAnimating 
            ? 'animate-fadeSlideIn' 
            : 'opacity-0 translate-x-[-50%] translate-y-[calc(-50%+22px)]'
        }`}
        style={{ 
          pointerEvents: isVisible ? 'auto' : 'none',
          zIndex: 99999
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
        aria-describedby="modalDesc"
        aria-hidden="false"
      >
        {/* Glass shine effect */}
        <div 
          className="absolute inset-[-1px] pointer-events-none mix-blend-screen"
          style={{
            background: `
              linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0) 40%),
              radial-gradient(120% 60% at 0% 0%, rgba(255,255,255,0.8), transparent 50%),
              radial-gradient(100% 80% at 100% 0%, rgba(255,255,255,0.35), transparent 60%)
            `
          }}
        />
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-1.5">
          {/* Cleaning-themed icon */}
          <svg className="w-9 h-9 flex-shrink-0 fill-none stroke-[#0ABDC6] stroke-[3] drop-shadow-[0_2px_6px_rgba(10,189,198,0.35)]" viewBox="0 0 64 64" aria-hidden="true">
            <path d="M12 46h40v6a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4v-6Z"></path>
            <path d="M20 30h24l6 16H14l6-16Z"></path>
            <path d="M24 18h16v8H24z"></path>
            <circle cx="18" cy="12" r="3"></circle>
            <circle cx="46" cy="10" r="2.5"></circle>
            <circle cx="40" cy="6" r="2"></circle>
          </svg>
          <h2 id="modalTitle" className="m-0 text-xl font-extrabold tracking-wide">
            Sign Up Required ✨
          </h2>
        </div>

        {/* Message */}
        <p id="modalDesc" className="mt-1.5 mx-0.5 mb-3.5 leading-relaxed text-base text-[#0b2a35]">
          {message}
        </p>

        {/* Divider */}
        <div 
          className="h-px bg-gradient-to-r from-transparent via-[rgba(10,189,198,0.4)] to-transparent mb-3"
          aria-hidden="true"
        />

        {/* Actions */}
        <div className="flex gap-2.5 justify-end">
          <button
            onClick={onClose}
            className="border-0 rounded-xl px-4 py-3 font-bold cursor-pointer bg-[rgba(10,189,198,0.08)] text-[#088f97] hover:bg-[rgba(10,189,198,0.14)] transition-colors"
          >
            go back
          </button>
          <button
            id="sureBtn"
            onClick={onSignup}
            className="border-0 rounded-xl px-4 py-3 font-bold cursor-pointer bg-gradient-to-br from-[#0ABDC6] to-[#00E6B8] text-white shadow-[0_6px_16px_rgba(0,0,0,0.12),0_6px_18px_rgba(10,189,198,0.25)] hover:saturate-105 hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(0,0,0,0.15),0_8px_22px_rgba(10,189,198,0.3)] active:translate-y-0 transition-all duration-200"
          >
            sure!
          </button>
        </div>

        {/* Decorative bubbles */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <span className="absolute bottom-[-20px] left-[6%] w-2 h-2 rounded-full bg-gradient-radial from-white to-[rgba(255,255,255,0.6)] shadow-[inset_0_0_8px_rgba(255,255,255,0.9),0_1px_4px_rgba(0,0,0,0.08)] animate-float opacity-80" style={{ animationDuration: '5s' }}></span>
          <span className="absolute bottom-[-20px] left-[20%] w-3 h-3 rounded-full bg-gradient-radial from-white to-[rgba(255,255,255,0.6)] shadow-[inset_0_0_8px_rgba(255,255,255,0.9),0_1px_4px_rgba(0,0,0,0.08)] animate-float opacity-80" style={{ animationDuration: '6s', animationDelay: '0.8s' }}></span>
          <span className="absolute bottom-[-20px] left-[58%] w-2.5 h-2.5 rounded-full bg-gradient-radial from-white to-[rgba(255,255,255,0.6)] shadow-[inset_0_0_8px_rgba(255,255,255,0.9),0_1px_4px_rgba(0,0,0,0.08)] animate-float opacity-80" style={{ animationDuration: '6s', animationDelay: '1.6s' }}></span>
          <span className="absolute bottom-[-20px] left-[78%] w-3.5 h-3.5 rounded-full bg-gradient-radial from-white to-[rgba(255,255,255,0.6)] shadow-[inset_0_0_8px_rgba(255,255,255,0.9),0_1px_4px_rgba(0,0,0,0.08)] animate-float opacity-80" style={{ animationDuration: '6s', animationDelay: '2.2s' }}></span>
          <span className="absolute bottom-[-20px] left-[90%] w-1.5 h-1.5 rounded-full bg-gradient-radial from-white to-[rgba(255,255,255,0.6)] shadow-[inset_0_0_8px_rgba(255,255,255,0.9),0_1px_4px_rgba(0,0,0,0.08)] animate-float opacity-80" style={{ animationDuration: '6s', animationDelay: '3s' }}></span>
        </div>
      </div>
    </>
  );
};

export default GuestSignupModal;
