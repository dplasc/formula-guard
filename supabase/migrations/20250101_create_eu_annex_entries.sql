-- Create enum types for eu_annex_entries table
CREATE TYPE annex_type AS ENUM ('II', 'III', 'VI');
CREATE TYPE product_type_enum AS ENUM ('leave_on', 'rinse_off', 'both');

-- Create eu_annex_entries table
CREATE TABLE IF NOT EXISTS eu_annex_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inci_canonical TEXT NOT NULL,
  annex annex_type NOT NULL,
  product_type product_type_enum NOT NULL,
  max_percentage NUMERIC(5, 2),
  conditions_text TEXT,
  reference_url TEXT,
  source TEXT,
  active_from DATE,
  active_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on inci_canonical for fast lookups
CREATE INDEX IF NOT EXISTS idx_eu_annex_entries_inci_canonical ON eu_annex_entries(inci_canonical);

-- Create index on annex for filtering
CREATE INDEX IF NOT EXISTS idx_eu_annex_entries_annex ON eu_annex_entries(annex);

-- Create index on product_type for filtering
CREATE INDEX IF NOT EXISTS idx_eu_annex_entries_product_type ON eu_annex_entries(product_type);

-- Create composite index for common query pattern (inci + annex + product_type)
CREATE INDEX IF NOT EXISTS idx_eu_annex_entries_lookup ON eu_annex_entries(inci_canonical, annex, product_type);

-- Add comment to table
COMMENT ON TABLE eu_annex_entries IS 'EU Cosmetics Regulation Annex II/III/VI compliance entries';
COMMENT ON COLUMN eu_annex_entries.annex IS 'Annex II (prohibited), Annex III (restricted), or Annex VI (UV filters)';
COMMENT ON COLUMN eu_annex_entries.product_type IS 'Product type: leave_on, rinse_off, or both';
COMMENT ON COLUMN eu_annex_entries.max_percentage IS 'Maximum allowed percentage (NULL for Annex II entries)';
COMMENT ON COLUMN eu_annex_entries.conditions_text IS 'Additional conditions or restrictions text';
COMMENT ON COLUMN eu_annex_entries.active_from IS 'Date from which this entry is active (NULL = always active)';
COMMENT ON COLUMN eu_annex_entries.active_to IS 'Date until which this entry is active (NULL = no expiry)';



