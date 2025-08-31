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
  isInitialized: boolean;
}

interface NotificationActions {
  initialize: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;
  resetError: () => void;
  refreshState: () => Promise<void>;
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
    isInitialized: false,
  });

  const manager = useRef(NotificationsManager.getInstance());
  const hasInitialized = useRef(false);
  const initializationPromise = useRef<Promise<void> | null>(null);

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

  // Refresh the current state
  const refreshState = useCallback(async (): Promise<void> => {
    if (!state.isInitialized) return;

    try {
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
        }));
      } else {
        setState(prev => ({
          ...prev,
          isSupported: false,
          isIOSPWA,
          isSafariTab,
          platform: platformInfo.platform,
        }));
      }
    } catch (error) {
      console.error('Failed to refresh notification state:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh state',
      }));
    }
  }, [state.isInitialized]);

  // Initialize notifications manager
  const initialize = useCallback(async (): Promise<void> => {
    if (hasInitialized.current) {
      return;
    }

    // Prevent multiple initialization attempts
    if (initializationPromise.current) {
      return initializationPromise.current;
    }

    if (!process.env.REACT_APP_ONESIGNAL_APP_ID) {
      setState(prev => ({
        ...prev,
        error: 'OneSignal App ID not configured',
        isLoading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    initializationPromise.current = (async () => {
      try {
        console.log('Initializing OneSignal...');
        
        await manager.current.initialize(process.env.REACT_APP_ONESIGNAL_APP_ID!);
        
        setState(prev => ({ ...prev, isInitialized: true }));
        hasInitialized.current = true;
        
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
            try {
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
            } catch (userError) {
              console.error('Failed to set user data:', userError);
              // Don't fail the entire initialization for user data errors
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
        hasInitialized.current = false;
        initializationPromise.current = null; // Reset so we can try again
      }
    })();

    return initializationPromise.current;
  }, [user]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isInitialized) {
      setState(prev => ({
        ...prev,
        error: 'Notifications not initialized. Please try again.',
      }));
      return false;
    }

    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Push notifications are not supported on this device',
      }));
      return false;
    }

    if (state.permission === 'granted' && state.isSubscribed) {
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
      console.log('Requesting notification permission...');
      
      const permission = await manager.current.requestPermission();
      
      console.log('Permission result:', permission);
      
      // Wait a bit for OneSignal to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh state to get updated subscription status
      await refreshState();
      
      if (permission === 'granted') {
        // Check if we're actually subscribed now
        const subscriptionState = await manager.current.getSubscriptionState();
        
        if (subscriptionState.isSubscribed && user?.id) {
          // Send subscription to backend
          try {
            await manager.current.sendSubscriptionToBackend(
              process.env.REACT_APP_BACKEND_BASE_URL || ''
            );
          } catch (backendError) {
            console.error('Failed to send subscription to backend:', backendError);
            // Don't fail the entire process for backend errors
          }
        }

        setState(prev => ({
          ...prev,
          permission: 'granted',
          isSubscribed: subscriptionState.isSubscribed,
          isLoading: false,
        }));

        return subscriptionState.isSubscribed;
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
  }, [state.isInitialized, state.isSupported, state.permission, state.isSubscribed, user, refreshState]);

  // Subscribe to notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isInitialized) {
      setState(prev => ({
        ...prev,
        error: 'Notifications not initialized. Please try again.',
      }));
      return false;
    }

    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Push notifications are not supported on this device',
      }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Starting subscription process...');
      
      const subscribed = await manager.current.subscribe();
      
      if (subscribed && user?.id) {
        // Send subscription to backend
        try {
          await manager.current.sendSubscriptionToBackend(
            process.env.REACT_APP_BACKEND_BASE_URL || ''
          );
        } catch (backendError) {
          console.error('Failed to send subscription to backend:', backendError);
          // Don't fail the entire process for backend errors
        }
      }

      // Refresh state to get updated status
      await refreshState();

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
  }, [state.isInitialized, state.isSupported, user, refreshState]);

  // Unsubscribe from notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isInitialized || !state.isSupported) {
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const unsubscribed = await manager.current.unsubscribe();
      
      // Refresh state
      await refreshState();
      
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
  }, [state.isInitialized, state.isSupported, refreshState]);

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
    if (user?.id && !hasInitialized.current) {
      initialize();
    }
  }, [user, initialize]);

  // Periodically refresh state to catch external changes
  useEffect(() => {
    if (!state.isInitialized) return;

    const interval = setInterval(() => {
      refreshState();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [state.isInitialized, refreshState]);

  // Check if we should show notification prompt
  const shouldShowPrompt = (): boolean => {
    // Don't show if not initialized
    if (!state.isInitialized) return false;
    
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
    
    // For iOS PWA, always allow prompting after user gesture
    if (state.isIOSPWA) return true;
    
    // For other platforms, check if permission is default
    return state.permission === 'default';
  };

  return {
    ...state,
    initialize,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    resetError,
    refreshState,
    shouldShowPrompt: shouldShowPrompt(),
  };
}; 