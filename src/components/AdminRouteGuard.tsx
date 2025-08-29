import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './ui/LoadingScreen';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Component that prevents admin users from accessing user routes
 * If an admin user tries to access /home, /booking, /history, etc., 
 * they will be automatically redirected to /admin
 */
const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  // Show loading screen while authentication is being determined
  if (loading) {
    return (
      <LoadingScreen 
        isLoading={true}
        minDuration={0}
        smartLoading={true}
        onLoadingComplete={() => {}}
      />
    );
  }

  // If not authenticated, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user is admin, redirect to admin dashboard
  if (isAdmin) {
    console.log('AdminRouteGuard: Admin user detected, redirecting to /admin');
    return <Navigate to="/admin" replace />;
  }

  // If user is not admin, allow access to user routes
  return <>{children}</>;
};

export default AdminRouteGuard;
