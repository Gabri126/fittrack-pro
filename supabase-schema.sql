-- FitTrack Ultra — Supabase Schema
-- Run this in the Supabase SQL Editor to create the required tables.

-- 1. Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  goal TEXT DEFAULT 'Ipertrofia',
  level TEXT DEFAULT 'Intermedio',
  xp INTEGER DEFAULT 0,
  weight REAL,
  height REAL,
  local_library_backup JSONB,
  local_history_backup JSONB,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Shared Plans (magic link sharing)
CREATE TABLE IF NOT EXISTS shared_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_data JSONB NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Friendships (follower/following)
CREATE TABLE IF NOT EXISTS friendships (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shared_plans_slug ON shared_plans(slug);
CREATE INDEX IF NOT EXISTS idx_shared_plans_creator ON shared_plans(creator_id);
CREATE INDEX IF NOT EXISTS idx_friendships_follower ON friendships(follower_id);
CREATE INDEX IF NOT EXISTS idx_friendships_following ON friendships(following_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read any profile, but only update their own
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Shared plans: anyone can read, only creator can insert
CREATE POLICY "Public shared plans" ON shared_plans FOR SELECT USING (true);
CREATE POLICY "Users create shared plans" ON shared_plans FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Friendships: users manage their own follows
CREATE POLICY "Users read friendships" ON friendships FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);
CREATE POLICY "Users create friendships" ON friendships FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users delete friendships" ON friendships FOR DELETE USING (auth.uid() = follower_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
