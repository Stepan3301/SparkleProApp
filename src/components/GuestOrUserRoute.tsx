import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface GuestOrUserRouteProps {
  children: React.ReactNode;
}

// Allows authenticated users OR guest users to view a route
// Use this for Home and Booking (steps 1-2). Block step 3 inside page logic.
const GuestOrUserRoute: React.FC<GuestOrUserRouteProps> = ({ children }) => {
  const { user, isGuest, loading } = useAuth();
  const location = useLocation();

  if (loading) return <></>;

  if (!user && !isGuest) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default GuestOrUserRoute;


