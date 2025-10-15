import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/OptimizedAuthContext';
import RoleBasedRoute from './components/RoleBasedRoute';
import AdminRouteGuard from './components/AdminRouteGuard';
import GuestOrUserRoute from './components/GuestOrUserRoute';
import { scrollToTop } from './utils/scrollToTop';
import './App.css';
import './styles/mobile-optimizations.css';
import SEOProvider from './components/seo/SEOProvider';
import BusinessSchema from './components/seo/BusinessSchema';
import LoadingScreen from './components/ui/LoadingScreen';

// ✅ Lazy loading for all pages
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'));
const HomePage = lazy(() => import('./pages/HomePage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// Profile pages
const PersonalInfoPage = lazy(() => import('./pages/profile/PersonalInfoPage'));
const AddressesPage = lazy(() => import('./pages/profile/AddressesPage'));
const NotificationsPage = lazy(() => import('./pages/profile/NotificationsPage'));
const PaymentMethodsPage = lazy(() => import('./pages/profile/PaymentMethodsPage'));
const PrivacySecurityPage = lazy(() => import('./pages/profile/PrivacySecurityPage'));
const HelpSupportPage = lazy(() => import('./pages/profile/HelpSupportPage'));

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
  const { user, loading, isAdmin, profile } = useAuth();

  // Debug logging
  console.log('RootRedirect: Loading:', loading);
  console.log('RootRedirect: User:', user?.id);
  console.log('RootRedirect: Profile role:', profile?.role);
  console.log('RootRedirect: isAdmin:', isAdmin);

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
    console.log('RootRedirect: Redirecting admin to /admin');
    return <Navigate to="/admin" replace />;
  } else {
    console.log('RootRedirect: Redirecting user to /home');
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
      <Suspense fallback={
        <LoadingScreen 
          isLoading={true} 
          minDuration={0} 
          smartLoading={true} 
        />
      }>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/signup" element={<Navigate to="/auth" replace />} />
          <Route path="/signin" element={<Navigate to="/auth" replace />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          {/* Protected Routes with Role-Based Access */}
          <Route path="/home" element={
            <GuestOrUserRoute>
              <HomePage />
            </GuestOrUserRoute>
          } />
          <Route path="/admin" element={
            <RoleBasedRoute>
              <AdminDashboard />
            </RoleBasedRoute>
          } />
          <Route path="/booking" element={
            <GuestOrUserRoute>
              <BookingPage />
            </GuestOrUserRoute>
          } />
          <Route path="/history" element={
            <AdminRouteGuard>
              <HistoryPage />
            </AdminRouteGuard>
          } />
          <Route path="/profile" element={
            <AdminRouteGuard>
              <ProfilePage />
            </AdminRouteGuard>
          } />
          {/* Profile Sub-routes */}
          <Route path="/profile/personal-info" element={
            <AdminRouteGuard>
              <PersonalInfoPage />
            </AdminRouteGuard>
          } />
          <Route path="/profile/addresses" element={
            <AdminRouteGuard>
              <AddressesPage />
            </AdminRouteGuard>
          } />
          <Route path="/profile/notifications" element={
            <AdminRouteGuard>
              <NotificationsPage />
            </AdminRouteGuard>
          } />
          <Route path="/profile/payment-methods" element={
            <AdminRouteGuard>
              <PaymentMethodsPage />
            </AdminRouteGuard>
          } />
          <Route path="/profile/privacy-security" element={
            <AdminRouteGuard>
              <PrivacySecurityPage />
            </AdminRouteGuard>
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
      </Suspense>
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
