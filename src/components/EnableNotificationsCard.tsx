import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { BellIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface EnableNotificationsCardProps {
  variant?: 'banner' | 'card' | 'inline';
  showTestButton?: boolean;
  className?: string;
  onSuccess?: () => void;
  onDecline?: () => void;
}

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

  const handleEnableNotifications = async () => {
    const success = await requestPermission();
    if (success && onSuccess) {
      onSuccess();
    } else if (!success && onDecline) {
      onDecline();
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

  // Don't show if user is already subscribed
  if (isSubscribed) {
    if (variant === 'inline') {
      return (
        <div className={`flex items-center gap-2 text-emerald-600 ${className}`}>
          <CheckCircleIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Notifications enabled</span>
        </div>
      );
    }
    return null;
  }

  // Don't show if we shouldn't prompt
  if (!shouldShowPrompt) {
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
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <BellIcon className="w-6 h-6 text-primary" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Enable Push Notifications
          </h3>
          
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

            {showTestButton && isSubscribed && (
              <button
                type="button"
                onClick={handleTestNotification}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BellIcon className="w-4 h-4" />
                Send Test
              </button>
            )}

            <button
              type="button"
              onClick={handleDecline}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Maybe later
            </button>
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