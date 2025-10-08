-- Email Notification Trigger Setup
-- Run this SQL in your Supabase SQL Editor after deploying the Edge Function

-- 1. Create function to send email notifications on status change
CREATE OR REPLACE FUNCTION send_booking_status_email()
RETURNS TRIGGER AS $$
DECLARE
    customer_email text;
    customer_name text;
    service_name text;
    booking_number text;
    template_name text;
    service_date text;
    service_time text;
    service_address text;
    total_amount numeric;
    completion_time text;
    cancellation_time text;
    app_url text := 'https://sparkleproapp.com'; -- Update this to your actual domain
BEGIN
    -- Only proceed if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        
        -- Get customer details
        SELECT u.email, 
               COALESCE(p.full_name, u.email) as name
        INTO customer_email, customer_name
        FROM auth.users u
        LEFT JOIN profiles p ON p.id = u.id
        WHERE u.id = NEW.user_id;
        
        -- Get service details
        SELECT s.name INTO service_name
        FROM services s
        WHERE s.id = NEW.service_id;
        
        -- Get address
        SELECT a.street INTO service_address
        FROM addresses a
        WHERE a.id = NEW.address_id;
        
        -- Format booking details
        booking_number := NEW.id::text;
        service_date := to_char(NEW.service_date, 'Day, Mon DD, YYYY');
        service_time := NEW.service_time;
        total_amount := NEW.total_amount;
        
        -- Determine template based on new status
        CASE NEW.status
            WHEN 'confirmed' THEN
                template_name := 'order_confirmed';
            WHEN 'in_progress' THEN
                template_name := 'order_in_progress';
            WHEN 'completed' THEN
                template_name := 'order_completed';
                completion_time := to_char(NOW(), 'Day, Mon DD, YYYY at HH24:MI');
            WHEN 'cancelled' THEN
                template_name := 'order_cancelled';
                cancellation_time := to_char(NOW(), 'Day, Mon DD, YYYY at HH24:MI');
            ELSE
                -- No email for other statuses
                RETURN NEW;
        END CASE;
        
        -- Call the Edge Function to send email
        PERFORM net.http_post(
            url := 'https://rpvohieuafewgivonjgr.supabase.co/functions/v1/send-email',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            body := jsonb_build_object(
                'booking_id', NEW.id,
                'template_name', template_name,
                'recipient_email', customer_email,
                'recipient_name', customer_name,
                'variables', jsonb_build_object(
                    'customer_name', customer_name,
                    'booking_number', booking_number,
                    'service_name', service_name,
                    'service_date', service_date,
                    'service_time', service_time,
                    'service_address', service_address,
                    'total_amount', total_amount,
                    'completion_time', completion_time,
                    'cancellation_time', cancellation_time,
                    'app_url', app_url
                )
            )::text
        );
        
        -- Log the trigger execution
        RAISE NOTICE 'Email notification triggered for booking % with status %', NEW.id, NEW.status;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS booking_status_email_trigger ON bookings;
CREATE TRIGGER booking_status_email_trigger
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION send_booking_status_email();

-- 3. Create a function to manually send test emails (for testing)
CREATE OR REPLACE FUNCTION send_test_email(
    test_booking_id bigint,
    test_template_name text DEFAULT 'order_confirmed'
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    -- Call the Edge Function directly for testing
    SELECT content::jsonb INTO result
    FROM net.http_post(
        url := 'https://rpvohieuafewgivonjgr.supabase.co/functions/v1/send-email',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
            'booking_id', test_booking_id,
            'template_name', test_template_name,
            'recipient_email', 'test@example.com', -- Change this to your email for testing
            'recipient_name', 'Test Customer',
            'variables', jsonb_build_object(
                'customer_name', 'Test Customer',
                'booking_number', test_booking_id::text,
                'service_name', 'Test Service',
                'service_date', 'Monday, Jan 15, 2024',
                'service_time', '10:00 AM',
                'service_address', '123 Test Street, Dubai',
                'total_amount', 299,
                'app_url', 'https://sparkleproapp.com'
            ),
            'force_send', true
        )::text
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION send_booking_status_email() TO authenticated;
GRANT EXECUTE ON FUNCTION send_test_email(bigint, text) TO authenticated;

RAISE NOTICE 'Email notification triggers created successfully! You can test with: SELECT send_test_email(1);';
