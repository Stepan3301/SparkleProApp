import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { BellIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface EnableNotificationsCardProps {
  variant?: 'banner' | 'card' | 'inline';
  showTestButton?: boolean;
  className?: string;
  onSuccess?: () => void;
  onDecline?: () => void;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'connecting' | 'unknown';

const EnableNotificationsCard: React.FC<EnableNotificationsCardProps> = ({
  variant = 'card',
  showTestButton = false,
  className = '',
  onSuccess,
  onDecline,
}) => {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    isIOSPWA,
    isSafariTab,
    platform,
    shouldShowPrompt,
    requestPermission,
    sendTestNotification,
    resetError,
  } = useNotifications();

  const [showDetails, setShowDetails] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');
  const [lastSuccessTime, setLastSuccessTime] = useState<Date | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Monitor notification status changes
  useEffect(() => {
    if (isSubscribed) {
      setConnectionStatus('connected');
    } else if (error) {
      setConnectionStatus('error');
    } else if (isLoading) {
      setConnectionStatus('connecting');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isSubscribed, error, isLoading]);

  // Get status display info
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <CheckCircleIcon className="w-5 h-5 text-emerald-600" />,
          text: 'Connected',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200'
        };
      case 'connecting':
        return {
          icon: <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />,
          text: 'Connecting...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'error':
        return {
          icon: <XCircleIcon className="w-5 h-5 text-red-600" />,
          text: 'Error',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'disconnected':
        return {
          icon: <BellIcon className="w-5 h-5 text-gray-600" />,
          text: 'Disconnected',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
      default:
        return {
          icon: <BellIcon className="w-5 h-5 text-gray-400" />,
          text: 'Unknown',
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const handleEnableNotifications = async () => {
    setConnectionStatus('connecting');
    const success = await requestPermission();
    
    if (success) {
      setConnectionStatus('connected');
      setLastSuccessTime(new Date());
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000); // Hide after 5 seconds
      if (onSuccess) {
        onSuccess();
      }
    } else {
      setConnectionStatus('error');
      if (onDecline) {
        onDecline();
      }
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    }
  };

  // Don't show anything if notifications are not supported
  if (!isSupported) {
    return null;
  }

  // For inline variant, show status
  if (variant === 'inline') {
    const statusInfo = getStatusInfo();
    return (
      <div className={`flex items-center gap-2 ${statusInfo.color} ${className}`}>
        {statusInfo.icon}
        <span className="text-sm font-medium">{statusInfo.text}</span>
        {lastSuccessTime && connectionStatus === 'connected' && (
          <span className="text-xs text-gray-500">
            ({lastSuccessTime.toLocaleTimeString()})
          </span>
        )}
      </div>
    );
  }

  // Don't show if we shouldn't prompt (except when already connected or has error)
  if (!shouldShowPrompt && !isSubscribed && !error) {
    return null;
  }

  // Show special message for Safari tab users
  if (isSafariTab) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Install the app for notifications
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              To receive push notifications, please add this app to your Home Screen. 
              Tap the share button in Safari and select "Add to Home Screen".
            </p>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
            {showDetails && (
              <div className="mt-3 p-3 bg-blue-100 rounded text-xs text-blue-800">
                <p className="mb-2">
                  <strong>Steps to install:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Tap the share button (square with arrow up) in Safari</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                  <li>Open the app from your Home Screen</li>
                  <li>Enable notifications when prompted</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show iOS PWA specific message
  if (isIOSPWA && platform === 'ios') {
    return (
      <div className={`bg-emerald-50 border border-emerald-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <CheckCircleIcon className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-emerald-900 mb-1">
              App installed successfully! 🎉
            </h3>
            <p className="text-sm text-emerald-700 mb-3">
              You're now running the app from your Home Screen. Enable notifications to stay updated about your cleaning services.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enabling...
                  </>
                ) : (
                  <>
                    <BellIcon className="w-4 h-4" />
                    Enable Notifications
                  </>
                  )}
              </button>
              <button
                type="button"
                onClick={handleDecline}
                className="px-4 py-2 text-sm text-emerald-700 hover:text-emerald-800 underline"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default notification prompt
  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <BellIcon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Stay updated with notifications
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Get real-time updates about your cleaning service status, reminders, and special offers.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enabling...
                  </>
                ) : (
                  <>
                    <BellIcon className="w-4 h-4" />
                    Enable Notifications
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDecline}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Card variant
  const statusInfo = getStatusInfo();
  
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${className}`}>
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">
              Notifications enabled successfully! You'll now receive updates about your orders.
            </span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 ${statusInfo.bgColor} rounded-full flex items-center justify-center`}>
            {connectionStatus === 'connecting' ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              statusInfo.icon
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              Push Notifications
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor} border`}>
              {statusInfo.text}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Stay updated about your cleaning service status, receive reminders, and get notified about special offers and promotions.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
              <button
                type="button"
                onClick={resetError}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {/* Main action button */}
            {!isSubscribed && (
              <button
                type="button"
                onClick={handleEnableNotifications}
                disabled={isLoading || connectionStatus === 'connecting'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading || connectionStatus === 'connecting' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enabling...
                  </>
                ) : (
                  <>
                    <BellIcon className="w-4 h-4" />
                    Enable Notifications
                  </>
                )}
              </button>
            )}

            {/* Retry button for errors */}
            {connectionStatus === 'error' && (
              <button
                type="button"
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BellIcon className="w-4 h-4" />
                Retry Connection
              </button>
            )}

            {/* Test button when connected */}
            {(showTestButton && connectionStatus === 'connected') && (
              <button
                type="button"
                onClick={handleTestNotification}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BellIcon className="w-4 h-4" />
                Send Test
              </button>
            )}

            {/* Maybe later button (only show when not connected) */}
            {!isSubscribed && connectionStatus !== 'connecting' && (
              <button
                type="button"
                onClick={handleDecline}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Maybe later
              </button>
            )}
          </div>

          {/* Platform-specific info */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Platform: {platform}</span>
              {isIOSPWA && <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">PWA</span>}
              {isSafariTab && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Safari Tab</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnableNotificationsCard; 