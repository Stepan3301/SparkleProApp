import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RoleBasedRoute from './components/RoleBasedRoute';
import AuthPage from './pages/auth/AuthPage';
import AuthCallback from './pages/auth/AuthCallback';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import BookingPage from './pages/BookingPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import PersonalInfoPage from './pages/profile/PersonalInfoPage';
import AddressesPage from './pages/profile/AddressesPage';
import NotificationsPage from './pages/profile/NotificationsPage';
import PaymentMethodsPage from './pages/profile/PaymentMethodsPage';
import PrivacySecurityPage from './pages/profile/PrivacySecurityPage';
import HelpSupportPage from './pages/profile/HelpSupportPage';
import { scrollToTop } from './utils/scrollToTop';
import './App.css';
import SEOProvider from './components/seo/SEOProvider';
import BusinessSchema from './components/seo/BusinessSchema';
import LoadingScreen from './components/ui/LoadingScreen';

// Component to handle scroll reset on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use the utility function for better compatibility
    scrollToTop();
  }, [pathname]);

  return null;
}

// Component to redirect based on user role
function RootRedirect() {
  const { user, loading, isAdmin } = useAuth();

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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect admin users to admin dashboard, regular users to home
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  } else {
    return <Navigate to="/home" replace />;
  }
}

// Wrapper component to handle global loading state
function AppContent() {
  const { loading } = useAuth();
  
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
  
  return (
    <Router>
      <ScrollToTop />
      <BusinessSchema />
      <Routes>
            {/* Public Routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/signup" element={<Navigate to="/auth" replace />} />
            <Route path="/signin" element={<Navigate to="/auth" replace />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            {/* Protected Routes with Role-Based Access */}
            <Route path="/home" element={
              <RoleBasedRoute>
                <HomePage />
              </RoleBasedRoute>
            } />
            <Route path="/admin" element={
              <RoleBasedRoute>
                <AdminDashboard />
              </RoleBasedRoute>
            } />
            <Route path="/booking" element={
              <RoleBasedRoute>
                <BookingPage />
              </RoleBasedRoute>
            } />
            <Route path="/history" element={
              <RoleBasedRoute>
                <HistoryPage />
              </RoleBasedRoute>
            } />
            <Route path="/profile" element={
              <RoleBasedRoute>
                <ProfilePage />
              </RoleBasedRoute>
            } />
            {/* Profile Sub-routes */}
            <Route path="/profile/personal-info" element={
              <RoleBasedRoute>
                <PersonalInfoPage />
              </RoleBasedRoute>
            } />
            <Route path="/profile/addresses" element={
              <RoleBasedRoute>
                <AddressesPage />
              </RoleBasedRoute>
            } />
            <Route path="/profile/notifications" element={
              <RoleBasedRoute>
                <NotificationsPage />
              </RoleBasedRoute>
            } />
            <Route path="/profile/payment-methods" element={
              <RoleBasedRoute>
                <PaymentMethodsPage />
              </RoleBasedRoute>
            } />
            <Route path="/profile/privacy-security" element={
              <RoleBasedRoute>
                <PrivacySecurityPage />
              </RoleBasedRoute>
            } />
            <Route path="/profile/help-support" element={
              <RoleBasedRoute>
                <HelpSupportPage />
              </RoleBasedRoute>
            } />
            {/* Root route - redirect to home if authenticated */}
            <Route path="/" element={<RootRedirect />} />
            {/* Catch-all route - redirect to auth */}
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </Router>
      );
    }

function App() {
  return (
    <SEOProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SEOProvider>
  );
}

export default App;
