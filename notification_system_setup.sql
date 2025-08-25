-- Notification System Setup for SparklePro
-- This script sets up the complete notification infrastructure for order management

-- 1. Ensure the user_push_subscriptions table exists (from create_push_subscriptions_table.sql)
-- If not already created, run create_push_subscriptions_table.sql first

-- 2. Add notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "new_orders": true,
  "order_updates": true,
  "reminders": true,
  "promotions": true
}'::jsonb;

-- 3. Add notification tracking to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_notification_status TEXT;

-- 4. Create notification_logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    booking_id BIGINT REFERENCES public.bookings(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    onesignal_id TEXT,
    status TEXT DEFAULT 'sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_booking_id ON public.notification_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON public.notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON public.notification_logs(sent_at);

-- 6. Enable RLS on notification_logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for notification_logs
-- Users can view their own notification logs
CREATE POLICY "Users can view own notification logs" ON public.notification_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all notification logs
CREATE POLICY "Admins can view all notification logs" ON public.notification_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 8. Create function to get admin users for notifications
CREATE OR REPLACE FUNCTION get_admin_users_for_notifications()
RETURNS TABLE (
    user_id UUID,
    external_user_id TEXT,
    player_id TEXT,
    full_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.id::TEXT as external_user_id,
        ups.player_id,
        p.full_name
    FROM public.profiles p
    LEFT JOIN public.user_push_subscriptions ups ON p.id = ups.user_id
    WHERE p.role = 'admin'::user_role
    AND ups.is_active = true
    AND ups.player_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to log notifications
CREATE OR REPLACE FUNCTION log_notification(
    p_user_id UUID,
    p_booking_id BIGINT,
    p_notification_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}'::jsonb,
    p_onesignal_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.notification_logs (
        user_id,
        booking_id,
        notification_type,
        title,
        message,
        data,
        onesignal_id
    ) VALUES (
        p_user_id,
        p_booking_id,
        p_notification_type,
        p_title,
        p_message,
        p_data,
        p_onesignal_id
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to mark notification as delivered
CREATE OR REPLACE FUNCTION mark_notification_delivered(
    p_onesignal_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.notification_logs 
    SET 
        status = 'delivered',
        delivered_at = NOW()
    WHERE onesignal_id = p_onesignal_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.notification_logs 
    SET 
        status = 'read',
        read_at = NOW()
    WHERE id = p_notification_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.notification_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_users_for_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION log_notification(UUID, BIGINT, TEXT, TEXT, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_delivered(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;

-- 13. Insert sample admin user (replace with actual admin user ID)
-- INSERT INTO public.profiles (id, full_name, role) 
-- VALUES ('your-admin-user-id', 'Admin User', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 14. Comments for documentation
COMMENT ON TABLE public.notification_logs IS 'Tracks all push notifications sent to users';
COMMENT ON COLUMN public.notification_logs.notification_type IS 'Type of notification: new_order, order_status_change, reminder, etc.';
COMMENT ON COLUMN public.notification_logs.status IS 'Status: sent, delivered, read, failed';
COMMENT ON COLUMN public.notification_logs.onesignal_id IS 'OneSignal notification ID for tracking delivery';

COMMENT ON FUNCTION get_admin_users_for_notifications() IS 'Returns all admin users with active push notification subscriptions';
COMMENT ON FUNCTION log_notification(UUID, BIGINT, TEXT, TEXT, TEXT, JSONB, TEXT) IS 'Logs a notification for tracking purposes';
COMMENT ON FUNCTION mark_notification_delivered(TEXT) IS 'Marks a notification as delivered based on OneSignal ID';
COMMENT ON FUNCTION mark_notification_read(UUID) IS 'Marks a notification as read by the user';

-- 15. Create trigger to update notification_sent_at when status changes
CREATE OR REPLACE FUNCTION update_booking_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        NEW.notification_sent_at = NOW();
        NEW.last_notification_status = NEW.status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_booking_notification_timestamp
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_notification_timestamp();

-- 16. Sample queries for testing
/*
-- Get all admin users
SELECT * FROM get_admin_users_for_notifications();

-- Get notification logs for a user
SELECT * FROM public.notification_logs WHERE user_id = 'user-id-here';

-- Get recent notifications
SELECT * FROM public.notification_logs ORDER BY sent_at DESC LIMIT 10;

-- Get notification statistics
SELECT 
    notification_type,
    status,
    COUNT(*) as count
FROM public.notification_logs 
GROUP BY notification_type, status;
*/ 