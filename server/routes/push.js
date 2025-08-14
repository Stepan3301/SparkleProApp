const express = require('express');
const OneSignalClient = require('../onesignalClient');
const router = express.Router();

// Initialize OneSignal client
const oneSignalClient = new OneSignalClient(
  process.env.ONESIGNAL_APP_ID,
  process.env.ONESIGNAL_REST_API_KEY
);

/**
 * POST /api/push/subscribe
 * Subscribe a user to push notifications
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { externalUserId, onesignalSubscription } = req.body;

    if (!externalUserId || !onesignalSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: externalUserId and onesignalSubscription'
      });
    }

    // Here you would typically save the subscription to your database
    // For example, using your existing database connection:
    
    /*
    const { data, error } = await supabase
      .from('user_push_subscriptions')
      .upsert({
        user_id: externalUserId,
        external_user_id: externalUserId,
        player_id: onesignalSubscription.playerId,
        devices: onesignalSubscription.devices || [],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save subscription to database'
      });
    }
    */

    // For now, we'll just log the subscription
    console.log('User subscribed to push notifications:', {
      userId: externalUserId,
      playerId: onesignalSubscription.playerId,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Subscription saved successfully',
      data: {
        userId: externalUserId,
        playerId: onesignalSubscription.playerId,
        subscribedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in /subscribe:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/push/test
 * Send a test notification to the current user
 */
router.post('/test', async (req, res) => {
  try {
    const { externalUserId } = req.body;

    if (!externalUserId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: externalUserId'
      });
    }

    // Send test notification
    const result = await oneSignalClient.sendTestNotification(externalUserId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test notification sent successfully',
        data: {
          notificationId: result.notificationId,
          recipients: result.recipients,
          sentAt: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in /test:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/push/order-status
 * Send order status notification
 */
router.post('/order-status', async (req, res) => {
  try {
    const { externalUserId, orderId, status, orderDetails } = req.body;

    if (!externalUserId || !orderId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: externalUserId, orderId, and status'
      });
    }

    // Validate status
    const validStatuses = ['created', 'assigned', 'en_route', 'started', 'completed', 'canceled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Send order status notification
    const result = await oneSignalClient.sendOrderStatusNotification(
      externalUserId,
      orderId,
      status,
      orderDetails || {}
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Order status notification sent successfully',
        data: {
          notificationId: result.notificationId,
          recipients: result.recipients,
          orderId,
          status,
          sentAt: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send order status notification',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in /order-status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/push/reminder
 * Send reminder notification
 */
router.post('/reminder', async (req, res) => {
  try {
    const { externalUserId, reminderType, details } = req.body;

    if (!externalUserId || !reminderType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: externalUserId and reminderType'
      });
    }

    // Validate reminder type
    const validReminderTypes = ['upcoming', 'maintenance', 'special_offer'];
    if (!validReminderTypes.includes(reminderType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid reminder type. Must be one of: ${validReminderTypes.join(', ')}`
      });
    }

    // Send reminder notification
    const result = await oneSignalClient.sendReminderNotification(
      externalUserId,
      reminderType,
      details || {}
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Reminder notification sent successfully',
        data: {
          notificationId: result.notificationId,
          recipients: result.recipients,
          reminderType,
          sentAt: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send reminder notification',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in /reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/push/status/:notificationId
 * Get notification delivery status
 */
router.get('/status/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Missing notification ID'
      });
    }

    // Get notification status from OneSignal
    const status = await oneSignalClient.getNotificationStatus(notificationId);

    res.json({
      success: true,
      message: 'Notification status retrieved successfully',
      data: status
    });
  } catch (error) {
    console.error('Error in /status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * DELETE /api/push/cancel/:notificationId
 * Cancel a scheduled notification
 */
router.delete('/cancel/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Missing notification ID'
      });
    }

    // Cancel notification
    const result = await oneSignalClient.cancelNotification(notificationId);

    res.json({
      success: true,
      message: 'Notification cancelled successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in /cancel:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/push/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Push notification service is healthy',
    timestamp: new Date().toISOString(),
    config: {
      appId: process.env.ONESIGNAL_APP_ID ? 'Configured' : 'Not configured',
      restApiKey: process.env.ONESIGNAL_REST_API_KEY ? 'Configured' : 'Not configured'
    }
  });
});

module.exports = router; 