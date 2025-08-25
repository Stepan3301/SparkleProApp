# Order Notification System Setup Guide

This guide explains how to set up the complete order notification workflow for SparklePro, where both admins and customers receive push notifications about order status changes.

## 🎯 Overview

The notification system provides:
- **Admin Notifications**: When new orders are created
- **Customer Notifications**: When order status changes
- **Real-time Updates**: Via OneSignal push notifications
- **Comprehensive Logging**: Track all notification delivery and read status

## 🏗️ System Architecture

```
Order Created → Admin Notification → Status Changed → Customer Notification
     ↓              ↓                    ↓              ↓
BookingPage → Backend API → OneSignal → Admin Dashboard → Customer Device
```

## 📋 Prerequisites

1. **OneSignal Setup**: Complete the OneSignal configuration from `ONESIGNAL_SETUP_README.md`
2. **Database Access**: Supabase project with admin access
3. **Backend Server**: Node.js server running with the notification endpoints
4. **PWA Installation**: Both admin and customer devices must have the PWA installed

## 🗄️ Database Setup

### Step 1: Run the Notification System SQL Script

```sql
-- Execute this in your Supabase SQL editor
\i notification_system_setup.sql
```

This script will:
- Add notification preferences to profiles table
- Add notification tracking to bookings table
- Create notification_logs table
- Set up RLS policies
- Create helper functions
- Add triggers for automatic timestamp updates

### Step 2: Verify Admin User Role

Ensure your admin user has the correct role:

```sql
-- Check current admin users
SELECT id, full_name, role FROM public.profiles WHERE role = 'admin';

-- If no admin users exist, create one (replace with actual user ID)
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'your-admin-user-id';
```

## 🔧 Backend Setup

### Step 1: Environment Variables

Ensure these are set in your backend server:

```env
ONESIGNAL_APP_ID=your-onesignal-app-id
ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key
```

### Step 2: Server Endpoints

The system provides these endpoints:

- `POST /api/push/new-order` - Notify admins of new orders
- `POST /api/push/order-status-change` - Notify customers of status changes
- `GET /api/push/admin-users` - Get admin users for notifications
- `GET /api/push/health` - Health check

### Step 3: Start the Server

```bash
cd server
npm install
npm start
```

## 📱 Frontend Integration

### Step 1: Enable Notifications

Users must enable notifications in the PWA:

1. Install the PWA on their device
2. Grant notification permissions
3. Complete the notification setup flow

### Step 2: Notification Flow

#### When Order is Created:
1. Customer submits booking in `BookingPage.tsx`
2. Backend sends notification to all admin users
3. Admin receives push notification on their device

#### When Order Status Changes:
1. Admin changes status in `AdminDashboard.tsx`
2. Backend sends notification to the customer
3. Customer receives push notification on their device

## 🧪 Testing the System

### Test 1: New Order Notification

1. **Create a test order**:
   - Go to `/booking` page
   - Complete the booking process
   - Check admin device for notification

2. **Expected Result**:
   - Admin receives: "🆕 New Order Received! Order #123 - John Doe - 2024-01-15"

### Test 2: Status Change Notification

1. **Change order status**:
   - Go to admin dashboard
   - Change any order status
   - Check customer device for notification

2. **Expected Result**:
   - Customer receives: "📋 Order Status Updated Your order #123 status has changed to: Confirmed"

### Test 3: Notification Logs

Check the database for notification tracking:

```sql
-- View recent notifications
SELECT * FROM public.notification_logs ORDER BY sent_at DESC LIMIT 10;

-- Check notification delivery status
SELECT 
    notification_type,
    status,
    COUNT(*) as count
FROM public.notification_logs 
GROUP BY notification_type, status;
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Admin Not Receiving Notifications

**Check:**
- Admin user has `role = 'admin'` in profiles table
- Admin has active OneSignal subscription
- Backend server is running and accessible

**Solution:**
```sql
-- Verify admin role
SELECT id, full_name, role FROM public.profiles WHERE role = 'admin';

-- Check OneSignal subscription
SELECT * FROM public.user_push_subscriptions WHERE user_id = 'admin-user-id';
```

#### 2. Customer Not Receiving Notifications

**Check:**
- Customer has granted notification permissions
- PWA is properly installed
- OneSignal subscription is active

**Solution:**
- Reinstall PWA on customer device
- Check notification permissions in browser settings
- Verify OneSignal setup in browser console

#### 3. Backend API Errors

**Check:**
- Server logs for error messages
- Environment variables are set correctly
- OneSignal credentials are valid

**Solution:**
```bash
# Check server logs
tail -f server/logs/app.log

# Test OneSignal connection
curl -X GET "https://api.onesignal.com/apps" \
  -H "Authorization: Basic YOUR_REST_API_KEY"
```

## 📊 Monitoring and Analytics

### Notification Statistics

```sql
-- Daily notification count
SELECT 
    DATE(sent_at) as date,
    notification_type,
    COUNT(*) as sent,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
    COUNT(CASE WHEN status = 'read' THEN 1 END) as read
FROM public.notification_logs 
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(sent_at), notification_type
ORDER BY date DESC;
```

### Delivery Success Rate

```sql
-- Calculate delivery success rate
SELECT 
    notification_type,
    COUNT(*) as total_sent,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
    ROUND(
        COUNT(CASE WHEN status = 'delivered' THEN 1 END)::DECIMAL / COUNT(*) * 100, 2
    ) as success_rate
FROM public.notification_logs 
GROUP BY notification_type;
```

## 🚀 Production Deployment

### 1. Database Migration

Run the SQL script in your production Supabase instance:

```bash
# Connect to production database
psql "postgresql://username:password@host:port/database"

# Run the setup script
\i notification_system_setup.sql
```

### 2. Environment Configuration

Set production environment variables:

```env
NODE_ENV=production
ONESIGNAL_APP_ID=your-production-app-id
ONESIGNAL_REST_API_KEY=your-production-rest-api-key
```

### 3. Server Deployment

Deploy your backend server with the notification endpoints:

```bash
# Build and deploy
npm run build
npm run start:prod
```

## 📱 PWA Requirements

### iOS PWA
- Must be installed to home screen
- Requires user gesture to request notifications
- Notifications appear as banners

### Android PWA
- Must be installed to home screen
- Notifications appear in notification tray
- Better notification support than iOS

### Desktop Browser
- Chrome, Firefox, Safari support
- Notifications appear as system notifications
- Best notification experience

## 🔐 Security Considerations

1. **RLS Policies**: All notification data is protected by Row Level Security
2. **User Isolation**: Users can only see their own notification logs
3. **Admin Access**: Only admin users can view all notification data
4. **API Protection**: Backend endpoints validate user permissions

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs for error messages
3. Verify OneSignal dashboard for delivery status
4. Check browser console for frontend errors

## 📚 Additional Resources

- [OneSignal Documentation](https://documentation.onesignal.com/)
- [PWA Notification Guide](https://web.dev/push-notifications/)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security) 