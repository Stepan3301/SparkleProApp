import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/auth?error=oauth_error');
          return;
        }

        if (data.session) {
          // User is authenticated, redirect to home
          navigate('/home');
        } else {
          // No session found, redirect to auth
          navigate('/auth');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        navigate('/auth?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [navigate]);

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