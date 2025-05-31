-- Migration 009: Create meat names mapping system
-- This migration creates tables for normalized meat categories and name variants

-- Create normalized categories table
CREATE TABLE IF NOT EXISTS normalized_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  hebrew_name VARCHAR(200) NOT NULL,
  animal_type VARCHAR(50),              -- בקר, עוף, כבש וכו'
  body_part VARCHAR(50),                -- חזה, כתף, צוואר וכו'
  cut_style VARCHAR(50),                -- מלא, טחון, פרוס וכו'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create product name variants table
CREATE TABLE IF NOT EXISTS product_name_variants (
  id SERIAL PRIMARY KEY,
  normalized_name VARCHAR(200) NOT NULL,  -- השם הנורמלי מהקובץ
  variant_name VARCHAR(200) NOT NULL,     -- השם הוריאנט
  source VARCHAR(100),                    -- מקור השם (רשת, אזור וכו')
  confidence_score DECIMAL(3,2) DEFAULT 1.0, -- רמת ביטחון במיפוי
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(normalized_name, variant_name),
  FOREIGN KEY (normalized_name) REFERENCES normalized_categories(name) ON DELETE CASCADE
);

-- Create indexes for fast search
CREATE INDEX IF NOT EXISTS idx_normalized_categories_name ON normalized_categories(name);
CREATE INDEX IF NOT EXISTS idx_normalized_categories_hebrew ON normalized_categories(hebrew_name);
CREATE INDEX IF NOT EXISTS idx_normalized_categories_animal ON normalized_categories(animal_type);
CREATE INDEX IF NOT EXISTS idx_normalized_categories_body_part ON normalized_categories(body_part);

CREATE INDEX IF NOT EXISTS idx_product_variants_normalized ON product_name_variants(normalized_name);
CREATE INDEX IF NOT EXISTS idx_product_variants_variant ON product_name_variants(variant_name);
CREATE INDEX IF NOT EXISTS idx_product_variants_confidence ON product_name_variants(confidence_score DESC);

-- Full-text search indexes (using default text search config since hebrew may not be available)
CREATE INDEX IF NOT EXISTS idx_product_variants_search_text ON product_name_variants 
  USING gin(to_tsvector('simple', variant_name));
CREATE INDEX IF NOT EXISTS idx_normalized_categories_search_text ON normalized_categories 
  USING gin(to_tsvector('simple', hebrew_name));

-- Insert normalized meat categories
INSERT INTO normalized_categories (name, hebrew_name, animal_type, body_part, cut_style, description) VALUES
('אונטריב בקר', 'אונטריב בקר', 'בקר', 'צלעות', 'עם עצם', 'צלעות בקר לבישול איטי'),
('אוסבוקו בקר', 'אוסבוקו בקר', 'בקר', 'זרוע', 'פרוס', 'פרוסות זרוע עם עצם'),
('אוסבוקו חזיר', 'אוסבוקו חזיר', 'חזיר', 'זרוע', 'פרוס', 'פרוסות זרוע חזיר'),
('אנטריקוט בקר', 'אנטריקוט בקר', 'בקר', 'גב', 'סטייק', 'נתח פרימיום לגריל'),
('אסאדו בקר', 'אסאדו בקר', 'בקר', 'צלעות', 'עם עצם', 'צלעות קצרות למנגל'),
('אצבעות אנטריקוט בקר', 'אצבעות אנטריקוט', 'בקר', 'גב', 'פרוס', 'פרוסות אנטריקוט'),
('אשכים טלה', 'אשכי טלה', 'טלה', 'איברים', 'שלם', 'איבר זכרי'),
('בריסקט בקר', 'חזה בקר', 'בקר', 'חזה', 'שלם', 'חזה בקר לעישון ובישול איטי'),
('דנוור בקר', 'דנוור בקר', 'בקר', 'כתף', 'סטייק', 'נתח כתף מיוחד'),
('ואסיו בקר', 'ואסיו בקר', 'בקר', 'בטן', 'שלם', 'נתח בטן דק'),
('וייסבראטן בקר', 'וייסבראטן', 'בקר', 'כתף', 'צלי', 'כתף בקר לצלי'),
('זנב שור בקר', 'זנב בקר', 'בקר', 'זנב', 'פרוס', 'זנב בקר פרוס'),
('חזה אווז קפוא', 'חזה אווז', 'אווז', 'חזה', 'שלם', 'חזה אווז קפוא'),
('חזה הודו', 'חזה הודו', 'הודו', 'חזה', 'שלם', 'חזה הודו טרי'),
('חזה עוף', 'חזה עוף', 'עוף', 'חזה', 'שלם', 'חזה עוף טרי'),
('חזה עם עצם בקר', 'חזה עם עצם', 'בקר', 'חזה', 'עם עצם', 'חזה בקר עם עצם'),
('חטיפי אסאדו בקר', 'חטיפי אסאדו', 'בקר', 'צלעות', 'חתוך', 'חתיכות אסאדו קטנות'),
('טחון בקר', 'בשר טחון בקר', 'בקר', 'מעורב', 'טחון', 'בשר בקר טחון'),
('טיבון טלה', 'טיבון טלה', 'טלה', 'גב', 'עם עצם', 'אוכף טלה עם עצם'),
('כבד עוף', 'כבד עוף', 'עוף', 'איברים', 'שלם', 'כבד עוף טרי'),
('כתף 5 בקר', 'כתף בקר', 'בקר', 'כתף', 'צלי', 'כתף בקר מספר 5'),
('כתף טלה', 'כתף טלה', 'טלה', 'כתף', 'שלם', 'כתף טלה שלמה'),
('כתף מרכזי 4 בקר', 'כתף מרכזי', 'בקר', 'כתף', 'מרכזי', 'כתף מרכזי מספר 4'),
('לחי בקר', 'לחי בקר', 'בקר', 'ראש', 'שלם', 'בשר לחי ראש'),
('ליה טלה', 'שומן טלה', 'טלה', 'שומן', 'חתוך', 'שומן אליה'),
('לשון בקר', 'לשון בקר', 'בקר', 'איברים', 'שלם', 'לשון בקר טרי'),
('מוח בקר', 'מוח בקר', 'בקר', 'איברים', 'שלם', 'מוח בקר טרי'),
('מכסה אנטריקוט בקר', 'מכסה אנטריקוט', 'בקר', 'גב', 'מכסה', 'מכסה האנטריקוט'),
('ניו יורק סטייק בקר', 'ניו יורק סטייק', 'בקר', 'גב', 'סטייק', 'סטייק ניו יורק'),
('נתח קצבים דק בקר', 'נתח קצבים דק', 'בקר', 'בטן', 'דק', 'נתח קצבים דק'),
('נתח קצבים עבה בקר', 'נתח קצבים עבה', 'בקר', 'בטן', 'עבה', 'נתח קצבים עבה'),
('סינטה בקר', 'סינטה בקר', 'בקר', 'גב', 'סטייק', 'סטייק סינטה'),
('סינטה חזיר', 'סינטה חזיר', 'חזיר', 'גב', 'סטייק', 'סינטה חזיר טרי'),
('סלמון קפוא דגים', 'פילה סלמון', 'דגים', 'פילה', 'קפוא', 'פילה סלמון קפוא'),
('ספריבס טלה', 'ספריבס טלה', 'טלה', 'חזה', 'עם עצם', 'חזה טלה עם עצם'),
('ספריבס/ברוסט חזיר', 'ספריבס חזיר', 'חזיר', 'חזה', 'עם עצם', 'חזה חזיר עם עצם'),
('פולקה חזיר', 'פולקה חזיר', 'חזיר', 'ירך', 'שלם', 'ירך חזיר אחורית'),
('פילה בקר', 'פילה בקר', 'בקר', 'גב', 'פילה', 'פילה בקר נתח פרימיום'),
('פילה חזיר', 'פילה חזיר', 'חזיר', 'גב', 'פילה', 'פילה חזיר טרי'),
('פילה מדומה בקר', 'פילה מדומה', 'בקר', 'כתף', 'צלי', 'פילה מדומה מכתף'),
('פיקניה בקר', 'פיקניה', 'בקר', 'כתף', 'טריפ', 'שפיץ צ''אך פיקניה'),
('פלאנק בקר', 'פלאנק בקר', 'בקר', 'בטן', 'דק', 'נתח בטן פלאנק'),
('פרגיות עוף', 'פרגיות עוף', 'עוף', 'ירך', 'שלם', 'ירכי עוף טריות'),
('פריים ריב בקר', 'פריים ריב', 'בקר', 'צלעות', 'עם עצם', 'אנטריקוט עם עצם'),
('צוואר חזיר', 'צוואר חזיר', 'חזיר', 'צוואר', 'שלם', 'צוואר חזיר טרי'),
('צוואר טלה', 'צוואר טלה', 'טלה', 'צוואר', 'שלם', 'צוואר טלה לתבשיל'),
('שווארמה הודו', 'שווארמה הודו', 'הודו', 'מעורב', 'פרוס', 'פרוסות הודו לשווארמה'),
('שולטר חזיר', 'שולטר חזיר', 'חזיר', 'כתף', 'שלם', 'כתף חזיר שלמה'),
('שוק אווז קפוא', 'שוק אווז', 'אווז', 'שוק', 'קפוא', 'שוק אווז קפוא'),
('שוק טלה', 'שוק טלה', 'טלה', 'שוק', 'שלם', 'שוק טלה אחורי'),
('שייטל בקר', 'שייטל בקר', 'בקר', 'גב', 'רוטפלש', 'נתח שייטל איכותי'),
('שפיץ שייטל בקר', 'שפיץ שייטל', 'בקר', 'גב', 'טרי טיפ', 'שפיץ שייטל טרי טיפ'),
('שקדים בקר', 'שקדי בקר', 'בקר', 'איברים', 'שלם', 'שקדי בקר טריים'),
('שריר מס 8 בקר', 'שריר זרוע', 'בקר', 'זרוע', 'שלם', 'שריר זרוע מספר 8')
ON CONFLICT (name) DO NOTHING;

-- Now insert all the product name variants
-- אונטריב בקר variants
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES
('אונטריב בקר', 'אונטריב - צלעות', 1.0),
('אונטריב בקר', 'צלעות בקר', 0.9),
('אונטריב בקר', 'צלעות דרום אמריקה - בשר מס'' 2 - צרכני', 0.8),
('אונטריב בקר', 'צלעות "אנגוס" - בשר מס'' 2', 0.8),
('אונטריב בקר', 'צלעות בקר 2 פידלוט', 0.8),
('אונטריב בקר', 'צלעות דרום אמריקה - בשר מס'' 2', 0.8),
('אונטריב בקר', 'צלעות בקר טרי א', 0.9),
('אונטריב בקר', 'צלעות/אונטריב', 1.0),
('אונטריב בקר', 'אונטר ריב', 1.0),
('אונטריב בקר', 'צלעות עגל טרי', 0.8),
('אונטריב בקר', 'צלעות "אנגוס" - בשר מס'' 2 - צרכני', 0.8),
('אונטריב בקר', 'צלעות (אונטריב) על עצם', 1.0),
('אונטריב בקר', 'נתח אונטריב בקר טרי', 1.0),
('אונטריב בקר', 'צלעות/צוואר/אסדו ואגיו', 0.7),
('אונטריב בקר', 'צלעות עגל חלב מקוצבות', 0.8),
('אונטריב בקר', 'צלעות בקר לבישול\\טחי', 0.9),
('אונטריב בקר', 'צלעות', 0.8),
('אונטריב בקר', 'צלעות (אונטריב) ללא עצם', 1.0),
('אונטריב בקר', 'אונטריב בקר טרי', 1.0),
('אונטריב בקר', 'צלעות בקר טרי', 0.9),
('אונטריב בקר', 'אונטריב טרי (עם עצם)', 1.0),
('אונטריב בקר', 'צלעות עגלה קוביות', 0.8),
('אונטריב בקר', 'צלעות בקר טרי מוכשר יבוא לפי משקל', 0.9),
('אונטריב בקר', 'בשר מס 2 – צלעות בקר', 0.8),
('אונטריב בקר', 'אונטריב מיושן', 1.0),
('אונטריב בקר', 'צלעות צוואר עגל טרי מוכשר אדום אדום לפי מ...', 0.7),
('אונטריב בקר', 'אונטריב אנגוס', 1.0),
('אונטריב בקר', 'אונטריב טרי (ללא עצם)', 1.0),
('אונטריב בקר', 'צלעות/צוואר/אסדו טרי "חי בריא"', 0.7),
('אונטריב בקר', 'קיט צוואר צלעות טרי בד"צ חלק מחפוד אדום אדום...', 0.7),
('אונטריב בקר', 'כתף בקר/צ''ך/צלעות ללא עצם טרי', 0.7),
('אונטריב בקר', 'צלעות בקר אונטריב 2', 1.0),
('אונטריב בקר', 'צלעות, נתח מס'' 2 Wagyu', 0.8),
('אונטריב בקר', 'אונטריב, צלעות נתח מס'' 2 Angus feedlot', 1.0)
ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Continue with all other categories... (truncated for brevity, but the script would include all entries)-- Generated SQL INSERT statements for product_name_variants
-- Source: meat_names_mapping.json

-- Variants for: אונטריב בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'אונטריב - צלעות', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות בקר', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות דרום אמריקה - בשר מס'' 2 - צרכני', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות "אנגוס" - בשר מס'' 2', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות בקר 2 פידלוט', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות דרום אמריקה - בשר מס'' 2', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות בקר טרי א', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות/אונטריב', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'אונטר ריב', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות עגל טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות "אנגוס" - בשר מס'' 2 - צרכני', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות (אונטריב) על עצם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'נתח אונטריב בקר טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות/צוואר/אסדו ואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות עגל חלב מקוצבות', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות בקר לבישול\טחי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות (אונטריב) ללא עצם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'אונטריב בקר טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות בקר טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'אונטריב טרי (עם עצם)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות עגלה קוביות', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות בקר טרי מוכשר יבוא לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'בשר מס 2 – צלעות בקר', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'אונטריב מיושן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות צוואר עגל טרי מוכשר אדום אדום לפי מ...', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'אונטריב אנגוס', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'אונטריב טרי (ללא עצם)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות/צוואר/אסדו טרי "חי בריא"', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'קיט צוואר צלעות טרי בד"צ חלק מחפוד אדום אדום...', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'כתף בקר/צ''ך/צלעות ללא עצם טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות בקר אונטריב 2', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'צלעות, נתח מס'' 2 Wagyu', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אונטריב בקר', 'אונטריב, צלעות נתח מס'' 2 Angus feedlot', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: אוסבוקו בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו בקר', 'אוסובוקו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו בקר', 'שריר זרוע-אוסובוקו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו בקר', 'אוסובוקו עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו בקר', 'אוסובוקו ואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו בקר', 'אוסובוקו טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו בקר', 'אוסובוקו בקר טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו בקר', 'אוסובוקו עגלה פרוס', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו בקר', 'אוסובוקו עגל טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו בקר', 'אוסובוקו עגל טרי חלק אדום אדום לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו בקר', 'אוסובוקו עגל פרוס', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו בקר', 'אוסובוקו עגל חלב טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו בקר', 'אוסובוקו טרי "חי בריא"', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו בקר', 'אוסובוקה עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו בקר', 'אוסובוקו וואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו בקר', 'אוסובוקו עגל, נתח מס'' 8 פרוס', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: אוסבוקו חזיר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו חזיר', 'אוסובוקו לבן טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אוסבוקו חזיר', 'אוסובוקו לבן', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: אנטריקוט בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטרקוט אנגוס', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט טרי/מיושן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטריקוט', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט מבכירה ישראלי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטרקוט בלק אנגוס', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט עגל', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט עגלה טרי מהגליל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט ישראלי מיושן על העצם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'רוסטביף מאנטריקוט טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט טרי ללא עצם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט וילה מרצדס', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט פידלוט מיושן פרמיום', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט עגלה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטריקוט ברזיל', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'שישליק אנטריקוט', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטריקוט ואגיו מקורי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט נברסקה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט מבכירה טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטרקוט', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט עגל בד"צ חלק מחפוד טרי אדום אדום ל...', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'משמר הכבוד אנטריקוט', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט עגלה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט עגלה טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'רוסטביף אנטריקוט', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטרקוט אורוגוואי גדול', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט אנגוס', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטריקוט מיושן חלק במשקל נטו לפי מש...', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטריקוט טרי א', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט "אנגוס" - בשר מס'' 1', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט דרום אמריקה - בשר מס'' 1', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'נקנקיות אנטריקוט', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט בקר', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטריקוט נברסקה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטרקוט הולשטיין', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטריקוט אנגוס טרי מהגליל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטריקוט טרי ב', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט פרימיום', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטריקוט פרוס – ארגנטינה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט בלי עצם', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטריקוט פידלוט', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט ביישון יבש ללא עצם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט מובחר טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט למוזין מובחר', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט מתובל לרוסטביף', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט מיושן', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטרקוט ברשת  – ארגנטינה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט עגל חלב טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטריקוט טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטריקוט עגל כשר טרי מוכשר אדום אדום ל...', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט אנגוס מיושן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטרקוט עגל ישראלי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט עגל פרוס', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטרקוט מבכירה  ישראלי (ניתן לקבל גם אנט עגל פחות שמן )', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטרקוט אורגוואי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט מבכירה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט רמת הגולן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט עגל טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט טרי מוכשר יבוא לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'מגה בורגר אנטריקוט', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', '1 ק"ג אנטריקוט עגלה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט נברסקה על העצם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטריקוט, 4 יח'' בוואקום Angus feedlot', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט נברסקה בלי עצם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט בלאק אנגוס', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', '1 ק"ג אנטריקוט בלאק אנגוס', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט, נתח מס'' 1 Angus feedlot', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'סטייק אנטריקוט, 2 יח'' בוואקום Angus feedlot', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אנטריקוט בקר', 'אנטריקוט, נתח מס'' 1 Wagyu', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: אסאדו בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו בקר טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'קשתית שפונדרה "אנגוס" - בשר מס'' 3a - צרכני', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'שפונדרה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו טרי חלק ארוז אדום אדום לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסדו עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'קשתית שפונדרה "אנגוס" - בשר מס'' 9', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו עגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'שפונדרה בקר טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו עצם שפונדרה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו בקר טרי א', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'חזה אסאדו טרי מוכשר אדום אדום לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'קשתית אסאדו', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'שפונדרה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'קשתית', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו עגל טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו עגלה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו עם עצם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו עגל חלק מחפוד טרי אדום אדום לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'קשתית שפונדרה דרום אמריקה - בשר מס'' 9', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'קשתית שפונדרה דרום אמריקה - בשר מס'' 9 - צרכני', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'נקניקיות אסאדו', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו בקר', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'צלעות/צוואר/אסדו ואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'קשתית אנונימה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו/שפונדרה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו עם עצם מבצע 2 קג', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'צוואר\אסדו עם עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו טרי ארוז מוכשר אדום אדום לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו (קשתית)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו עגל עם עצם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסדו נברסקה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו עגל עם עצם טרי ישראל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו טרי מוכשר אדום אדום לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו לתנור או לבישול', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'צלעות/צוואר/אסדו טרי "חי בריא"', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'חזה אסאדו טרי חלק מחפוד אדום אדום לפי מ...', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו בקר דרום אמריקאי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'קשתית/אסאדו', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', '2 ק"ג אסאדו נברסקה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסדו עגלה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'אסאדו נתח שורט ריב מקוצב', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אסאדו בקר', 'נתח אסאדו וואגיו', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: אצבעות אנטריקוט בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אצבעות אנטריקוט בקר', 'אצבעות אנטריקוט', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אצבעות אנטריקוט בקר', 'אצבעות אנטריקוט - מוכשר - דרום אמריקה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אצבעות אנטריקוט בקר', 'אצבעות אנטריקוט  מיועד לצלייה איטית', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: אשכים טלה
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('אשכים טלה', 'אשכי טלה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: בריסקט בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה עגל טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'בריסקט טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'בריסקט חזה "אנגוס" - בשר מס'' 3 - מוכשר', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה אסאדו טרי מוכשר אדום אדום לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה דרום אמריקה - בשר מס'' 3', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'בריסקט חזה "אנגוס" - בשר מס'' 3 - צרכני - מוכשר', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה בקר', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה דרום אמריקה - בשר מס'' 3 - צרכני', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה בקר טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה/בריסקט', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה בקר 3', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'בריסקט עגל רמת הגולן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה פרוס לגריל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה מולארד', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'בריסקט קורנביף ג.ת.', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה/בריסקט 3 פידלוט', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה בקר ואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה בקר', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה עגל  שלם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'בריסקט עגל טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה בקר טרי א', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'בשר מס 3 בריסקט', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה בקר (בריסקט)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה אסאדו טרי חלק מחפוד אדום אדום לפי מ...', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'בריסקט (חזה בקר)', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה עגלה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'בריסקט בדבש וסויה      (1.5 ק”ג מינימום)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה בריסקט , נתח מס'' 3  Angus feedlot', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'בריסקט/שייטל וואגיו מעושן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה בקר בריסקט 3', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('בריסקט בקר', 'חזה בריסקט, נתח מס'' 3 Wagyu', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: דנוור בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'דנבר מיושן', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'דנוור עגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'צלעות דנבר ווגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'צלעות בקר - דנוור-קאט', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'צלעות דנוור קאט', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'צלעות דנבר קאט', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'דנוור קאט עגלה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'דנבר סטייק', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'סטייק דנוור', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'דנוור', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'דנבר קאט', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'סטייק דנוור קאט טרי מהגליל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'דנוור מיושן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'דנבר קאט וואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'דנבר קאט עגלה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'דנבר קאט פרמיום', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', '1 ק"ג דנבר קאט וואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('דנוור בקר', 'דנוור שלם, צלעות נתח מס'' 2 Angus feedlot', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: ואסיו בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ואסיו בקר', 'וסיו או פלנק סטייק', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ואסיו בקר', 'וסיו/ פלנק סטייק', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ואסיו בקר', 'וואסיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ואסיו בקר', 'ווסיו אנגוס', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ואסיו בקר', 'ואסיו טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ואסיו בקר', 'וואסיו/פלאנק מיושן', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ואסיו בקר', 'וסיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ואסיו בקר', 'וסיו וואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: וייסבראטן בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('וייסבראטן בקר', 'וייסבראטן עגל טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('וייסבראטן בקר', 'כף /כתף/וייזברט/צך/אגוז וואגיו מעושן', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('וייסבראטן בקר', 'וייסבראטן', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('וייסבראטן בקר', 'וויסברטן', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('וייסבראטן בקר', 'וייסברטן', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('וייסבראטן בקר', 'וויסבראטן בקר טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('וייסבראטן בקר', 'ויסברטן בקר/עגל טרי שקיל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('וייסבראטן בקר', 'וייסבראטן (19) טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('וייסבראטן בקר', 'ויסבראטן', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('וייסבראטן בקר', 'ויסברטן עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('וייסבראטן בקר', 'וייזברט וואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('וייסבראטן בקר', 'וייזברט עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('וייסבראטן בקר', 'וייסבראטן, נתח מס'' 19 טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: זנב שור בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('זנב שור בקר', 'זנב', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('זנב שור בקר', 'זנב בקר טרי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('זנב שור בקר', 'זנב עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('זנב שור בקר', 'זנב עגל טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('זנב שור בקר', 'זנב עגלה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('זנב שור בקר', 'זנב עגל, נתח מס'' 23 פרוס', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: חזה אווז קפוא
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה אווז קפוא', 'חזה אווז', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה אווז קפוא', 'חזה אווז שקיל', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה אווז קפוא', 'חזה אווז פרימיום', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה אווז קפוא', 'חזה אווז מיושן', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה אווז קפוא', 'חזה אווז (מולרד)', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה אווז קפוא', 'חזה אווז', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: חזה הודו
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו טרי שקיל מבצע', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו נקבה טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו שלם', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו טרי(פרפר)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו נקבה טרי ארוז לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו נקבה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו נקבה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו פרוס', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'שניצל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'טחון חזה הודו', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו טחון', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו מובחר נקבה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'טחון חזה הודו טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו נקבה טרי מחפוד ארוז לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו זכר', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו טרי טחון', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו קוביות', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה הודו', 'חזה הודו טחון נקבה טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: חזה עוף
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף חצוי בלי פילה טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף שלם chicken breast', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף שלם', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה אסאדו טרי מוכשר אדום אדום לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף בתיבול גריל 3% שומן מאמא עוף', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף פרימיום', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף פרוס לגריל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף טחון', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'טחון חזה עוף', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף טרי ארוז נתח רובין', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף טרי מחפוד ארוז לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה טרי ארוז מחפוד', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה פרוס לגריל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף בלוטין', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף חצוי ללא אנטיביוטיקה והורמונים', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה מולארד', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף טרי ללא אנטיביוטיקה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף פרוס טרי(שניצל) שקיל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף חצוי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף פרוס', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה חצוי נקי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף טחון במבצע', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף טחון טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף טחון נקי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף פרוס', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'שניצל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף (חצוי) טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף פרוס עבה לגריל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה שלם טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עם עצם חלק אדום אדום לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף שלם טרי ארוז לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'שניצל חזה עוף פרוס טרי ארוז לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף פרוס טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'פילה חזה עוף', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'שניצל חזה עוף פרוס טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה אסאדו טרי חלק מחפוד אדום אדום לפי מ...', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף שלם מבצע! 2 קג-ב50', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף פרפר שלם טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף פרוס לשניצל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף שלם עם עצם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף שלם טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', '3 ק"ג חזה עוף פרוס', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף נקי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף פרוס נקי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עוף', 'חזה עוף שלם, ללא אנטיביוטיקה טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: חזה עם עצם בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עם עצם בקר', 'חזה בקר עם עצם טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עם עצם בקר', 'חזה בקר טרי עם עצם כשר אדום אדום לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עם עצם בקר', 'חזה עם עצם חלק אדום אדום לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עם עצם בקר', 'חזה עגל עם עצם', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עם עצם בקר', 'חזה עוף שלם עם עצם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עם עצם בקר', 'חזה עגל טרי עם עצם "חי בריא"', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חזה עם עצם בקר', 'חזה עגל עם עצם', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: חטיפי אסאדו בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חטיפי אסאדו בקר', 'חטיפי אסאדו', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חטיפי אסאדו בקר', 'חטיפי אסאדו בלי עצם', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חטיפי אסאדו בקר', 'נשנושי אסאדו', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חטיפי אסאדו בקר', 'נשנושי אסאדו (כולל עצם)', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חטיפי אסאדו בקר', 'חטיפי אסדו וואגיו טרי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חטיפי אסאדו בקר', 'נשנושי אסאדו ANGUS FEEDLOT', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('חטיפי אסאדו בקר', 'חטיפי אסאדו עגל, נתח מס'' 9 Angus feedlot', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: טחון בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בשר בקר טחון טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בשר בקר טחון', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'טחון שווארמה טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'טחון בקר', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'שומן בקר טחון', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בשר עגל טחון', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בקר אנגוס טחון מובחר', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'עגל טחון מיוחד', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'טחון בקר טרי דל שומן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בשר טחון עגל טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בקר טחון', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'מכסה אנטריקוט טחון', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בשר טחון', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'טחון פרגית טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'טחון בקר טרי ישראלי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'עגל טחון-מבשר טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'טחון טרי וואגיו', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בקר טחון  + שומן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בשר טחון פרימיום טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'טחון פרגיות', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בשר טחון במבצע', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בשר טחון טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בשר בקר רזה טחון', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'טחון עגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'טחון וואגיו', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'פרגית טחון', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'מבצע !!! בשר בקר טחון', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'טחון אנגוס', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בשר בקר טחון 100%', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'עגל טחון טרי מבצע! 2 ק״ג ב-120', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'עגל טחון טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בשר בקר טחון – 3 ק״ג מבצע', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'מבצע עגל טחון טרי 2 ב-120', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בקר טחון טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'טחון בקר מטרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'טחון בקר Xטרה שומן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'טחון בקר דל שומן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'טחון טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טחון בקר', 'בשר טחון בקר טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: טיבון טלה
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טיבון טלה', 'אוכף טלה / T-bone טלה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טיבון טלה', 'טיבון טלה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טיבון טלה', 'טיבון כבש', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טיבון טלה', 'אוכף טלה ללא עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טיבון טלה', 'אוכף טלה פרוס', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טיבון טלה', 'אוכף טלה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טיבון טלה', 'אוכף (טיבון) טלה טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טיבון טלה', 'סטייק טיבון כבש', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('טיבון טלה', 'צלעות טיבון כבש בלדי טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: כבד עוף
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כבד עוף', 'כבד עוף', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כבד עוף', 'כבד עוף', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כבד עוף', 'כבד עוף טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כבד עוף', 'כבד עוף ארוז שקיל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כבד עוף', 'כבד עוף Chicken Liver', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כבד עוף', 'כבד עוף טרי לצלייה בלבד', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כבד עוף', 'כבד עוף ללא אנטיביוטיקה והורמונים', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כבד עוף', 'כבד עוף טרי מחפוד ארוז לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כבד עוף', 'כבד עוף מבצע! 2 ק״ג ב-50 ש״ח', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כבד עוף', 'כבד עוף צלוי טרי מחפוד', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כבד עוף', 'כבד עוף טרי ללא אנטיביוטיקה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כבד עוף', 'כבד עוף טרי ארוז לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כבד עוף', 'כבד עוף טרי ארוז', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: כתף 5 בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף ואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף 5 פידלוט', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף עגל עם עצם טרי חלק אדום אדום לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף פולקה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף טרי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף אנגוס', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף (מס 5) טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף בקר טרי מחפוד', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף מיושן', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'בשר מס 5 – צלי בקר', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף "אנגוס" מוכשר - בשר מס'' 5', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף בקר', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף עגל טרי כשר ללא עצם אדום אדום לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף בקר טרי א', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף בקר מס 5', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף טרי חלק מחפוד אדום אדום לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף טרי ארוז מוכשר אדום אדום לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף טרי "חי בריא"', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף בקר טרי/פולייקה (נתח מס'' 5)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף וואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף 5', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף בקר טרי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף בקר טרי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף עם עצם אדום אדום', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף פלטה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף טרי מוכשר אדום אדום לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף טרי ארוז חלק אדום אדום לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף עגל מס 5', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף מס'' 5', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף טרי ואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי מס'' 5', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף טרי ארוז חלק אדום אדום לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף בקר/צ''ך/צלעות ללא עצם טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף 5 עגל חלב טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף עגל טרי עם עצם מוכשר אדום אדום לפי מ...', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף עגל טרי חלק ללא עצם אדום אדום לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף טרי ארוז מוכשר אדום אדום לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף עגל', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף מס 5 מוכשר ש', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף (מס 5)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף (מס.5) עגל טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף עגל טרי "חי בריא"', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי בקר מספר 5', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'כתף עגלה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף וואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף, נתח מס'' 5 טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף בקר 5', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'צלי כתף עגל טרי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף 5 בקר', 'איירון נתח מס'' 5  Wagyu', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: כתף טלה
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף טלה', 'כתף טלה עם עצם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף טלה', 'כתף כבש', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף טלה', 'כתף טלה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף טלה', 'כתף טלה טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף טלה', 'כתף כבש טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף טלה', 'כתף טלה פרוס', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף טלה', 'כתף טלה שלם', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף טלה', 'כתף כבש בלדי טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף טלה', 'כתף טלה (נתח שלם) טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: כתף מרכזי 4 בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף מרכזי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף עגל מספר 4', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף מרכזית (מס.4) עגל טרי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף מרכזי ווגיו', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף מרכזית מיושן', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף מרכזי 4', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף מרכזי דרום אמריקה - בשר מס'' 4 - צרכני', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף מרכזית טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף בקר מרכזי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף בקר 4 פידלוט', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף מרכזית', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'בשר בקר צלי כתף עגל מס'' 4', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף מרכזי טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף בקר מס'' 4 טרי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף בקר טרי (נתח מס'' 4)', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף בקר מרכזי טרי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף מרכזי וואגיו', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף מרכזי מספר 4', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף 4 עגל חלב טרי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף מרכזי עגל טרי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף מרכזית, נתח מס'' 4 טרי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('כתף מרכזי 4 בקר', 'כתף, נתח מס'' 4 Wagyu', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: לחי בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לחי בקר', 'בשר ראש', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לחי בקר', 'לחי ראש', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לחי בקר', 'לחי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לחי בקר', 'בשר ראש טרי נקי בלי שומן', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לחי בקר', 'בשר ראש עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לחי בקר', 'בשר ראש עגל נקי מובחר', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לחי בקר', 'לחי עגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לחי בקר', 'בשר ראש/לחי בקר', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: ליה טלה
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ליה טלה', 'שומן טלה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ליה טלה', 'שומן טלה לטחינה שקיל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ליה טלה', 'ליה טלה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ליה טלה', 'ליה ( שומן כבש )', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ליה טלה', 'שומן ליה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ליה טלה', 'שומן אליה -כבש או טלה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ליה טלה', 'שומן כבש טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ליה טלה', 'שומן טלה קוביות', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ליה טלה', 'שומן כבש אמיתי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ליה טלה', 'שומן טלה (ליה)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ליה טלה', 'שומן כבש - ליה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ליה טלה', 'שומן ליה-טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ליה טלה', 'לייה כבש', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ליה טלה', 'שומן כבש (ליה)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ליה טלה', 'שומן כבש', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: לשון בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לשון בקר', 'לשון עגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לשון בקר', 'לשון', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לשון בקר', 'לשון בקר "אנגוס"', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לשון בקר', 'לשון בקר טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לשון בקר', 'לשון בקר', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לשון בקר', 'לשון עגל טרי א', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לשון בקר', 'לשון פרה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לשון בקר', 'לשון עגלה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לשון בקר', 'לשון עגל טריה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('לשון בקר', 'לשון עגל טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: מוח בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('מוח בקר', 'מוח עגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('מוח בקר', 'מוח בקר דרום אמריקה - לא מוכשר', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('מוח בקר', 'מוח עגל נקי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('מוח בקר', 'מוח בקר מוכשר שקיל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('מוח בקר', 'מוח בקר', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('מוח בקר', 'מוח עגלה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('מוח בקר', 'מוח עגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: מכסה אנטריקוט בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('מכסה אנטריקוט בקר', 'מכסה אנטריקוט פידלוט', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('מכסה אנטריקוט בקר', 'מכסה אנטריקוט טחון', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('מכסה אנטריקוט בקר', 'מכסה אנטריקוט', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('מכסה אנטריקוט בקר', 'מכסה אנטריקוט מיושן', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('מכסה אנטריקוט בקר', 'מכסה אנטריקוט נברסקה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('מכסה אנטריקוט בקר', 'מכסה אנטריקוט וואגיו', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('מכסה אנטריקוט בקר', 'מכסה הסטייק, נתח מס'' 7 Wagyu', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: ניו יורק סטייק בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ניו יורק סטייק בקר', 'ניו יורק וואגיו', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ניו יורק סטייק בקר', 'סטייק ניו יורק', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ניו יורק סטייק בקר', 'ניו יורק קאט', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ניו יורק סטייק בקר', 'ניו יורק וואגיו מיושן', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ניו יורק סטייק בקר', 'ניויורק סטייק', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ניו יורק סטייק בקר', 'סטייק ניו-יורק טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ניו יורק סטייק בקר', 'ניו יורק אנגוס', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: נתח קצבים דק בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים דק בקר', 'נתח קצבים אונגלה', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים דק בקר', 'נתח קצבים', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים דק בקר', 'נתח קצבים סקרט', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים דק בקר', 'נתח קצבים וואגיו', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים דק בקר', 'נתח קצבים שלם', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים דק בקר', 'נתח קצבים עבה', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים דק בקר', 'נתח קצבים (רוטפלאש) עבה', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים דק בקר', 'נתח קצבים', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים דק בקר', '1 ק"ג נתח קצבים', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים דק בקר', 'סטייק קצבים פיטום Angus feedlot', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: נתח קצבים עבה בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים עבה בקר', 'נתח קצבים אונגלה', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים עבה בקר', 'נתח קצבים', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים עבה בקר', 'נתח קצבים סקרט', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים עבה בקר', 'נתח קצבים וואגיו', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים עבה בקר', 'נתח קצבים שלם', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים עבה בקר', 'נתח קצבים עבה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים עבה בקר', 'נתח קצבים (רוטפלאש) עבה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים עבה בקר', 'נתח קצבים', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים עבה בקר', '1 ק"ג נתח קצבים', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('נתח קצבים עבה בקר', 'סטייק קצבים פיטום Angus feedlot', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: סינטה בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה אנגוס', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סטייק סינטה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה עגל טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה עגלה מיושנת', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה בקר טרי א', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה וואגיו', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה דרום אמריקה - מוכשר - בשר מס'' 11', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה עגל טרי בד"צ חלק מחפוד אדום אדום לפי מ...', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה בקר טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה Sirloin', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה אנגוס מיושנת', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה מבכירה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה עגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סטייק סינטה ישראלי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה עגל פרוס', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה בקר טרי מהגליל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה מובחר', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה עגלה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה מנוקרת', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סטייק סינטה עגל טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה עגלה פרמיום', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה עגל בנתח שלם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה אמיתי טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה מבכירה טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סטייק סינטה נברסקה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סטייק סינטה טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה מבכירה סירליין', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה בקר/עגל טרי שקיל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה בקר שלם', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה מבכירה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה מיושן טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', '1 ק"ג סינטה מבכירה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה נברסקה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה, נתח מס'' 11 Angus feedlot', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סטייק סינטה, נתח מס'' 11  Angus feedlot', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', '1 ק"ג סינטה עגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה עגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה, נתח מס'' 11 Wagyu', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה וואגיו', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה בקר', 'סינטה נברסקה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: סינטה חזיר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה חזיר', 'סינטה לבן טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה חזיר', 'סינטה לבן טרי מפורק', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה חזיר', 'סינטה בלי עצם לבן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סינטה חזיר', 'סינטה לבן בלי עצם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: סלמון קפוא דגים
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סלמון קפוא דגים', 'פילה סלמון שלם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סלמון קפוא דגים', 'נתח פילה סלמון', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סלמון קפוא דגים', 'פילה סלמון', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סלמון קפוא דגים', 'פילה סלמון טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סלמון קפוא דגים', 'פילה סלמון בד"ץ', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סלמון קפוא דגים', 'סטייק פילה סלמון', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סלמון קפוא דגים', 'סלמון פילה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('סלמון קפוא דגים', 'פילה סלמון  נורווגי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: ספריבס טלה
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'חזה כבש שלם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'אסאדו טלה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'חזה טלה - שפונדרה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'חזה טלה עם עצם (אסאדו)', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'חזה טלה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'ספריבס טלה מקוצב שקי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'ספירפס טלה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'חזה טלה עם עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'ספריבס טלה – מבצע 2 ק"ג', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'ספריבס טלה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'ספיריבס טלה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'אסאדו כבש טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'ספריבס טלה טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'ספריבס ,ברוסט, כבש/טלה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'אסאדו טלה לספייר ריבס', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'חזה כבש עם עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', 'חזה כבש עם עצם בלדי טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס טלה', '1 ק"ג אסאדו כבש', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: ספריבס/ברוסט חזיר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס/ברוסט חזיר', 'גרודינקה / שפיץ ברוסט עם עצם חזיר טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס/ברוסט חזיר', 'ברוסט עם עצם לחמין', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס/ברוסט חזיר', 'ספריבס חזיר טרי שקיל', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס/ברוסט חזיר', 'ספריבס לבן', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס/ברוסט חזיר', 'ספריבס לבן טרי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('ספריבס/ברוסט חזיר', 'ברוסט טרי שלם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: פולקה חזיר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פולקה חזיר', 'פולקה לבן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פולקה חזיר', 'פולקה/שוק חזיר טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פולקה חזיר', 'ירך לבן (פולקה) טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: פילה בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה מרלוזה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'סטייק פילה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה בקר טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה אמיתי בנתח שלם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה בקר', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'סטייק פילה טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה בקר ווגיו', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה בקר מוכשר', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה בקר טרי א', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה עגלה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה בקר דרום אמריקה - בשר מס'' 12', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה וואגיו', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה צוואר עגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'סטייק פילה בקר טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה מבכירה (רק ביחידות שלמות )', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה עגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה בקר – עד גמר המלאי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה בקר מיושן', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פלש פילה (מס 6)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה נקי טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה פרימיום', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה מבכירה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה בקר ישראלי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה עגלה טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה עגל טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה אמיתי עגל מיושן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה אנגוס', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה בקר-מיניון', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה סול', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה מיניון, נתח מס'' 12 Angus feedlot', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה בקר פרמיום', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה עגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה מיישון יבש', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה מיניון, נתח מס'' 12 טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה וואגיו', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה עגל שרולה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה בקר', 'פילה נתח בקר מס'' 12', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: פילה חזיר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה חזיר', 'פילה חזיר טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה חזיר', 'פילה לבן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה חזיר', 'פילה לבן טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: פילה מדומה בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה(פאלש פילה)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה (מס.6) טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה דרום אמריקה - בשר מס'' 6', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה ווגיו', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה טרי ארוז מוכשר אדום אדום לפי מ...', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה "אנגוס" - בשר מס'' 6', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה מיושן נטו לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה 6 עגל חלב טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה וואגיו', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה בקר טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה 6', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה בד"צ חלק מחפוד טרי אדום אדום ל...', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה טרי מוכשר אדום אדום לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה (פאלש פילה )', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פלש פילה (מס 6)', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה מס 6', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה - פאלש פילה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה טרי א', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה מס 6 שקיל', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה מס 6 מעגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'בשר מס 6 – פילה מדומה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה חלק ארוז טרי אדום אדום לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה 6 מוכשר', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה ואגיו', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה (6)', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה טרי "חי בריא"', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה מספר 6', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פלש פילה עגל מדומה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פילה מדומה בקר', 'פילה מדומה, נתח מס'' 6 טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: פיקניה בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'פיקניה 100% טבעי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'שפיץ צ''ך עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'שפיץ צאך/פיקניה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'שפיץ צך (פיקנייה) נמכר רק ביחידות שלמות', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'פיקניה (שפיץ צ''אק)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'פיקניה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'שפיץ צ''אך / פיקנייה טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'שפיץ צ''אך (פיקניה)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'פיקניה אנונימה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'שפיץ צך picanha', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'פיקניה אנגוס', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'שפיץ צ''אך', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'פיקניה עגלה מיושנת', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'שפיץ צ''אך/פיקנייה טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'פיקניה בנקניקיה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'שפיץ צ`אך (פיקניה) טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'פיקניה אנגוס מיושנת', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'שפיץ צ''אך עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'פיקניה עגל', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'שפיץ צך וואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', '1 ק"ג פיקניה טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'שפיץ צך', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'פיקניה עגל, נתח מס'' 15  Angus feedlot', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'פיקניה עגל, נתח מס'' 15 Wagyu', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פיקניה בקר', 'פיקניה עגל, נתח מס'' 15 טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: פלאנק בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פלאנק בקר', 'וסיו או פלנק סטייק', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פלאנק בקר', 'וסיו/ פלנק סטייק', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פלאנק בקר', 'פלאנק אנגוס', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פלאנק בקר', 'וואסיו/פלאנק מיושן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פלאנק בקר', 'פלאנק טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פלאנק בקר', 'פלאנק סטייק', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פלאנק בקר', '1 ק"ג פלאנק סטייק וואגיו', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פלאנק בקר', 'פלאנק סטייק וואגיו', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: פרגיות עוף
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'סטייק פרגית', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'סטייק פרגית ללא עור', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'סטייק פרגית 2 קג', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'שווארמה פרגיות אמיתית 5% שומן מאמא עוף', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגיות עוף טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגיות שלם/טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגיות קצר', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית עוף שווארמה ללא אנטיביוטיקה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית לתנור', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית טרי במגש ללא אנטיביוטיקה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגיות עוף טרי מחפוד ארוז לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית עוף', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'סטייק פרגית במרינדה חרדל ודבש', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגיות ארוך', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגיות', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגיות נקי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית ארוך', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'שישליק פרגיות', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'טחון פרגית טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'שווארמה (פרגית) טרי ארוז מחפוד', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית ארוך טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'מרגז פרגית לא חריף', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'סטיק פרגית קצר', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'אוסובוקו פרגית', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית  thighs', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית עוף טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'סטיק פרגית', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'טחון פרגיות', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'סטייק פרגית טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית בלי עור', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'שווארמה פרגית להקפצה – מבצע ל 2 ק"ג', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית פרימיום טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגיות צרפתי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'סטייק פרגית במרינדה צ''ילי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגיות פרוס', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית ארוכה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית קצר', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'סטייק פרגית נקי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'שווארמה פרגית', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'סטייק פרגיות', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית טחון', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'שווארמה פרגית להקפצה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית עוף קצר טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגיות טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגיות עוף טרי ארוז לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגיות סטייק (צרפתי)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגיות נקיות', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגיות עוף בלי עור', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגיות (קצר)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית שווארמה עוף בלי עור טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'שווארמה פרגית טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', '2.5 ק"ג פרגית טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית צרפתי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'סטייק פרגית עוף טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'סטייק פרגית עוף טרי ללא אנטיביוטיקה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'סטייק פרגית ללא עור עוף טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פרגיות עוף', 'פרגית ללא אנטיביוטיקה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: פריים ריב בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט מבכירה עם עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטרקוט מבכירה עם עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט עם עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט ישראלי מיושן על העצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'פריים ריב אנטריקוט עצם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'סטייק אנטריקוט עם עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט טרי ללא עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט טרי עם עצם (צלעות עגל)', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'פריים ריב (אנטריקוט על עצם)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט עגלה עם עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'נתח פריים ריב שלם 7 צלעות', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט על עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט מובחר על עצם טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט ביישון יבש עם עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט עגל עם עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'פריים ריפ אנגוס', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט פריים ריב', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'סטייק אנטריקוט עם עצם טרי ארוז מוכשר אדום א...', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'פריים מיושן', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט ביישון יבש ללא עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'צלע עגל (פריים ריב)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'סטייק עם עצם (פריים ריב)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'סטייק אנטריקוט עם עצם ארוז חלק טרי אדום אדו...', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'פריים ריב', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט בקר עם עצם טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'פריים וואגיו מיושן', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'סטייק פריים ריב', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'פריים ריב עגלה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט על עצם WAGYU', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט נברסקה על העצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט נברסקה עם עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('פריים ריב בקר', 'אנטריקוט וואגיו עם עצם', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: צוואר חזיר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('צוואר חזיר', 'צוואר לבן מפורק', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('צוואר חזיר', 'סטייק צוואר לבן טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('צוואר חזיר', 'צוואר מפורק חזיר טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('צוואר חזיר', 'צוואר לבן בלי עצם', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: צוואר טלה
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('צוואר טלה', 'צוואר כבש', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('צוואר טלה', 'צוואר טלה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('צוואר טלה', 'צוואר טלה לתנור', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('צוואר טלה', 'צוואר כבש בלדי טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('צוואר טלה', 'צוואר טלה שלם', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('צוואר טלה', 'צוואר טלה ללא עצם', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: שווארמה הודו
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו נקבה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו נקבה טרי מחפוד ארוז לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה זכר', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו נקבה חתוך לקוביות', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו להקפצה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שוארמה הודו נקבה טרי', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו קצר', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו פרוס', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו נקבה טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שוארמה הודו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו מתובל', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו נקבה ארוז טרי לפי משקל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו זכר', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה ירך הודו', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו נקבה קוביות', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו מתובלת להקפצה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו נקבה שלם', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו נקבה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'פריסת שווארמה הודו נקבה למתקן ספינר טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שווארמה הודו', 'שווארמה הודו *', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: שולטר חזיר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שולטר חזיר', 'שולטר / כתף חזיר -טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שולטר חזיר', 'שולטר לבן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: שוק אווז קפוא
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק אווז קפוא', 'שוקיים אווז', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק אווז קפוא', 'שוקיים אווז פרימיום', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק אווז קפוא', 'שוק אווז', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק אווז קפוא', 'שוק אווז', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק אווז קפוא', 'שוק אווז ללא עצם', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק אווז קפוא', 'שוק אווז מעושן', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: שוק טלה
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק טלה', 'שוק טלה', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק טלה', 'שוק טלה (אחורי) טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק טלה', 'שוק כבש', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק טלה', 'שוק טלה בלדי יחידה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק טלה', 'שוק טלה שלם עם עצם (ממוצע ליחידה 4 ק"ג)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק טלה', 'שוק טלה טרי שקיל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק טלה', 'שוק טלה/אחורי טלה טרי כ- 4 ק"ג', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק טלה', 'שוק כבש בלדי טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק טלה', 'שוק טלה צעיר', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שוק טלה', 'שוק טלה צעיר ברשת', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: שייטל בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'שייטל אנגוס', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'שייטל', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'קרפצ''יו שייטל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'שייטל מיושן טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'שייטל טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'שייטל ווגיו יפני', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'שייטל עגלה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'שייטל טלה', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'שייטל עגל מיושן', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'שייטל עגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'שייטל וואגיו', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'שייטל מקוצב טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'שייטל בקר/ עגל טרי', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'לב השייטל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'שייטל וואגיו', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'שייטל עגל', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', '1 ק"ג שייטל וואגיו', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שייטל בקר', 'שייטל, נתח מס'' 13', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: שפיץ שייטל בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שפיץ שייטל בקר', 'שפיץ שייטל Tri tip', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שפיץ שייטל בקר', 'שפיץ שייטל אנגוס', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שפיץ שייטל בקר', 'שפיץ שייטל', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שפיץ שייטל בקר', 'שפיץ שייטל מיושן', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שפיץ שייטל בקר', 'שפיץ שייטל טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שפיץ שייטל בקר', 'שפיץ שייטל וואגיו', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שפיץ שייטל בקר', 'שפיץ שייטל עגל', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: שקדים בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שקדים בקר', 'שקדי עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שקדים בקר', 'שקדי לב', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שקדים בקר', 'שקדי עגל (מושיחאס)', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שקדים בקר', 'שקדי עגל לבישול', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שקדים בקר', 'שקדי לב עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שקדים בקר', 'שקדי עגל שקיל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שקדים בקר', 'שקדים', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שקדים בקר', 'שקדי עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שקדים בקר', 'שקדי בקר  (חלוויאת)', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- Variants for: שריר מס 8 בקר
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר עגל טרי חלק מחפוד אדום אדום לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר עגל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר הזרוע "אנגוס" - בשר מס'' 8 - צרכני', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר זרוע-אוסובוקו', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר הזרוע 8', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר הזרוע דרום אמריקה - בשר מס'' 8', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר וואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר בקר טרי א', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר הזרוע "אנגוס" - בשר מס'' 8', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר טרי (מס 8)', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר בקר טרי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר (הזרוע)', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר מס 8 שקיל', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר עגל טרי מוכשר אדום אדום לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר בקר/עגל טרי שקיל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר טרי ארוז חלק אדום אדום לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'בשר שריר – מספר 8', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר עגל טרי ארוז מוכשר אדום אדום לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר מוכשר טרי יבוא לפי משקל', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'בשר לבישול שריר', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר עגלה', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר קדמי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר ואגיו', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר ללא עצם טרי "חי בריא"', 0.7) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר בננה טרי', 0.8) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר עגל מספר 8', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר 8', 0.9) ON CONFLICT (normalized_name, variant_name) DO NOTHING;
INSERT INTO product_name_variants (normalized_name, variant_name, confidence_score) VALUES ('שריר מס 8 בקר', 'שריר, נתח מס'' 8 טרי', 1.0) ON CONFLICT (normalized_name, variant_name) DO NOTHING;

-- All INSERT statements include ON CONFLICT (normalized_name, variant_name) DO NOTHING
-- This ensures that duplicate entries are ignored safely.