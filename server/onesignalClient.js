/**
 * OneSignal REST API Client
 * Handles sending notifications via OneSignal REST API v1
 */

class OneSignalClient {
  constructor(appId, restApiKey, baseUrl = 'https://api.onesignal.com') {
    this.appId = appId;
    this.restApiKey = restApiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Send notification to a specific external user ID
   */
  async sendToExternalUser(externalUserId, notification) {
    const payload = {
      app_id: this.appId,
      include_aliases: {
        external_id: [externalUserId]
      },
      headings: {
        en: notification.title || 'SparklePro Update'
      },
      contents: {
        en: notification.message || 'You have a new update'
      },
      url: notification.url || null,
      data: notification.data || {},
      // iOS PWA specific settings
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      // Android specific settings
      android_channel_id: 'default',
      // General settings
      priority: 10,
      delayed_option: 'timezone',
      delivery_time_of_day: '9:00AM',
      ttl: 259200, // 3 days
      // PWA specific
      chrome_web_icon: '/sparkleproapp-logo.jpeg',
      chrome_web_image: '/sparkleproapp-logo.jpeg',
      chrome_web_badge: '/sparkleproapp-logo.jpeg',
      chrome_web_action: {
        name: 'view',
        url: notification.url || '/'
      }
    };

    return this.sendNotification(payload);
  }

  /**
   * Send order status notification
   */
  async sendOrderStatusNotification(externalUserId, orderId, status, orderDetails = {}) {
    const statusMessages = {
      created: {
        title: 'Booking Confirmed! 🎉',
        message: 'Your cleaning service has been booked successfully. We\'ll send updates as we prepare your service.'
      },
      assigned: {
        title: 'Cleaner Assigned! 👷‍♀️',
        message: 'A professional cleaner has been assigned to your service. You\'ll receive updates on their arrival time.'
      },
      en_route: {
        title: 'Cleaner En Route! 🚗',
        message: 'Your cleaner is on the way to your location. They should arrive shortly.'
      },
      started: {
        title: 'Service Started! 🧹',
        message: 'Your cleaning service has begun. We\'ll notify you when it\'s completed.'
      },
      completed: {
        title: 'Service Completed! ✨',
        message: 'Your cleaning service has been completed successfully. Thank you for choosing SparklePro!'
      },
      canceled: {
        title: 'Service Cancelled',
        message: 'Your cleaning service has been cancelled. If you have any questions, please contact our support team.'
      }
    };

    const statusInfo = statusMessages[status] || {
      title: 'Service Update',
      message: `Your service status has been updated to: ${status}`
    };

    const notification = {
      title: statusInfo.title,
      message: statusInfo.message,
      url: `/history?order=${orderId}`,
      data: {
        type: 'order_status',
        orderId,
        status,
        ...orderDetails
      }
    };

    return this.sendToExternalUser(externalUserId, notification);
  }

  /**
   * Send test notification
   */
  async sendTestNotification(externalUserId) {
    const notification = {
      title: 'Test Notification',
      message: 'This is a test notification from SparklePro! 🧪',
      url: '/',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    };

    return this.sendToExternalUser(externalUserId, notification);
  }

  /**
   * Send reminder notification
   */
  async sendReminderNotification(externalUserId, reminderType, details = {}) {
    const reminderMessages = {
      upcoming: {
        title: 'Upcoming Service Reminder ⏰',
        message: `Don't forget! You have a cleaning service scheduled for ${details.date || 'tomorrow'}.`
      },
      maintenance: {
        title: 'Maintenance Reminder 🔧',
        message: 'It\'s time for your regular maintenance cleaning service. Book now to maintain your space!'
      },
      special_offer: {
        title: 'Special Offer! 🎁',
        message: details.message || 'You have a special cleaning offer waiting for you. Check it out now!'
      }
    };

    const reminderInfo = reminderMessages[reminderType] || {
      title: 'Reminder',
      message: 'You have a reminder from SparklePro'
    };

    const notification = {
      title: reminderInfo.title,
      message: reminderInfo.message,
      url: details.url || '/',
      data: {
        type: 'reminder',
        reminderType,
        ...details
      }
    };

    return this.sendToExternalUser(externalUserId, notification);
  }

  /**
   * Send the actual notification via OneSignal REST API
   */
  async sendNotification(payload) {
    try {
      const response = await fetch(`${this.baseUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.restApiKey}`,
          'User-Agent': 'SparklePro-NodeJS/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OneSignal API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      console.log('Notification sent successfully:', {
        id: result.id,
        recipients: result.recipients,
        external_id: payload.include_aliases?.external_id
      });

      return {
        success: true,
        notificationId: result.id,
        recipients: result.recipients || 0,
        message: 'Notification sent successfully'
      };
    } catch (error) {
      console.error('Failed to send notification:', error);
      
      return {
        success: false,
        error: error.message,
        message: 'Failed to send notification'
      };
    }
  }

  /**
   * Get notification delivery status
   */
  async getNotificationStatus(notificationId) {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/${notificationId}?app_id=${this.appId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.restApiKey}`,
          'User-Agent': 'SparklePro-NodeJS/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get notification status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get notification status:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId) {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/${notificationId}?app_id=${this.appId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${this.restApiKey}`,
          'User-Agent': 'SparklePro-NodeJS/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel notification: ${response.status}`);
      }

      return { success: true, message: 'Notification cancelled successfully' };
    } catch (error) {
      console.error('Failed to cancel notification:', error);
      throw error;
    }
  }
}

module.exports = OneSignalClient; 