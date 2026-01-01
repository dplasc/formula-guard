-- Create formulas table
CREATE TABLE IF NOT EXISTS formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('leaveOn', 'rinseOff')),
  batch_size NUMERIC,
  formula_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_formulas_user_id ON formulas(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_formulas_created_at ON formulas(created_at DESC);

-- Enable Row Level Security
ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can SELECT only their own formulas
CREATE POLICY "Users can view own formulas"
  ON formulas
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can INSERT only their own formulas
CREATE POLICY "Users can insert own formulas"
  ON formulas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can UPDATE only their own formulas
CREATE POLICY "Users can update own formulas"
  ON formulas
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can DELETE only their own formulas
CREATE POLICY "Users can delete own formulas"
  ON formulas
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at on UPDATE
CREATE TRIGGER update_formulas_updated_at
  BEFORE UPDATE ON formulas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE formulas IS 'Saved cosmetic formulas for users';
COMMENT ON COLUMN formulas.user_id IS 'Owner of the formula, references auth.users';
COMMENT ON COLUMN formulas.name IS 'User-defined name for the formula';
COMMENT ON COLUMN formulas.product_type IS 'Product type: leaveOn or rinseOff';
COMMENT ON COLUMN formulas.batch_size IS 'Total batch size in grams (nullable)';
COMMENT ON COLUMN formulas.formula_data IS 'Full formula state snapshot (ingredients, processSteps, etc.) as JSONB';
COMMENT ON COLUMN formulas.created_at IS 'Timestamp when formula was created';
COMMENT ON COLUMN formulas.updated_at IS 'Timestamp when formula was last updated (auto-updated by trigger)';


