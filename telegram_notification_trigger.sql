-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http;

-- Create the trigger function for Telegram notifications
CREATE OR REPLACE FUNCTION notify_telegram_new_booking()
RETURNS TRIGGER AS $$
DECLARE
    bot_token TEXT := '8450168819:AAGiHW7HG8fWLxc6zz5LtICul9k8wsejugA';
    chat_id TEXT := '-1002386018387';
    telegram_url TEXT := 'https://api.telegram.org/bot' || bot_token || '/sendMessage';
    message_text TEXT;
    response http_response;
BEGIN
    -- Format the message with booking details
    message_text := '🎉 **NEW BOOKING CREATED** 🎉' || E'\n\n' ||
                   '📋 **Booking ID:** #' || NEW.id || E'\n' ||
                   '👤 **Customer:** ' || COALESCE(NEW.customer_name, 'N/A') || E'\n' ||
                   '📅 **Service Date:** ' || COALESCE(NEW.service_date::text, 'N/A') || E'\n' ||
                   '🕐 **Service Time:** ' || COALESCE(NEW.service_time::text, 'N/A') || E'\n' ||
                   '🏠 **Property Size:** ' || COALESCE(NEW.property_size, 'N/A') || E'\n' ||
                   '👥 **Cleaners:** ' || COALESCE(NEW.cleaners_count::text, 'N/A') || E'\n' ||
                   '⏱️ **Duration:** ' || COALESCE(NEW.duration_hours::text, 'N/A') || ' hours' || E'\n' ||
                   '💰 **Total Cost:** ' || COALESCE(NEW.total_cost::text, 'N/A') || ' AED' || E'\n' ||
                   '📍 **Address:** ' || COALESCE(NEW.custom_address, 'Saved Address') || E'\n' ||
                   '📝 **Status:** ' || UPPER(NEW.status::text) || E'\n' ||
                   '🕒 **Created:** ' || NEW.created_at::text || E'\n\n' ||
                   '🔔 Check the admin dashboard for more details!';
    
    -- Send the HTTP POST request to Telegram
    SELECT * INTO response FROM http((
        'POST',
        telegram_url,
        ARRAY[http_header('Content-Type', 'application/json')],
        'application/json',
        json_build_object(
            'chat_id', chat_id,
            'text', message_text,
            'parse_mode', 'Markdown'
        )::text
    ));
    
    -- Log the response for debugging (optional)
    RAISE NOTICE 'Telegram notification sent for booking #%: %', NEW.id, response.status;
    
    -- Return the NEW record
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log any errors but don't fail the insert
        RAISE WARNING 'Failed to send Telegram notification for booking #%: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that fires AFTER INSERT on the bookings table
DROP TRIGGER IF EXISTS trigger_telegram_new_booking ON public.bookings;
CREATE TRIGGER trigger_telegram_new_booking
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_telegram_new_booking();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_telegram_new_booking() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_telegram_new_booking() TO service_role;

-- Test the function (optional - you can run this to test)
-- INSERT INTO public.bookings (customer_id, service_id, service_date, service_time, duration_hours, total_cost, status, customer_name, custom_address, property_size, cleaners_count)
-- VALUES (
--     '00000000-0000-0000-0000-000000000000'::uuid,  -- Replace with actual user ID
--     1,  -- Replace with actual service ID
--     CURRENT_DATE + INTERVAL '1 day',
--     '10:00:00',
--     2,
--     150.00,
--     'pending',
--     'Test Customer',
--     'Test Address, Dubai',
--     'medium',
--     2
-- );
