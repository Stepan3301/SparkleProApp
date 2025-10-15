import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/OptimizedAuthContext';
import { useSimpleTranslation } from '../../utils/i18n';
import { 
  HomeIcon as HomeSolid,
  CalendarIcon as CalendarSolid,
  DocumentTextIcon as DocumentSolid,
  UserIcon as UserSolid
} from '@heroicons/react/24/solid';

interface BottomNavigationProps {
  currentPath: string;
}

// ✅ Custom hook for reduced motion detection
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentPath }) => {
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  const { t } = useSimpleTranslation();
  
  // ✅ Detect reduced motion preference for performance
  const reducedMotion = useReducedMotion();

  // ✅ Memoize callback functions to prevent recreation on every render
  const handleHomeClick = useCallback(() => {
    navigate('/home');
  }, [navigate]);

  const handleBookingClick = useCallback(() => {
    navigate('/booking');
  }, [navigate]);

  const handleHistoryClick = useCallback(() => {
    if (!isGuest) {
      navigate('/history');
    }
  }, [isGuest, navigate]);

  const handleProfileClick = useCallback(() => {
    if (!isGuest) {
      navigate('/profile');
    }
  }, [isGuest, navigate]);

  // ✅ Memoize navigation items array to prevent recreation
  const navItems = useMemo(() => [
    {
      path: '/home',
      icon: <HomeSolid className="w-5 h-5" />,
      label: t('navigation.home', 'Home'),
      onClick: handleHomeClick
    },
    {
      path: '/booking',
      icon: <CalendarSolid className="w-5 h-5" />,
      label: t('navigation.booking', 'Book'),
      onClick: handleBookingClick
    },
    {
      path: '/history',
      icon: <DocumentSolid className="w-5 h-5" />,
      label: t('navigation.history', 'History'),
      onClick: handleHistoryClick
    },
    {
      path: '/profile',
      icon: <UserSolid className="w-5 h-5" />,
      label: t('navigation.profile', 'Profile'),
      onClick: handleProfileClick
    }
  ], [t, handleHomeClick, handleBookingClick, handleHistoryClick, handleProfileClick]);

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 border-t border-gray-200 grid grid-cols-4 pt-2 pb-5 z-50"
      style={{
        // Ensure it stays at bottom on mobile
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        // Add safe area padding for devices with home indicator
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        // Prevent any transform or translate that might move it
        transform: 'none',
        // Ensure it's above other content
        zIndex: 50,
        // ✅ Optimized background - conditional backdrop filter for performance
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: reducedMotion ? 'none' : 'blur(10px)',
        WebkitBackdropFilter: reducedMotion ? 'none' : 'blur(10px)',
        // ✅ Add subtle shadow instead of relying only on blur
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)'
      }}
    >
      {navItems.map((item) => {
        const isActive = currentPath === item.path;
        return (
          <button
            key={item.path}
            onClick={item.onClick}
            className={`flex flex-col items-center gap-1 py-2 px-1 transition-all active:scale-95 ${
              isActive ? 'text-primary' : 'text-gray-400'
            }`}
            style={{
              // Prevent any layout shifts
              minHeight: '60px',
              // Ensure touch targets are large enough
              minWidth: '60px'
            }}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

// ✅ Memoize component to prevent re-renders when props haven't changed
export default memo(BottomNavigation);
