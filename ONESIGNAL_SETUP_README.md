# OneSignal Web Push Notifications Setup Guide

This guide will help you set up OneSignal Web Push Notifications for your SparklePro React PWA.

## 🚀 Quick Start

### 1. OneSignal Account Setup

1. **Create OneSignal Account**
   - Go to [OneSignal.com](https://onesignal.com) and sign up
   - Create a new app for your SparklePro project

2. **Configure App Settings**
   - **App Name**: SparklePro
   - **Platform**: Web Push (Chrome, Firefox, Safari)
   - **Website URL**: `https://sparkleproapp.com` (your domain)

3. **Get Credentials**
   - **App ID**: Found in Settings > Keys & IDs
   - **REST API Key**: Found in Settings > Keys & IDs

### 2. Environment Variables

Add these to your `.env` file:

```bash
# OneSignal Configuration
REACT_APP_ONESIGNAL_APP_ID="your-onesignal-app-id"
REACT_APP_BACKEND_BASE_URL="https://api.sparkleproapp.com"

# Backend Environment Variables (for your Node.js server)
ONESIGNAL_APP_ID="your-onesignal-app-id"
ONESIGNAL_REST_API_KEY="your-onesignal-rest-api-key"
```

### 3. Database Setup

Run the SQL script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of create_push_subscriptions_table.sql
```

## 📱 Platform-Specific Setup

### Android (Chrome)
- ✅ **Automatic**: Works out of the box
- ✅ **PWA Installation**: Supports notifications when installed
- ✅ **Browser**: Supports notifications in browser

### iOS 16.4+ PWA
- ✅ **Home Screen Installation**: Must be added to Home Screen
- ✅ **Safari Tab**: Notifications won't work (shows install prompt)
- ✅ **Permission**: Requested after user gesture in PWA context

### Desktop Browsers
- ✅ **Chrome**: Full support
- ✅ **Firefox**: Full support
- ✅ **Safari**: Limited support (macOS only)
- ✅ **Edge**: Full support

## 🔧 Configuration Steps

### 1. OneSignal Dashboard Configuration

#### Site Settings
1. Go to **Settings > Web Push Settings**
2. **Site Name**: `SparklePro`
3. **Site URL**: `https://sparkleproapp.com`
4. **Default Notification Icon**: Upload your app logo (192x192px)

#### Notification Settings
1. **Default Language**: English
2. **Time Zone**: UTC+4 (UAE)
3. **Notification Badge**: Enable
4. **Notification Sound**: Enable

#### Advanced Settings
1. **Subdomain**: Leave empty (using custom domain)
2. **HTTP Referrers**: Add your domain
3. **SSL Certificate**: Ensure HTTPS is enabled

### 2. Icon Requirements

Upload these icons to OneSignal:

- **Notification Icon**: 192x192px (PNG/JPG)
- **Large Icon**: 512x512px (PNG/JPG)
- **Badge Icon**: 72x72px (PNG/JPG)

### 3. Browser Configuration

#### Chrome
- **Manifest**: Ensure `gcm_sender_id` is set
- **Service Worker**: OneSignal manages this automatically

#### Firefox
- **Web Push**: Automatically supported
- **Service Worker**: OneSignal manages this automatically

#### Safari
- **PWA**: Must be installed to Home Screen
- **Notifications**: Limited to PWA context

## 🧪 Testing

### 1. Test Notifications

Use the test button in the app:
1. Enable notifications
2. Click "Send Test" button
3. Check if notification appears

### 2. Test Order Status Notifications

Send test order status updates:
```bash
curl -X POST https://api.sparkleproapp.com/api/push/order-status \
  -H "Content-Type: application/json" \
  -d '{
    "externalUserId": "test-user-id",
    "orderId": "123",
    "status": "assigned"
  }'
```

### 3. Test Reminder Notifications

Send test reminders:
```bash
curl -X POST https://api.sparkleproapp.com/api/push/reminder \
  -H "Content-Type: application/json" \
  -d '{
    "externalUserId": "test-user-id",
    "reminderType": "upcoming",
    "details": {
      "date": "2024-01-15",
      "url": "/booking"
    }
  }'
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Notifications Not Working on iOS
- **Problem**: User running in Safari tab instead of PWA
- **Solution**: Guide user to install to Home Screen
- **Detection**: App shows special message for Safari tab users

#### 2. Permission Denied
- **Problem**: User blocked notifications
- **Solution**: Guide user to browser settings
- **Prevention**: Don't auto-prompt, wait for user action

#### 3. Service Worker Conflicts
- **Problem**: Custom service worker interfering
- **Solution**: OneSignal manages service workers automatically
- **Note**: Remove any custom service worker registration

#### 4. Notifications Not Delivered
- **Problem**: OneSignal configuration issues
- **Solution**: Check App ID and REST API Key
- **Debug**: Use OneSignal dashboard to check delivery status

### Debug Steps

1. **Check Console Logs**
   - Look for OneSignal initialization errors
   - Check permission request results

2. **Verify Environment Variables**
   - Ensure `REACT_APP_ONESIGNAL_APP_ID` is set
   - Check backend environment variables

3. **Test Backend Endpoints**
   - Use `/api/push/health` endpoint
   - Check if OneSignal client is working

4. **OneSignal Dashboard**
   - Check subscriber count
   - Review notification delivery logs

## 📊 Monitoring & Analytics

### OneSignal Dashboard
- **Subscribers**: Track active notification subscribers
- **Delivery Rates**: Monitor notification success rates
- **Engagement**: Track notification opens and clicks

### Custom Analytics
- **Subscription Events**: Track when users enable/disable
- **Platform Data**: Monitor iOS vs Android usage
- **PWA vs Browser**: Track installation rates

## 🔒 Security Considerations

### 1. API Key Security
- **REST API Key**: Keep secure, never expose to frontend
- **App ID**: Safe to expose (public)
- **HTTPS**: Required for production

### 2. User Privacy
- **Permission**: Only request after user action
- **Opt-out**: Easy unsubscribe process
- **Data**: Minimal data collection

### 3. Rate Limiting
- **OneSignal Limits**: Respect API rate limits
- **User Limits**: Don't spam users
- **Backoff**: Implement exponential backoff for failures

## 🚀 Production Deployment

### 1. Pre-deployment Checklist
- [ ] OneSignal app configured
- [ ] Environment variables set
- [ ] Database table created
- [ ] HTTPS enabled
- [ ] Icons uploaded
- [ ] Test notifications working

### 2. Post-deployment Verification
- [ ] Check OneSignal dashboard for subscribers
- [ ] Test notifications on all platforms
- [ ] Monitor error logs
- [ ] Verify database connections

### 3. Monitoring
- [ ] Set up error tracking
- [ ] Monitor notification delivery rates
- [ ] Track user engagement
- [ ] Monitor API usage

## 📚 Additional Resources

- [OneSignal Documentation](https://documentation.onesignal.com/)
- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [iOS PWA Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

## 🆘 Support

If you encounter issues:

1. **Check OneSignal Status**: [status.onesignal.com](https://status.onesignal.com)
2. **Review Logs**: Check browser console and server logs
3. **Test Endpoints**: Use health check endpoints
4. **OneSignal Support**: Contact OneSignal support team

---

**Note**: This implementation follows OneSignal best practices and handles edge cases for iOS PWA, Android, and desktop browsers. The system gracefully degrades when notifications aren't supported and provides clear user guidance for each platform. 