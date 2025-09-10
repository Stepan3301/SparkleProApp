-- Create view for admin bookings with additional services
CREATE OR REPLACE VIEW admin_bookings_with_addons AS
SELECT 
  b.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', ads.id,
        'name', ads.name,
        'description', ads.description,
        'price', bas.total_price,
        'quantity', bas.quantity,
        'unit_price', bas.unit_price
      )
    ) FILTER (WHERE ads.id IS NOT NULL), 
    '[]'::json
  ) as detailed_addons
FROM public.bookings b
LEFT JOIN public.booking_additional_services bas ON b.id = bas.booking_id
LEFT JOIN public.additional_services ads ON bas.additional_service_id = ads.id
GROUP BY b.id;

-- Grant permissions for the view
GRANT SELECT ON admin_bookings_with_addons TO authenticated;
GRANT SELECT ON admin_bookings_with_addons TO anon;
