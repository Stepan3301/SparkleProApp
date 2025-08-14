-- Create user_push_subscriptions table for storing OneSignal subscription data
-- This table maps users to their OneSignal player IDs and device information

CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    external_user_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    devices JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_user_id ON public.user_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_player_id ON public.user_push_subscriptions(player_id);
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_external_user_id ON public.user_push_subscriptions(external_user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_active ON public.user_push_subscriptions(is_active) WHERE is_active = true;

-- Create unique constraint to prevent duplicate subscriptions per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_push_subscriptions_unique_user ON public.user_push_subscriptions(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON public.user_push_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON public.user_push_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions" ON public.user_push_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.user_push_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions" ON public.user_push_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_push_subscriptions_updated_at 
    BEFORE UPDATE ON public.user_push_subscriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - for testing)
-- INSERT INTO public.user_push_subscriptions (user_id, external_user_id, player_id, devices) 
-- VALUES ('your-test-user-id', 'your-test-user-id', 'test-player-id', '[]'::jsonb);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_push_subscriptions TO authenticated;
GRANT USAGE ON SEQUENCE public.user_push_subscriptions_id_seq TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.user_push_subscriptions IS 'Stores OneSignal push notification subscriptions for users';
COMMENT ON COLUMN public.user_push_subscriptions.user_id IS 'Reference to auth.users table';
COMMENT ON COLUMN public.user_push_subscriptions.external_user_id IS 'OneSignal external user ID (usually same as user_id)';
COMMENT ON COLUMN public.user_push_subscriptions.player_id IS 'OneSignal player ID (subscription ID)';
COMMENT ON COLUMN public.user_push_subscriptions.devices IS 'JSON array of device information from OneSignal';
COMMENT ON COLUMN public.user_push_subscriptions.is_active IS 'Whether the subscription is currently active';
COMMENT ON COLUMN public.user_push_subscriptions.created_at IS 'When the subscription was first created';
COMMENT ON COLUMN public.user_push_subscriptions.updated_at IS 'When the subscription was last updated'; 