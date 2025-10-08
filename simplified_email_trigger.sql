-- Simplified Email Notification Trigger Setup
-- This version doesn't require storing the service role key in the database

-- 1. Create function to send email notifications on status change (simplified version)
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
    function_url text := 'https://rpvohieuafewgivonjgr.supabase.co/functions/v1/send-email';
    anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdm9oaWV1YWZld2dpdm9uamdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEwMzU0MDEsImV4cCI6MjAzNjYxMTQwMX0.ZGy-gGr55yk5YiGCPJYb_xE3HKTfSKnQiCXEWk09X7s'; -- Your anon key
BEGIN
    -- Only proceed if status actually changed and is a status we care about
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('confirmed', 'completed', 'cancelled') THEN
        
        -- Get customer details
        SELECT u.email, 
               COALESCE(p.full_name, u.email) as name
        INTO customer_email, customer_name
        FROM auth.users u
        LEFT JOIN profiles p ON p.id = u.id
        WHERE u.id = NEW.user_id;
        
        -- Skip if no customer email found
        IF customer_email IS NULL THEN
            RETURN NEW;
        END IF;
        
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
        
        -- Call the Edge Function to send email using anon key
        BEGIN
            PERFORM net.http_post(
                url := function_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || anon_key
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
            
        EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail the main transaction
            RAISE NOTICE 'Failed to send email for booking %: %', NEW.id, SQLERRM;
        END;
        
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

-- 3. Create a simplified test function
CREATE OR REPLACE FUNCTION send_test_email(
    test_booking_id bigint DEFAULT 1,
    test_template_name text DEFAULT 'order_confirmed',
    test_email text DEFAULT 'your-email@example.com' -- Change this to your email
)
RETURNS text AS $$
DECLARE
    function_url text := 'https://rpvohieuafewgivonjgr.supabase.co/functions/v1/send-email';
    anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdm9oaWV1YWZld2dpdm9uamdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjEwMzU0MDEsImV4cCI6MjAzNjYxMTQwMX0.ZGy-gGr55yk5YiGCPJYb_xE3HKTfSKnQiCXEWk09X7s';
    result text;
BEGIN
    -- Call the Edge Function directly for testing
    BEGIN
        PERFORM net.http_post(
            url := function_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || anon_key
            ),
            body := jsonb_build_object(
                'booking_id', test_booking_id,
                'template_name', test_template_name,
                'recipient_email', test_email,
                'recipient_name', 'Test Customer',
                'variables', jsonb_build_object(
                    'customer_name', 'Test Customer',
                    'booking_number', test_booking_id::text,
                    'service_name', 'Test Cleaning Service',
                    'service_date', 'Monday, Jan 15, 2024',
                    'service_time', '10:00 AM',
                    'service_address', '123 Test Street, Dubai',
                    'total_amount', 299,
                    'app_url', 'https://sparkleproapp.com'
                ),
                'force_send', true
            )::text
        );
        
        result := 'Test email sent successfully to ' || test_email;
        
    EXCEPTION WHEN OTHERS THEN
        result := 'Error sending test email: ' || SQLERRM;
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant necessary permissions
GRANT EXECUTE ON FUNCTION send_booking_status_email() TO authenticated;
GRANT EXECUTE ON FUNCTION send_test_email(bigint, text, text) TO authenticated;

SELECT 'Email notification system setup complete! Test with: SELECT send_test_email(1, ''order_confirmed'', ''your-email@example.com'');' as message;
