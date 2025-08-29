import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './ui/LoadingScreen';

interface RoleBasedRouteProps {
  children: React.ReactNode;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <LoadingScreen 
        isLoading={true}
        minDuration={0} // No minimum duration for auth loading
        onLoadingComplete={() => {}}
      />
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show the requested page (admin routing is handled in root route)
  return <>{children}</>;
};

export default RoleBasedRoute; 