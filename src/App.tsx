import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RoleBasedRoute from './components/RoleBasedRoute';
import AuthPage from './pages/auth/AuthPage';
import AuthCallback from './pages/auth/AuthCallback';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import ServicesPage from './pages/ServicesPage';
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

// Component to handle scroll reset on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use the utility function for better compatibility
    scrollToTop();
  }, [pathname]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
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
          <Route path="/booking" element={
            <RoleBasedRoute>
              <BookingPage />
            </RoleBasedRoute>
          } />
          <Route path="/services" element={
            <RoleBasedRoute>
              <ServicesPage />
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
          <Route path="/" element={
            <RoleBasedRoute>
              <Navigate to="/home" replace />
            </RoleBasedRoute>
          } />
          
          {/* Catch-all route - redirect to auth */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
