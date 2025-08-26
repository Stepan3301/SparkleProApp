import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from '../pages/admin/AdminDashboard';
import LoadingScreen from './ui/LoadingScreen';

interface RoleBasedRouteProps {
  children: React.ReactNode;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children }) => {
  const { user, profile, loading, isAdmin } = useAuth();

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

  // If user is admin, show admin dashboard
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // If user is customer, show customer pages
  return <>{children}</>;
};

export default RoleBasedRoute; 