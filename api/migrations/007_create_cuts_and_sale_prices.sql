-- Migration 007: Create cuts table and add sale prices functionality
-- Created: 2025-05-30

-- ========== CUTS TABLE ==========
CREATE TABLE IF NOT EXISTS cuts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  hebrew_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_cuts_category ON cuts(category);
CREATE INDEX IF NOT EXISTS idx_cuts_name ON cuts(name);

-- Insert basic cuts data
INSERT INTO cuts (name, hebrew_name, category, description) VALUES 
('chicken_breast', 'חזה עוף', 'עוף', 'חזה עוף ללא עור ועצם'),
('chicken_thigh', 'ירך עוף', 'עוף', 'ירך עוף עם עצם'),
('chicken_drumstick', 'שוק עוף', 'עוף', 'שוק עוף עם עצם'),
('chicken_wings', 'כנפיים עוף', 'עוף', 'כנפיים עוף שלמות'),
('whole_chicken', 'עוף שלם', 'עוף', 'עוף שלם טרי'),
('beef_sirloin', 'אנטריקוט', 'בקר', 'אנטריקוט בקר איכותי'),
('beef_ribeye', 'ריב איי', 'בקר', 'ריב איי מובחר'),
('beef_tenderloin', 'פילה בקר', 'בקר', 'פילה בקר רך'),
('ground_beef', 'בשר טחון בקר', 'בקר', 'בשר טחון בקר טרי'),
('beef_chuck', 'צווארון בקר', 'בקר', 'צווארון בקר לבישול איטי'),
('lamb_chops', 'צלעות כבש', 'כבש', 'צלעות כבש מובחרות'),
('lamb_shoulder', 'כתף כבש', 'כבש', 'כתף כבש לצלייה'),
('ground_lamb', 'בשר טחון כבש', 'כבש', 'בשר טחון כבש טרי'),
('turkey_breast', 'חזה הודו', 'הודו', 'חזה הודו ללא עור'),
('ground_turkey', 'בשר טחון הודו', 'הודו', 'בשר טחון הודו רזה')
ON CONFLICT (name) DO NOTHING;

-- ========== UPDATE PRODUCTS TABLE ==========
-- Add cut_id foreign key to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS cut_id INTEGER REFERENCES cuts(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_cut_id ON products(cut_id);

-- ========== UPDATE PRICES TABLE FOR SALE PRICES ==========
-- Add sale price columns to prices table
ALTER TABLE prices ADD COLUMN IF NOT EXISTS is_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE prices ADD COLUMN IF NOT EXISTS sale_end_date TIMESTAMP;
ALTER TABLE prices ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prices_is_sale ON prices(is_sale);
CREATE INDEX IF NOT EXISTS idx_prices_sale_end_date ON prices(sale_end_date);

-- Update existing prices - set original_price from regular_price if it exists
UPDATE prices 
SET original_price = regular_price 
WHERE original_price IS NULL AND regular_price IS NOT NULL;

-- Add updated_at trigger for cuts table
CREATE OR REPLACE FUNCTION update_cuts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS cuts_updated_at_trigger ON cuts;
CREATE TRIGGER cuts_updated_at_trigger
    BEFORE UPDATE ON cuts
    FOR EACH ROW
    EXECUTE FUNCTION update_cuts_updated_at();