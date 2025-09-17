import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/OptimizedAuthContext';

interface GuestOrUserRouteProps {
  children: React.ReactNode;
}

// Allows authenticated users OR guest users to view a route
// Use this for Home and Booking (steps 1-2). Block step 3 inside page logic.
// Admin users are redirected to admin dashboard
const GuestOrUserRoute: React.FC<GuestOrUserRouteProps> = ({ children }) => {
  const { user, isGuest, loading, isAdmin, profile } = useAuth();
  const location = useLocation();

  // Debug logging
  console.log('GuestOrUserRoute: Loading:', loading);
  console.log('GuestOrUserRoute: User:', user?.id);
  console.log('GuestOrUserRoute: Profile role:', profile?.role);
  console.log('GuestOrUserRoute: isAdmin:', isAdmin);
  console.log('GuestOrUserRoute: isGuest:', isGuest);
  console.log('GuestOrUserRoute: Location:', location.pathname);

  if (loading) return <></>;

  // If user is admin, redirect to admin dashboard
  if (isAdmin) {
    console.log('GuestOrUserRoute: Admin user detected, redirecting to /admin');
    return <Navigate to="/admin" replace />;
  }

  if (!user && !isGuest) {
    console.log('GuestOrUserRoute: No user and not guest, redirecting to auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log('GuestOrUserRoute: Allowing access to user route');
  return <>{children}</>;
};

export default GuestOrUserRoute;


