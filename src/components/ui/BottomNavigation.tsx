import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentPath }) => {
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  const { t } = useSimpleTranslation();

  const handleHistoryClick = () => {
    if (isGuest) {
      // This will be handled by the parent component
      return;
    }
    navigate('/history');
  };

  const handleProfileClick = () => {
    if (isGuest) {
      // This will be handled by the parent component
      return;
    }
    navigate('/profile');
  };

  const navItems = [
    {
      path: '/home',
      icon: <HomeSolid className="w-5 h-5" />,
      label: t('navigation.home', 'Home'),
      onClick: () => navigate('/home')
    },
    {
      path: '/booking',
      icon: <CalendarSolid className="w-5 h-5" />,
      label: t('navigation.booking', 'Book'),
      onClick: () => navigate('/booking')
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
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 grid grid-cols-4 pt-2 pb-5 z-50"
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
        // Add backdrop blur for better visibility
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)'
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

export default BottomNavigation;
