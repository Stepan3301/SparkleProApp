import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NotificationsManager from '../notifications/NotificationsManager';

interface NotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
  error: string | null;
  isIOSPWA: boolean;
  isSafariTab: boolean;
  platform: string;
}

interface NotificationActions {
  initialize: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;
  resetError: () => void;
  shouldShowPrompt: boolean;
}

export const useNotifications = (): NotificationState & NotificationActions => {
  const { user } = useAuth();
  const [state, setState] = useState<NotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    isLoading: false,
    error: null,
    isIOSPWA: false,
    isSafariTab: false,
    platform: 'unknown',
  });

  const manager = useRef(NotificationsManager.getInstance());
  const hasShownPrompt = useRef(false);

  // Check if user has declined notifications recently
  const hasDeclinedRecently = (): boolean => {
    const declinedAt = localStorage.getItem('notifications_declined_at');
    if (!declinedAt) return false;
    
    const declinedDate = new Date(declinedAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return declinedDate > sevenDaysAgo;
  };

  // Mark notifications as declined
  const markAsDeclined = (): void => {
    localStorage.setItem('notifications_declined_at', new Date().toISOString());
  };

  // Initialize notifications manager
  const initialize = useCallback(async (): Promise<void> => {
    if (!process.env.REACT_APP_ONESIGNAL_APP_ID) {
      setState(prev => ({
        ...prev,
        error: 'OneSignal App ID not configured',
        isLoading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await manager.current.initialize(process.env.REACT_APP_ONESIGNAL_APP_ID);
      
      // Get platform info
      const platformInfo = manager.current.getPlatformInfo();
      const isIOSPWA = manager.current.isIOSPWA();
      const isSafariTab = manager.current.isSafariTab();
      
      // Check if push notifications are supported
      const isSupported = manager.current.isPushSupported();
      
      if (isSupported) {
        // Get current subscription state
        const subscriptionState = await manager.current.getSubscriptionState();
        
        setState(prev => ({
          ...prev,
          isSupported: true,
          isSubscribed: subscriptionState.isSubscribed,
          permission: subscriptionState.permission,
          isIOSPWA,
          isSafariTab,
          platform: platformInfo.platform,
          isLoading: false,
        }));

        // If user is logged in, set external user ID and tags
        if (user?.id) {
          await manager.current.setExternalUserId(user.id);
          
          // Set user tags for segmentation
          await manager.current.setTags({
            locale: user.user_metadata?.locale || 'en',
            platform: platformInfo.platform,
            app_version: process.env.REACT_APP_VERSION || '1.0.0',
            user_type: 'customer', // You can make this dynamic based on user role
          });

          // Send subscription to backend if subscribed
          if (subscriptionState.isSubscribed) {
            await manager.current.sendSubscriptionToBackend(
              process.env.REACT_APP_BACKEND_BASE_URL || ''
            );
          }
        }
      } else {
        setState(prev => ({
          ...prev,
          isSupported: false,
          isIOSPWA,
          isSafariTab,
          platform: platformInfo.platform,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize notifications',
        isLoading: false,
      }));
    }
  }, [user]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Push notifications are not supported on this device',
      }));
      return false;
    }

    if (state.permission === 'granted') {
      return true;
    }

    if (state.permission === 'denied') {
      setState(prev => ({
        ...prev,
        error: 'Notifications are blocked. Please enable them in your browser settings.',
      }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const permission = await manager.current.requestPermission();
      
      if (permission === 'granted') {
        // Subscribe to notifications
        const subscribed = await manager.current.subscribe();
        
        if (subscribed && user?.id) {
          // Send subscription to backend
          await manager.current.sendSubscriptionToBackend(
            process.env.REACT_APP_BACKEND_BASE_URL || ''
          );
        }

        setState(prev => ({
          ...prev,
          permission: 'granted',
          isSubscribed: subscribed,
          isLoading: false,
        }));

        return true;
      } else {
        // User declined
        markAsDeclined();
        setState(prev => ({
          ...prev,
          permission,
          isLoading: false,
        }));
        return false;
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to request permission',
        isLoading: false,
      }));
      return false;
    }
  }, [state.isSupported, state.permission, user]);

  // Subscribe to notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Push notifications are not supported on this device',
      }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const subscribed = await manager.current.subscribe();
      
      if (subscribed && user?.id) {
        // Send subscription to backend
        await manager.current.sendSubscriptionToBackend(
          process.env.REACT_APP_BACKEND_BASE_URL || ''
        );
      }

      setState(prev => ({
        ...prev,
        isSubscribed: subscribed,
        isLoading: false,
      }));

      return subscribed;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to subscribe',
        isLoading: false,
      }));
      return false;
    }
  }, [state.isSupported, user]);

  // Unsubscribe from notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const unsubscribed = await manager.current.unsubscribe();
      
      setState(prev => ({
        ...prev,
        isSubscribed: !unsubscribed,
        isLoading: false,
      }));

      return unsubscribed;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to unsubscribe',
        isLoading: false,
      }));
      return false;
    }
  }, [state.isSupported]);

  // Send test notification
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (!state.isSubscribed) {
      setState(prev => ({
        ...prev,
        error: 'You must be subscribed to notifications to send test notifications',
      }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const sent = await manager.current.sendTestNotification(
        process.env.REACT_APP_BACKEND_BASE_URL || ''
      );

      setState(prev => ({ ...prev, isLoading: false }));

      if (sent) {
        // Show success message
        console.log('Test notification sent successfully');
      }

      return sent;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send test notification',
        isLoading: false,
      }));
      return false;
    }
  }, [state.isSubscribed]);

  // Reset error
  const resetError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize on mount if user is available
  useEffect(() => {
    if (user?.id && !hasShownPrompt.current) {
      initialize();
      hasShownPrompt.current = true;
    }
  }, [user, initialize]);

  // Check if we should show notification prompt
  const shouldShowPrompt = (): boolean => {
    // Don't show if already subscribed
    if (state.isSubscribed) return false;
    
    // Don't show if user declined recently
    if (hasDeclinedRecently()) return false;
    
    // Don't show if not supported
    if (!state.isSupported) return false;
    
    // Don't show if permission is denied
    if (state.permission === 'denied') return false;
    
    // Don't show if running in Safari tab (not PWA)
    if (state.isSafariTab) return false;
    
    return true;
  };

  return {
    ...state,
    initialize,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    resetError,
    shouldShowPrompt: shouldShowPrompt(),
  };
}; 