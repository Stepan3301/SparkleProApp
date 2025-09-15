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
  const { user, loading, isAdmin, profile, isGuest } = useAuth();

  // Debug logging
  console.log('AdminRouteGuard: Component rendered');
  console.log('AdminRouteGuard: Loading state:', loading);
  console.log('AdminRouteGuard: User exists:', !!user);
  console.log('AdminRouteGuard: User ID:', user?.id);
  console.log('AdminRouteGuard: Profile role:', profile?.role);
  console.log('AdminRouteGuard: isAdmin value:', isAdmin);

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
  if (!user && !isGuest) {
    return <Navigate to="/auth" replace />;
  }

  // If user is admin, redirect to admin dashboard
  if (isAdmin) {
    console.log('AdminRouteGuard: Admin user detected, redirecting to /admin');
    console.log('AdminRouteGuard: User ID:', user?.id);
    console.log('AdminRouteGuard: Profile role:', profile?.role);
    console.log('AdminRouteGuard: isAdmin value:', isAdmin);
    return <Navigate to="/admin" replace />;
  }

  // If user is not admin, allow access to user routes
  return <>{children}</>;
};

export default AdminRouteGuard;
