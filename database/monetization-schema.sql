-- Monetization Schema Update for SmartShort
-- Execute this in Supabase SQL Editor after running the main schema.sql

-- Ensure settings table exists (create if not present)
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns to clicks table for monetization flow
ALTER TABLE clicks
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Create index for user_id in clicks
CREATE INDEX IF NOT EXISTS idx_clicks_user_id ON clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_is_valid ON clicks(is_valid);
CREATE INDEX IF NOT EXISTS idx_clicks_is_completed ON clicks(is_completed);

-- Create earnings table
CREATE TABLE IF NOT EXISTS earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  click_id UUID NOT NULL REFERENCES clicks(id) ON DELETE CASCADE,
  amount NUMERIC(10, 4) NOT NULL CHECK (amount >= 0),
  cpm_rate NUMERIC(10, 4) NOT NULL CHECK (cpm_rate >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for earnings table
CREATE INDEX IF NOT EXISTS idx_earnings_user_id ON earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_click_id ON earnings(click_id);
CREATE INDEX IF NOT EXISTS idx_earnings_created_at ON earnings(created_at);

-- Enable RLS for earnings table
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for earnings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'earnings'
      AND policyname = 'Users can read their own earnings'
  ) THEN
    CREATE POLICY "Users can read their own earnings"
      ON earnings FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'earnings'
      AND policyname = 'System can create earnings'
  ) THEN
    CREATE POLICY "System can create earnings"
      ON earnings FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Update clicks table RLS to allow system updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clicks'
      AND policyname = 'System can update clicks'
  ) THEN
    CREATE POLICY "System can update clicks"
      ON clicks FOR UPDATE
      USING (true);
  END IF;
END $$;

-- Add CPM settings to settings table
INSERT INTO settings (key, value) 
VALUES 
  ('default_cpm', '10.00'),
  ('cpm_currency', 'USD'),
  ('ad_display_duration', '15'),
  ('min_ad_view_time', '10')
ON CONFLICT (key) DO NOTHING;

-- Function to calculate and create earnings
CREATE OR REPLACE FUNCTION create_earning_from_click(
  p_click_id UUID,
  p_user_id UUID,
  p_cpm_rate NUMERIC
)
RETURNS UUID AS $$
DECLARE
  v_earning_id UUID;
  v_amount NUMERIC;
BEGIN
  -- Calculate earning: CPM / 1000
  v_amount := p_cpm_rate / 1000.0;
  
  -- Insert earning record
  INSERT INTO earnings (user_id, click_id, amount, cpm_rate)
  VALUES (p_user_id, p_click_id, v_amount, p_cpm_rate)
  RETURNING id INTO v_earning_id;
  
  -- Update link earnings
  UPDATE links
  SET earnings = earnings + v_amount
  WHERE id = (SELECT link_id FROM clicks WHERE id = p_click_id);
  
  RETURN v_earning_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user total earnings
CREATE OR REPLACE FUNCTION get_user_total_earnings(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total
  FROM earnings
  WHERE user_id = p_user_id;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user earnings for date range
CREATE OR REPLACE FUNCTION get_user_earnings_by_date(
  p_user_id UUID,
  p_start_date TIMESTAMP,
  p_end_date TIMESTAMP
)
RETURNS TABLE(date DATE, total_amount NUMERIC, click_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(e.created_at) as date,
    SUM(e.amount) as total_amount,
    COUNT(e.id) as click_count
  FROM earnings e
  WHERE e.user_id = p_user_id
    AND e.created_at >= p_start_date
    AND e.created_at <= p_end_date
  GROUP BY DATE(e.created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE(
  total_earnings NUMERIC,
  total_clicks BIGINT,
  valid_clicks BIGINT,
  completed_clicks BIGINT,
  avg_cpm NUMERIC,
  today_earnings NUMERIC,
  today_clicks BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(e.amount), 0) as total_earnings,
    COUNT(c.id) as total_clicks,
    COUNT(CASE WHEN c.is_valid THEN 1 END) as valid_clicks,
    COUNT(CASE WHEN c.is_completed THEN 1 END) as completed_clicks,
    COALESCE(AVG(e.cpm_rate), 0) as avg_cpm,
    COALESCE(SUM(CASE WHEN DATE(e.created_at) = CURRENT_DATE THEN e.amount ELSE 0 END), 0) as today_earnings,
    COUNT(CASE WHEN DATE(c.timestamp) = CURRENT_DATE THEN 1 END) as today_clicks
  FROM clicks c
  LEFT JOIN earnings e ON e.click_id = c.id
  WHERE c.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
