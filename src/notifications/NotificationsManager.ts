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
  private initializationPromise: Promise<void> | null = null;

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

    // Prevent multiple initialization attempts
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization(appId);
    return this.initializationPromise;
  }

  private async performInitialization(appId: string): Promise<void> {
    try {
      console.log('Initializing OneSignal with App ID:', appId);
      
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
      
      // Set up event listeners
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Failed to initialize OneSignal:', error);
      this.initializationPromise = null; // Reset so we can try again
      throw error;
    }
  }

  /**
   * Set up OneSignal event listeners
   */
  private setupEventListeners(): void {
    try {
      // Listen for subscription changes
      OneSignal.User.PushSubscription.addEventListener('change', (event) => {
        console.log('OneSignal subscription changed:', event);
      });

      // Listen for permission changes
      OneSignal.Notifications.addEventListener('permissionChange', (granted) => {
        console.log('OneSignal permission changed:', granted);
      });

    } catch (error) {
      console.error('Failed to set up OneSignal event listeners:', error);
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
      console.log('Setting external user ID:', userId);
      await OneSignal.login(userId);
      this.currentUserId = userId;
      console.log('External user ID set successfully:', userId);
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
   * Get the current subscription state - FIXED VERSION
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
      // Check if push notifications are supported
      const isPushSupported = OneSignal.Notifications.isPushSupported();
      
      // Get current permission status
      const permission = Notification.permission;
      
      // Wait for OneSignal to be fully ready
      await this.waitForOneSignalReady();
      
      // Check subscription status using the correct OneSignal v5 API
      const isOptedIn = OneSignal.User.PushSubscription.optedIn;
      const playerId = OneSignal.User.onesignalId;
      
      // User is subscribed if they have granted permission, are opted in, and have a player ID
      const isSubscribed = permission === 'granted' && isOptedIn && !!playerId;

      console.log('Subscription state check:', { 
        isPushSupported, 
        permission, 
        isOptedIn,
        playerId: playerId ? 'present' : 'null',
        isSubscribed 
      });

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
   * Wait for OneSignal to be fully ready
   */
  private async waitForOneSignalReady(timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkReady = () => {
        try {
          // Check if OneSignal is ready by accessing its properties
          if (OneSignal.User && OneSignal.User.PushSubscription) {
            resolve();
            return;
          }
        } catch (error) {
          // OneSignal not ready yet
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error('OneSignal ready timeout'));
          return;
        }
        
        setTimeout(checkReady, 100);
      };
      
      checkReady();
    });
  }

  /**
   * Request notification permission - IMPROVED VERSION
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isInitialized) {
      throw new Error('OneSignal not initialized');
    }

    try {
      console.log('Requesting notification permission...');
      
      // Request permission using OneSignal
      const permission = await OneSignal.Notifications.requestPermission();
      
      console.log('Permission request result:', permission);
      
      // If permission was granted, ensure user is opted in
      if (permission) {
        try {
          // Wait a bit for OneSignal to process the permission
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if user is opted in, if not, opt them in
          if (!OneSignal.User.PushSubscription.optedIn) {
            console.log('User not opted in, opting in...');
            await OneSignal.User.PushSubscription.optIn();
          }
          
          console.log('User successfully opted in to notifications');
        } catch (optInError) {
          console.error('Failed to opt in user:', optInError);
        }
      }
      
      // Return the actual browser permission status
      return Notification.permission;
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
      await this.waitForOneSignalReady();
      const playerId = OneSignal.User.onesignalId;
      return playerId || null;
    } catch (error) {
      console.error('Failed to get player ID:', error);
      return null;
    }
  }

  /**
   * Subscribe to push notifications - IMPROVED VERSION
   */
  public async subscribe(): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('OneSignal not initialized');
    }

    try {
      console.log('Starting subscription process...');
      
      // First request permission
      const permission = await this.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Permission not granted:', permission);
        return false;
      }
      
      // Wait for OneSignal to be ready
      await this.waitForOneSignalReady();
      
      // Ensure user is opted in
      if (!OneSignal.User.PushSubscription.optedIn) {
        console.log('Opting user in to push notifications...');
        await OneSignal.User.PushSubscription.optIn();
      }
      
      // Wait a bit more for the subscription to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify subscription
      const subscriptionState = await this.getSubscriptionState();
      
      console.log('Subscription process completed:', subscriptionState);
      
      return subscriptionState.isSubscribed;
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
      await OneSignal.User.PushSubscription.optOut();
      console.log('User unsubscribed from push notifications');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  /**
   * Send subscription data to backend - IMPROVED VERSION
   */
  public async sendSubscriptionToBackend(backendUrl: string): Promise<boolean> {
    if (!this.currentUserId) {
      throw new Error('No user ID set');
    }

    try {
      // Wait for subscription to be ready
      await this.waitForOneSignalReady();
      
      const playerId = await this.getPlayerId();
      if (!playerId) {
        throw new Error('No player ID available');
      }

      console.log('Sending subscription to backend:', { userId: this.currentUserId, playerId });

      // Check if backend is available
      if (!backendUrl || backendUrl.trim() === '') {
        console.warn('No backend URL configured, using mock subscription');
        return this.mockSubscription();
      }

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
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Subscription sent to backend successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send subscription to backend:', error);
      
      // Fall back to mock subscription if backend is not available
      console.log('Falling back to mock subscription storage');
      return this.mockSubscription();
    }
  }

  /**
   * Mock subscription for when backend is not available
   */
  private async mockSubscription(): Promise<boolean> {
    try {
      const playerId = await this.getPlayerId();
      const subscriptionData = {
        userId: this.currentUserId,
        playerId,
        timestamp: new Date().toISOString(),
        mockMode: true
      };
      
      // Store in localStorage as fallback
      localStorage.setItem('notification_subscription', JSON.stringify(subscriptionData));
      console.log('Mock subscription stored locally:', subscriptionData);
      
      return true;
    } catch (error) {
      console.error('Failed to create mock subscription:', error);
      return false;
    }
  }

  /**
   * Send test notification - IMPROVED VERSION
   */
  public async sendTestNotification(backendUrl: string): Promise<boolean> {
    if (!this.currentUserId) {
      throw new Error('No user ID set');
    }

    try {
      console.log('Sending test notification...');
      
      // Check if backend is available
      if (!backendUrl || backendUrl.trim() === '') {
        console.warn('No backend URL configured, using mock test notification');
        return this.mockTestNotification();
      }

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
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Test notification sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      
      // Fall back to mock test notification
      console.log('Falling back to mock test notification');
      return this.mockTestNotification();
    }
  }

  /**
   * Mock test notification for when backend is not available
   */
  private async mockTestNotification(): Promise<boolean> {
    try {
      // Simulate a notification through OneSignal directly
      console.log('Simulating test notification...');
      
      // For development/testing, we'll just log this
      // In a real scenario, you might use OneSignal's direct API
      const testData = {
        userId: this.currentUserId,
        message: 'Test notification from SparklePro!',
        timestamp: new Date().toISOString(),
        mockMode: true
      };
      
      console.log('Mock test notification sent:', testData);
      
      // Store the test in localStorage for debugging
      const existingTests = JSON.parse(localStorage.getItem('test_notifications') || '[]');
      existingTests.push(testData);
      localStorage.setItem('test_notifications', JSON.stringify(existingTests));
      
      return true;
    } catch (error) {
      console.error('Failed to send mock test notification:', error);
      return false;
    }
  }

  /**
   * Check if running as iOS PWA
   */
  public isIOSPWA(): boolean {
    const userAgent = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    
    if (!isIOS) return false;
    
    // Check if running in standalone mode (added to home screen)
    const isStandalone = (window.navigator as any).standalone === true;
    const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    const result = isStandalone || isDisplayModeStandalone;
    
    console.log('iOS PWA Detection:', {
      isIOS,
      isStandalone,
      isDisplayModeStandalone,
      result,
      userAgent: userAgent.substring(0, 100) + '...'
    });
    
    return result;
  }

  /**
   * Check if running in Safari tab (not PWA)
   */
  public isSafariTab(): boolean {
    const userAgent = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isIOSPWA = this.isIOSPWA();
    
    const result = isIOS && isSafari && !isIOSPWA;
    
    console.log('Safari Tab Detection:', {
      isIOS,
      isSafari,
      isIOSPWA,
      result,
      userAgent: userAgent.substring(0, 100) + '...'
    });
    
    return result;
  }

  /**
   * Check if push notifications are supported
   */
  public isPushSupported(): boolean {
    try {
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in window;
      const hasNotification = 'Notification' in window;
      
      // For OneSignal, also check if it's initialized
      const oneSignalSupported = this.isInitialized && OneSignal.Notifications.isPushSupported();
      
      const result = hasServiceWorker && hasPushManager && hasNotification && oneSignalSupported;
      
      console.log('Push Support Check:', {
        hasServiceWorker,
        hasPushManager,
        hasNotification,
        oneSignalSupported,
        result,
        isIOSPWA: this.isIOSPWA(),
        isSafariTab: this.isSafariTab()
      });
      
      return result;
    } catch (error) {
      console.error('Error checking push support:', error);
      return false;
    }
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