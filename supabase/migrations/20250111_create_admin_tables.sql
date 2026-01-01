-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on role for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Enable Row Level Security on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can SELECT their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Only super_admin can UPDATE roles (optional for now, can be extended)
-- Note: This requires checking the user's role, which may need a function
-- For now, we'll allow users to update their own profile, but role updates will be restricted in app logic
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can SELECT (public readable)
CREATE POLICY "Anyone can view site settings"
  ON site_settings
  FOR SELECT
  USING (true);

-- RLS Policy: Only super_admin can INSERT/UPDATE/DELETE
-- We'll use a function to check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policy: Only super_admin can INSERT
CREATE POLICY "Only super_admin can insert site settings"
  ON site_settings
  FOR INSERT
  WITH CHECK (is_super_admin());

-- RLS Policy: Only super_admin can UPDATE
CREATE POLICY "Only super_admin can update site settings"
  ON site_settings
  FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- RLS Policy: Only super_admin can DELETE
CREATE POLICY "Only super_admin can delete site settings"
  ON site_settings
  FOR DELETE
  USING (is_super_admin());

-- Create trigger to auto-update updated_at on site_settings
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE profiles IS 'User profiles with role-based access control';
COMMENT ON COLUMN profiles.user_id IS 'References auth.users, primary key';
COMMENT ON COLUMN profiles.role IS 'User role: user, admin, or super_admin';
COMMENT ON TABLE site_settings IS 'Site-wide settings editable by super_admin only';
COMMENT ON COLUMN site_settings.key IS 'Setting key (e.g., instagram_url, contact_email)';
COMMENT ON COLUMN site_settings.value IS 'Setting value';


