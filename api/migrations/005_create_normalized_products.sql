-- Migration 005: Create Normalized Products System
-- יצירת מערכת נרמול מוצרי בשר

-- טבלת מוצרים מנורמלים
CREATE TABLE normalized_products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE, -- השם המנורמל הסטנדרטי
  category VARCHAR(100), -- קטגוריה (בשר אדום, עוף, דגים)
  subcategory VARCHAR(100), -- תת-קטגוריה (סטייקים, נתחי בישול)
  meat_type VARCHAR(50), -- סוג הבשר (בקר, עוף, טלה, דגים)
  cut_type VARCHAR(100), -- סוג הנתח (אנטריקוט, פילה, חזה)
  preparation VARCHAR(100), -- אופן הכנה (טרי, קפוא, מעושן)
  has_bone BOOLEAN DEFAULT false, -- עם עצם/בלי עצם
  is_premium BOOLEAN DEFAULT false, -- איכות פרימיום (וואגיו, אנגוס)
  description TEXT, -- תיאור נוסף
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- טבלת שמות חלופיים
CREATE TABLE product_aliases (
  id SERIAL PRIMARY KEY,
  normalized_product_id INTEGER NOT NULL REFERENCES normalized_products(id) ON DELETE CASCADE,
  alias_name VARCHAR(255) NOT NULL, -- השם החלופי
  confidence_score DECIMAL(3,2) DEFAULT 1.00, -- רמת הוודאות (0.00-1.00)
  source VARCHAR(50), -- מקור הזיהוי (auto, manual, retailer_name)
  retailer_id INTEGER REFERENCES retailers(id), -- מאיזה קמעונאי
  is_verified BOOLEAN DEFAULT false, -- אושר ידנית?
  created_at TIMESTAMP DEFAULT NOW()
);

-- הוספת עמודה למחירים 
ALTER TABLE prices ADD COLUMN normalized_product_id INTEGER REFERENCES normalized_products(id);

-- יצירת אינדקסים לביצועים
CREATE INDEX idx_product_aliases_normalized_id ON product_aliases(normalized_product_id);
CREATE INDEX idx_product_aliases_alias_name ON product_aliases(alias_name);
CREATE INDEX idx_prices_normalized_product_id ON prices(normalized_product_id);

-- אינדקס לחיפוש דמיון טקסט (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_normalized_products_name_trgm ON normalized_products USING gin (name gin_trgm_ops);
CREATE INDEX idx_product_aliases_alias_trgm ON product_aliases USING gin (alias_name gin_trgm_ops);

-- הוספת unique constraint על שם חלופי+מוצר מנורמל למניעת כפילויות
ALTER TABLE product_aliases ADD CONSTRAINT unique_alias_per_product 
UNIQUE (normalized_product_id, alias_name);

-- הוספת trigger לעדכון updated_at
CREATE OR REPLACE FUNCTION update_normalized_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_normalized_products_updated_at
    BEFORE UPDATE ON normalized_products
    FOR EACH ROW EXECUTE PROCEDURE update_normalized_products_updated_at();

-- הוספת מוצרי דוגמה לבדיקה
INSERT INTO normalized_products (name, category, meat_type, cut_type, has_bone, is_premium, description) VALUES
('אנטריקוט בקר', 'בשר אדום', 'בקר', 'אנטריקוט', false, false, 'נתח איכותי למנגל וצלייה'),
('פילה בקר', 'בשר אדום', 'בקר', 'פילה', false, true, 'הנתח הרך ביותר'),
('שייטל בקר', 'בשר אדום', 'בקר', 'שייטל', false, false, 'נתח לבישול איטי'),
('חזה עוף', 'עוף', 'עוף', 'חזה', false, false, 'חלק דל שומן מהעוף'),
('פרגיות עוף', 'עוף', 'עוף', 'פרגיות', true, false, 'ירכיים עוף עם עצם');

-- הוספת aliases לדוגמה
INSERT INTO product_aliases (normalized_product_id, alias_name, source, confidence_score) VALUES
(1, 'אנטרקוט', 'manual', 0.95),
(1, 'אנטריקוט עם עצם', 'manual', 0.90),
(1, 'אנטריקוט ללא עצם', 'manual', 0.90),
(2, 'פילה מדומה', 'manual', 0.85),
(2, 'פאלש פילה', 'manual', 0.80),
(3, 'שיי-טל', 'manual', 0.95),
(3, 'שפיץ שייטל', 'manual', 0.90),
(4, 'חזה עוף שלם', 'manual', 0.95),
(4, 'חזה עוף חצוי', 'manual', 0.90),
(5, 'פרגית', 'manual', 0.95),
(5, 'ירכיים עוף', 'manual', 0.90);

COMMENT ON TABLE normalized_products IS 'טבלת מוצרי בשר מנורמלים - השמות הסטנדרטיים';
COMMENT ON TABLE product_aliases IS 'טבלת שמות חלופיים למוצרי בשר מנורמלים';
COMMENT ON COLUMN normalized_products.name IS 'השם המנורמל הסטנדרטי של המוצר';
COMMENT ON COLUMN product_aliases.alias_name IS 'שם חלופי למוצר (כפי שמופיע אצל קמעונאים)';
COMMENT ON COLUMN product_aliases.confidence_score IS 'רמת הוודאות בזיהוי (0.00-1.00)';