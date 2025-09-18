import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/OptimizedAuthContext';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback - Current URL:', window.location.href); // Debug log
        console.log('Auth callback - Hash:', window.location.hash); // Debug log
        
        // Wait a bit for auth state to be processed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (user) {
          console.log('Auth callback - User found, checking role...'); // Debug log
          
          // Redirect based on user role
          if (isAdmin) {
            console.log('Auth callback - Admin user, redirecting to admin dashboard');
            navigate('/admin');
          } else {
            console.log('Auth callback - Customer user, redirecting to home');
            navigate('/home');
          }
        } else {
          console.log('Auth callback - No user found, redirecting to auth'); // Debug log
          // No user found, redirect to auth
          navigate('/auth');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        navigate('/auth?error=unexpected_error');
      }
    };

    // Small delay to ensure URL hash is processed
    const timeoutId = setTimeout(handleAuthCallback, 100);
    
    return () => clearTimeout(timeoutId);
  }, [navigate, user, isAdmin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Completing Sign In</h2>
          <p className="text-gray-600">Please wait while we finish setting up your account...</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback; 