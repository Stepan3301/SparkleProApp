# 📧 Email Notification System Setup Instructions

## ✅ **What I've Already Done:**

1. ✅ Created database tables (`email_templates`, `email_logs`)
2. ✅ Inserted beautiful email templates for all order statuses
3. ✅ Created Supabase Edge Function code
4. ✅ Created database trigger for automatic emails

## 🔧 **What You Need to Do:**

### **Step 1: Deploy the Edge Function**

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase CLI**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref rpvohieuafewgivonjgr
   ```

4. **Deploy the function**:
   ```bash
   supabase functions deploy send-email --no-verify-jwt
   ```

### **Step 2: Set Environment Variables**

In your Supabase dashboard, go to **Settings > Edge Functions** and add:

```
RESEND_API_KEY=your_resend_api_key_here
```

### **Step 3: Enable HTTP Extension**

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable the http extension for database triggers
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
```

### **Step 4: Set Service Role Key**

Run this SQL in your Supabase SQL Editor (replace with your actual service role key):

```sql
-- Set service role key for trigger function
ALTER DATABASE postgres SET app.settings.service_role_key = 'your_service_role_key_here';
```

### **Step 5: Apply Database Triggers**

Run the SQL from `email_trigger_setup.sql` in your Supabase SQL Editor.

### **Step 6: Test the System**

Test with this SQL command (replace with your email):

```sql
-- Test email sending
SELECT send_test_email(1, 'order_confirmed');
```

## 📧 **Email Templates Created:**

1. **Order Confirmed** - `order_confirmed`
   - ✅ Beautiful green theme
   - ✅ Booking details display
   - ✅ Call-to-action buttons

2. **Order Completed** - `order_completed` 
   - ✅ Success theme with stars
   - ✅ Review request
   - ✅ Book again button

3. **Order Cancelled** - `order_cancelled`
   - ✅ Professional cancellation notice
   - ✅ Rebook encouragement

## 🔄 **How It Works:**

1. **Admin changes order status** in the admin dashboard
2. **Database trigger fires** automatically
3. **Edge function called** with order details
4. **Email template fetched** from database
5. **Variables replaced** with real booking data
6. **Email sent via Resend** to customer
7. **Email logged** in database for tracking

## 🎯 **Email Flow:**

```
Order Status Change → Database Trigger → Edge Function → Resend API → Customer Email
```

## 📊 **Email Tracking:**

All emails are logged in the `email_logs` table with:
- ✅ Delivery status
- ✅ Timestamp
- ✅ Error messages (if any)
- ✅ Resend tracking ID

## 🚀 **Ready to Use:**

Once you complete the steps above, your customers will automatically receive:

- ✅ **Confirmation emails** when orders are confirmed
- ✅ **Completion emails** when service is done (with review request)
- ✅ **Cancellation emails** when orders are cancelled

## 🔧 **Customization:**

You can easily:
- Edit email templates in the `email_templates` table
- Add new templates for other statuses
- Customize the sender name/email
- Add more variables to templates

## 🆘 **Need Help?**

If you run into issues:
1. Check Supabase Edge Function logs
2. Check the `email_logs` table for errors
3. Verify environment variables are set
4. Test with the `send_test_email()` function

Let me know when you've completed these steps and I'll help you test it! 🚀
