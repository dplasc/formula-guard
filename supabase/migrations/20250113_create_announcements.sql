-- Create site_announcements table
CREATE TABLE IF NOT EXISTS site_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'logged_in', 'pro_only')),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on published_at for sorting
CREATE INDEX IF NOT EXISTS idx_site_announcements_published_at ON site_announcements(published_at DESC);

-- Create index on audience for filtering
CREATE INDEX IF NOT EXISTS idx_site_announcements_audience ON site_announcements(audience);

-- Enable Row Level Security on site_announcements
ALTER TABLE site_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT allowed to everyone (public read)
CREATE POLICY "Anyone can view announcements"
  ON site_announcements
  FOR SELECT
  USING (true);

-- RLS Policy: INSERT only super_admin
CREATE POLICY "Only super_admin can insert announcements"
  ON site_announcements
  FOR INSERT
  WITH CHECK (is_super_admin());

-- RLS Policy: UPDATE only super_admin
CREATE POLICY "Only super_admin can update announcements"
  ON site_announcements
  FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- RLS Policy: DELETE only super_admin
CREATE POLICY "Only super_admin can delete announcements"
  ON site_announcements
  FOR DELETE
  USING (is_super_admin());

-- Create announcement_reads table
CREATE TABLE IF NOT EXISTS announcement_reads (
  announcement_id UUID NOT NULL REFERENCES site_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (announcement_id, user_id)
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON announcement_reads(user_id);

-- Enable Row Level Security on announcement_reads
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policy: INSERT only for own user_id
CREATE POLICY "Users can mark announcements as read"
  ON announcement_reads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: SELECT only for own user_id
CREATE POLICY "Users can view own reads"
  ON announcement_reads
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: DELETE only for own user_id
CREATE POLICY "Users can delete own reads"
  ON announcement_reads
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE site_announcements IS 'Site-wide announcements published by super_admin';
COMMENT ON COLUMN site_announcements.title IS 'Announcement title';
COMMENT ON COLUMN site_announcements.body IS 'Announcement body text';
COMMENT ON COLUMN site_announcements.link IS 'Optional link URL';
COMMENT ON COLUMN site_announcements.audience IS 'Target audience: all, logged_in, or pro_only';
COMMENT ON COLUMN site_announcements.published_at IS 'When the announcement was published';
COMMENT ON TABLE announcement_reads IS 'Tracks which users have read which announcements';
COMMENT ON COLUMN announcement_reads.read_at IS 'When the user marked the announcement as read';

