-- SmartShort Database Schema
-- Execute this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'banned')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT true
);

-- Ensure verified column exists on reruns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT true;

-- Additional user profile, payout, and notification fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS username VARCHAR(100),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS upi_id TEXT,
  ADD COLUMN IF NOT EXISTS paypal_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bank_details TEXT,
  ADD COLUMN IF NOT EXISTS notify_email BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_withdrawal BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_analytics BOOLEAN DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username);

-- Links table
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  main_title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  earnings DECIMAL(10, 4) DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Settings key/value store
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact messages table for public form submissions
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Movie links table
CREATE TABLE IF NOT EXISTS movie_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  quality VARCHAR(10) NOT NULL CHECK (quality IN ('480p', '720p', '1080p')),
  target_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clicks table
CREATE TABLE IF NOT EXISTS clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  country VARCHAR(100),
  city VARCHAR(100),
  device VARCHAR(50) NOT NULL CHECK (device IN ('desktop', 'mobile', 'tablet')),
  os VARCHAR(100) NOT NULL,
  referrer VARCHAR(255),
  earnings DECIMAL(10, 4) DEFAULT 0,
  ip_hash VARCHAR(255) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
CREATE INDEX IF NOT EXISTS idx_links_is_active ON links(is_active);
CREATE INDEX IF NOT EXISTS idx_movie_links_link_id ON movie_links(link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON clicks(timestamp);
CREATE INDEX IF NOT EXISTS idx_clicks_country ON clicks(country);
CREATE INDEX IF NOT EXISTS idx_clicks_device ON clicks(device);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);

-- Wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 4) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'initiated', 'paid', 'failed')),
  method VARCHAR(50) NOT NULL,
  account_identifier TEXT NOT NULL,
  payment_link_id TEXT,
  razorpay_status TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Ensure all auth users are mirrored into public.users
DO $$
BEGIN
  INSERT INTO public.users (id, email, role, created_at, verified)
  SELECT id, email, 'user', created_at, true
  FROM auth.users
  WHERE id NOT IN (SELECT id FROM public.users);
END $$;

-- RLS Policies for users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Users can create their own profile'
  ) THEN
    CREATE POLICY "Users can create their own profile"
      ON users FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Users can read their own profile'
  ) THEN
    CREATE POLICY "Users can read their own profile"
      ON users FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON users FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- RLS Policies for links table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'links'
      AND policyname = 'Users can read their own links'
  ) THEN
    CREATE POLICY "Users can read their own links"
      ON links FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'links'
      AND policyname = 'Users can create links'
  ) THEN
    CREATE POLICY "Users can create links"
      ON links FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'links'
      AND policyname = 'Users can update their own links'
  ) THEN
    CREATE POLICY "Users can update their own links"
      ON links FOR UPDATE
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'links'
      AND policyname = 'Users can delete their own links'
  ) THEN
    CREATE POLICY "Users can delete their own links"
      ON links FOR DELETE
      USING (user_id = auth.uid());
  END IF;
END $$;

-- RLS Policies for movie_links table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'movie_links'
      AND policyname = 'Users can read movie links for their links'
  ) THEN
    CREATE POLICY "Users can read movie links for their links"
      ON movie_links FOR SELECT
      USING (
        link_id IN (
          SELECT id FROM links WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'movie_links'
      AND policyname = 'Users can create movie links for their links'
  ) THEN
    CREATE POLICY "Users can create movie links for their links"
      ON movie_links FOR INSERT
      WITH CHECK (
        link_id IN (
          SELECT id FROM links WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- RLS Policies for clicks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clicks'
      AND policyname = 'Users can read clicks for their links'
  ) THEN
    CREATE POLICY "Users can read clicks for their links"
      ON clicks FOR SELECT
      USING (
        link_id IN (
          SELECT id FROM links WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clicks'
      AND policyname = 'Anyone can create clicks'
  ) THEN
    CREATE POLICY "Anyone can create clicks"
      ON clicks FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- RLS Policies for settings table (read-only for all, manage via service role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'settings'
      AND policyname = 'Anyone can read settings'
  ) THEN
    CREATE POLICY "Anyone can read settings"
      ON settings FOR SELECT
      USING (true);
  END IF;
END $$;

-- RLS Policies for contact_messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_messages'
      AND policyname = 'Anyone can create contact message'
  ) THEN
    CREATE POLICY "Anyone can create contact message"
      ON contact_messages FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contact_messages'
      AND policyname = 'Admins can read contact messages'
  ) THEN
    CREATE POLICY "Admins can read contact messages"
      ON contact_messages FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
      ));
  END IF;
END $$;

-- RLS Policies for wallet_transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wallet_transactions'
      AND policyname = 'Users can read their own wallet transactions'
  ) THEN
    CREATE POLICY "Users can read their own wallet transactions"
      ON wallet_transactions FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wallet_transactions'
      AND policyname = 'Users can create their own wallet transactions'
  ) THEN
    CREATE POLICY "Users can create their own wallet transactions"
      ON wallet_transactions FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to sync Supabase auth with users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Function to delete user data when auth user is deleted
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.users WHERE id = old.id;
  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user deletion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_deleted'
  ) THEN
    CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_delete();
  END IF;
END $$;

-- Seed data (optional)
-- INSERT INTO users (id, email, role) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440000', 'admin@example.com', 'admin'),
-- ('550e8400-e29b-41d4-a716-446655440001', 'user@example.com', 'user');
