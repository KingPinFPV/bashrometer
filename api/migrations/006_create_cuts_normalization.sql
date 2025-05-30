-- Migration 006: Create cuts normalization tables
-- Date: 2025-05-30
-- Description: Add tables for normalizing meat cuts data

-- Enable PostgreSQL extensions for text similarity
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Main table for normalized cuts
CREATE TABLE normalized_cuts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL, -- בקר, עוף, טלה, חזיר, דגים, אחר
  cut_type VARCHAR(50), -- סטייק, צלי, טחון, פילה, שוק, כנף, חזה
  subcategory VARCHAR(50), -- תת-קטגוריה נוספת במידת הצורך
  description TEXT,
  is_premium BOOLEAN DEFAULT false, -- האם זה נתח פרמיום
  typical_weight_range VARCHAR(50), -- טווח משקל טיפוסי כמו "200-300g"
  cooking_methods TEXT[], -- שיטות בישול מומלצות
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for mapping variations to normalized cuts
CREATE TABLE cut_variations (
  id SERIAL PRIMARY KEY,
  original_name VARCHAR(200) NOT NULL,
  normalized_cut_id INTEGER NOT NULL REFERENCES normalized_cuts(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3,2) DEFAULT 1.0, -- 0.0-1.0, רמת הביטחון במיפוי
  source VARCHAR(50) DEFAULT 'manual', -- manual, automatic, csv_import
  verified BOOLEAN DEFAULT false, -- האם המיפוי אומת ידנית
  created_by INTEGER REFERENCES users(id), -- מי יצר את המיפוי
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure no duplicate variations
  UNIQUE(original_name, normalized_cut_id)
);

-- Add indexes for performance
CREATE INDEX idx_normalized_cuts_category ON normalized_cuts(category);
CREATE INDEX idx_normalized_cuts_cut_type ON normalized_cuts(cut_type);
CREATE INDEX idx_normalized_cuts_name_trgm ON normalized_cuts USING gin(name gin_trgm_ops);

CREATE INDEX idx_cut_variations_original_name ON cut_variations(original_name);
CREATE INDEX idx_cut_variations_normalized_cut_id ON cut_variations(normalized_cut_id);
CREATE INDEX idx_cut_variations_original_name_trgm ON cut_variations USING gin(original_name gin_trgm_ops);
CREATE INDEX idx_cut_variations_confidence ON cut_variations(confidence_score DESC);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_normalized_cuts_updated_at 
  BEFORE UPDATE ON normalized_cuts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cut_variations_updated_at 
  BEFORE UPDATE ON cut_variations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample normalized cuts for common Israeli meat cuts
INSERT INTO normalized_cuts (name, category, cut_type, description, is_premium) VALUES 
-- בקר
('אנטריקוט', 'בקר', 'סטייק', 'נתח פרמיום מאזור הצלעות', true),
('פילה בקר', 'בקר', 'סטייק', 'הנתח הרך ביותר בבקר', true),
('פרימיום רוסט', 'בקר', 'צלי', 'צלי בקר איכותי', true),
('שוק בקר', 'בקר', 'צלי', 'נתח מהשוק האחורית, מתאים לבישול איטי', false),
('צלע בקר', 'בקר', 'צלי', 'צלעות בקר עם עצם', false),
('בקר טחון', 'בקר', 'טחון', 'בשר בקר טחון', false),

-- עוף
('חזה עוף', 'עוף', 'חזה', 'חזה עוף ללא עצם ועור', false),
('שוק עוף', 'עוף', 'שוק', 'שוק עוף עם עצם', false),
('כנפיים עוף', 'עוף', 'כנף', 'כנפי עוף', false),
('עוף שלם', 'עוף', 'שלם', 'עוף שלם לצלייה', false),
('גיד עוף', 'עוף', 'גיד', 'גידי עוף (רצועות חזה)', false),

-- טלה
('שוק טלה', 'טלה', 'שוק', 'שוק טלה לצלייה', true),
('צלעות טלה', 'טלה', 'צלעות', 'צלעות טלה', true),
('כבש טחון', 'טלה', 'טחון', 'בשר כבש טחון', false),

-- חזיר
('צלעות חזיר', 'חזיר', 'צלעות', 'צלעות חזיר לצלייה', false),
('שוק חזיר', 'חזיר', 'שוק', 'שוק חזיר מעושן או טרי', false),

-- דגים
('פילה סלמון', 'דגים', 'פילה', 'פילה סלמון טרי או קפוא', true),
('פילה דניס', 'דגים', 'פילה', 'פילה דניס ים תיכוני', true),
('פילה אמנון', 'דגים', 'פילה', 'פילה אמנון מגודל', false),
('טונה', 'דגים', 'סטייק', 'סטייק טונה', true);

-- Insert sample variations for testing
INSERT INTO cut_variations (original_name, normalized_cut_id, confidence_score, source) VALUES
-- אנטריקוט variations
('אנטרקוט', 1, 0.95, 'automatic'),
('אנטריקוט בקר', 1, 0.90, 'automatic'),
('אנטריקוט עם עצם', 1, 0.85, 'automatic'),
('אנטריקוט ללא עצם', 1, 0.85, 'automatic'),
('אנטרקוט בלק אנגוס', 1, 0.80, 'automatic'),

-- פילה בקר variations  
('פילה', 2, 0.85, 'automatic'),
('פילה מדומה', 2, 0.70, 'automatic'),
('פאלש פילה', 2, 0.65, 'automatic'),
('false fillet', 2, 0.60, 'automatic'),

-- חזה עוף variations
('חזה עוף ללא עור', 7, 0.95, 'automatic'),
('חזה עוף ללא עצם', 7, 0.90, 'automatic'),
('פילה עוף', 7, 0.85, 'automatic'),
('גרמיליה עוף', 7, 0.80, 'automatic'),

-- שוק עוף variations
('שוק עוף עליון', 8, 0.90, 'automatic'),
('שוק עוף תחתון', 8, 0.90, 'automatic'),
('שוקיים עוף', 8, 0.95, 'automatic'),

-- בשר טחון variations
('בקר טחון רזה', 6, 0.90, 'automatic'),
('בקר טחון שמן', 6, 0.90, 'automatic'),
('בקר טחון 80%', 6, 0.85, 'automatic'),
('בקר טחון 90%', 6, 0.85, 'automatic');

-- Add statistics view for monitoring
CREATE VIEW cuts_normalization_stats AS
SELECT 
  nc.category,
  COUNT(nc.id) as normalized_cuts_count,
  COUNT(cv.id) as variations_count,
  AVG(cv.confidence_score) as avg_confidence,
  COUNT(CASE WHEN cv.verified = true THEN 1 END) as verified_variations
FROM normalized_cuts nc
LEFT JOIN cut_variations cv ON nc.id = cv.normalized_cut_id
GROUP BY nc.category
ORDER BY nc.category;

COMMENT ON TABLE normalized_cuts IS 'Standardized meat cuts with categories and properties';
COMMENT ON TABLE cut_variations IS 'Maps various cut name variations to normalized cuts';
COMMENT ON VIEW cuts_normalization_stats IS 'Statistics about cuts normalization progress';