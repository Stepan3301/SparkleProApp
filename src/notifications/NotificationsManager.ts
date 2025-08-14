import OneSignal from 'react-onesignal';

export interface NotificationSubscription {
  externalUserId: string;
  playerId: string;
  devices: any[];
  updatedAt: string;
}

export interface NotificationPayload {
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
}

class NotificationsManager {
  private static instance: NotificationsManager;
  private isInitialized = false;
  private currentUserId: string | null = null;

  private constructor() {}

  public static getInstance(): NotificationsManager {
    if (!NotificationsManager.instance) {
      NotificationsManager.instance = new NotificationsManager();
    }
    return NotificationsManager.instance;
  }

  /**
   * Initialize OneSignal with the app ID
   */
  public async initialize(appId: string): Promise<void> {
    if (this.isInitialized) {
      console.log('OneSignal already initialized');
      return;
    }

    try {
      await OneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false,
          prenotify: false,
          showCredit: false,
          text: {
            "message.prenotify": "We'll notify you when you're ready to receive notifications",
            "message.action.subscribed": "Thanks for subscribing!",
            "message.action.resubscribed": "You're now subscribed to notifications",
            "message.action.unsubscribed": "You won't receive notifications anymore",
            "message.action.subscribing": "Subscribing you to notifications...",
            "dialog.main.title": "Manage your notification preferences",
            "dialog.main.button.subscribe": "Subscribe",
            "dialog.main.button.unsubscribe": "Unsubscribe",
            "dialog.blocked.title": "Unblock Notifications",
            "dialog.blocked.message": "Follow these instructions to allow notifications:",
            "tip.state.blocked": "You have blocked notifications",
            "tip.state.subscribed": "You are subscribed to notifications",
            "tip.state.unsubscribed": "You are not subscribed to notifications"
          }
        },
        serviceWorkerParam: {
          scope: '/',
        },
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.js',
      });

      this.isInitialized = true;
      console.log('OneSignal initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OneSignal:', error);
      throw error;
    }
  }

  /**
   * Set the current user ID for OneSignal
   */
  public async setExternalUserId(userId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('OneSignal not initialized');
    }

    try {
      await OneSignal.login(userId);
      this.currentUserId = userId;
      console.log('External user ID set:', userId);
    } catch (error) {
      console.error('Failed to set external user ID:', error);
      throw error;
    }
  }

  /**
   * Set user tags for segmentation
   */
  public async setTags(tags: Record<string, string>): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('OneSignal not initialized');
    }

    try {
      await OneSignal.User.addTags(tags);
      console.log('Tags set:', tags);
    } catch (error) {
      console.error('Failed to set tags:', error);
      throw error;
    }
  }

  /**
   * Get the current subscription state
   */
  public async getSubscriptionState(): Promise<{
    isSubscribed: boolean;
    isPushSupported: boolean;
    permission: NotificationPermission;
  }> {
    if (!this.isInitialized) {
      return {
        isSubscribed: false,
        isPushSupported: false,
        permission: 'default',
      };
    }

    try {
      const isSubscribed = await OneSignal.Notifications.isPushSupported();
      const isPushSupported = OneSignal.Notifications.isPushSupported();
      // Get permission from browser API since OneSignal might not expose it directly
      const permission = Notification.permission;

      return {
        isSubscribed,
        isPushSupported,
        permission,
      };
    } catch (error) {
      console.error('Failed to get subscription state:', error);
      return {
        isSubscribed: false,
        isPushSupported: false,
        permission: 'default',
      };
    }
  }

  /**
   * Request notification permission
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isInitialized) {
      throw new Error('OneSignal not initialized');
    }

    try {
      await OneSignal.Notifications.requestPermission();
      // Get the current permission status after requesting
      const permission = Notification.permission;
      console.log('Permission requested, result:', permission);
      return permission;
    } catch (error) {
      console.error('Failed to request permission:', error);
      throw error;
    }
  }

  /**
   * Get the player ID (subscription ID)
   */
  public async getPlayerId(): Promise<string | null> {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const playerId = OneSignal.User.onesignalId;
      return playerId || null;
    } catch (error) {
      console.error('Failed to get player ID:', error);
      return null;
    }
  }

  /**
   * Subscribe to push notifications
   */
  public async subscribe(): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('OneSignal not initialized');
    }

    try {
      // Enable notifications by setting the default notification permission
      await OneSignal.Notifications.requestPermission();
      console.log('Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribe(): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('OneSignal not initialized');
    }

    try {
      // For OneSignal v2, we can't directly disable notifications
      // The user would need to do this through browser settings
      console.log('Unsubscribe requested - user should disable in browser settings');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  /**
   * Send subscription data to backend
   */
  public async sendSubscriptionToBackend(backendUrl: string): Promise<boolean> {
    if (!this.currentUserId) {
      throw new Error('No user ID set');
    }

    const playerId = await this.getPlayerId();
    if (!playerId) {
      throw new Error('No player ID available');
    }

    try {
      const response = await fetch(`${backendUrl}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          externalUserId: this.currentUserId,
          onesignalSubscription: {
            playerId,
            devices: [], // OneSignal handles device management
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('Subscription sent to backend successfully');
      return true;
    } catch (error) {
      console.error('Failed to send subscription to backend:', error);
      return false;
    }
  }

  /**
   * Send test notification
   */
  public async sendTestNotification(backendUrl: string): Promise<boolean> {
    if (!this.currentUserId) {
      throw new Error('No user ID set');
    }

    try {
      const response = await fetch(`${backendUrl}/api/push/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          externalUserId: this.currentUserId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('Test notification sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }

  /**
   * Check if running as iOS PWA
   */
  public isIOSPWA(): boolean {
    return (
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    );
  }

  /**
   * Check if running in Safari tab (not PWA)
   */
  public isSafariTab(): boolean {
    const userAgent = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    return isIOS && isSafari && !this.isIOSPWA();
  }

  /**
   * Check if push notifications are supported
   */
  public isPushSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Get device platform info
   */
  public getPlatformInfo(): { platform: string; isPWA: boolean } {
    const userAgent = window.navigator.userAgent;
    let platform = 'unknown';
    let isPWA = false;

    if (/Android/.test(userAgent)) {
      platform = 'android';
    } else if (/iPad|iPhone|iPod/.test(userAgent)) {
      platform = 'ios';
    } else if (/Windows/.test(userAgent)) {
      platform = 'windows';
    } else if (/Mac/.test(userAgent)) {
      platform = 'mac';
    } else if (/Linux/.test(userAgent)) {
      platform = 'linux';
    }

    isPWA = this.isIOSPWA() || window.matchMedia('(display-mode: standalone)').matches;

    return { platform, isPWA };
  }
}

export default NotificationsManager; 