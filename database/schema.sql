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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
CREATE INDEX idx_links_user_id ON links(user_id);
CREATE INDEX idx_links_slug ON links(slug);
CREATE INDEX idx_links_is_active ON links(is_active);
CREATE INDEX idx_movie_links_link_id ON movie_links(link_id);
CREATE INDEX idx_clicks_link_id ON clicks(link_id);
CREATE INDEX idx_clicks_timestamp ON clicks(timestamp);
CREATE INDEX idx_clicks_country ON clicks(country);
CREATE INDEX idx_clicks_device ON clicks(device);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for links table
CREATE POLICY "Users can read their own links"
  ON links FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create links"
  ON links FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own links"
  ON links FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own links"
  ON links FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for movie_links table
CREATE POLICY "Users can read movie links for their links"
  ON movie_links FOR SELECT
  USING (
    link_id IN (
      SELECT id FROM links WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create movie links for their links"
  ON movie_links FOR INSERT
  WITH CHECK (
    link_id IN (
      SELECT id FROM links WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for clicks table
CREATE POLICY "Users can read clicks for their links"
  ON clicks FOR SELECT
  USING (
    link_id IN (
      SELECT id FROM links WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create clicks"
  ON clicks FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

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
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Function to delete user data when auth user is deleted
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.users WHERE id = old.id;
  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user deletion
CREATE TRIGGER on_auth_user_deleted
AFTER DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_delete();

-- Seed data (optional)
-- INSERT INTO users (id, email, role) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440000', 'admin@example.com', 'admin'),
-- ('550e8400-e29b-41d4-a716-446655440001', 'user@example.com', 'user');
