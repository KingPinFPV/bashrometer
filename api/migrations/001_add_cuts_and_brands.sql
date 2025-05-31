-- Migration: Add meat cuts and brands lookup tables
-- Run this to populate standard cuts and brands for autocomplete

-- Create meat_cuts table for standardized cut names
CREATE TABLE IF NOT EXISTS meat_cuts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- בקר, חזיר, טלה, עוף, דגים, פירות ים
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create brands table for standardized brand/supplier names  
CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) DEFAULT 'supplier', -- supplier, brand, both
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard meat cuts
INSERT INTO meat_cuts (name, category) VALUES 
-- בקר
('אונטריב בקר', 'בקר'),
('אוסבוקו בקר', 'בקר'),
('אנטריקוט בקר', 'בקר'),
('אסאדו', 'בקר'),
('אצבעות אנטריקוט בקר', 'בקר'),
('בריסקט בקר', 'בקר'),
('דנוור בקר', 'בקר'),
('ואסיו בקר', 'בקר'),
('וייסבראטן בקר', 'בקר'),
('זנב שור בקר', 'בקר'),
('חגורות פילה בקר', 'בקר'),
('חזה עם עצם בקר', 'בקר'),
('חטיפי אסאדו בקר', 'בקר'),
('טחון בקר', 'בקר'),
('כתף 5 בקר', 'בקר'),
('כתף מרכזי 4 בקר', 'בקר'),
('לחי בקר', 'בקר'),
('לשון בקר', 'בקר'),
('מוח בקר', 'בקר'),
('מכסה אנטריקוט בקר', 'בקר'),
('ניו יורק סטייק בקר', 'בקר'),
('נתח קצבים דק בקר', 'בקר'),
('נתח קצבים עבה בקר', 'בקר'),
('סינטה בקר', 'בקר'),
('פילה בקר', 'בקר'),
('פילה מדומה בקר', 'בקר'),
('פיקניה בקר', 'בקר'),
('פלאנק בקר', 'בקר'),
('פריים ריב בקר', 'בקר'),
('שייטל בקר', 'בקר'),
('שפיץ שייטל בקר', 'בקר'),
('שקדים בקר', 'בקר'),
('שריר מס 8 בקר', 'בקר'),

-- חזיר
('אוסבוקו חזיר', 'חזיר'),
('סינטה חזיר', 'חזיר'),
('ספריבס/ברוסט חזיר', 'חזיר'),
('פולקה חזיר', 'חזיר'),
('פילה חזיר', 'חזיר'),
('צוואר חזיר', 'חזיר'),
('שולטר חזיר', 'חזיר'),

-- טלה
('שכים טלה', 'טלה'),
('טיבון טלה', 'טלה'),
('כתף טלה', 'טלה'),
('ספריבס טלה', 'טלה'),
('צוואר טלה', 'טלה'),
('שוק טלה', 'טלה'),

-- עוף
('חזה עוף', 'עוף'),
('כבד עוף', 'עוף'),
('פרגיות עוף', 'עוף'),

-- הודו
('חזה הודו', 'הודו'),
('שווארמה הודו', 'הודו'),

-- אווז
('חזה אווז קפוא', 'אווז'),
('שוק אווז קפוא', 'אווז'),

-- דגים ופירות ים
('סלמון קפוא דגים', 'דגים'),
('קלמארי 500גר פירות ים', 'פירות ים'),
('שרימפס 1קג פירות ים', 'פירות ים'),

-- אחר
('לייה', 'אחר')

ON CONFLICT (name) DO NOTHING;

-- Insert standard brands/suppliers
INSERT INTO brands (name, type) VALUES 
('עיראקי מקור הבשר', 'supplier'),
('בשר פרימיום', 'supplier'),
('קרל ברג', 'brand'),
('דבאח גן שמואל', 'supplier'),
('קשת טעמים', 'brand'),
('טיב טעם', 'brand'),
('הצרכניה', 'supplier'),
('ולדמן', 'brand'),
('שמשון כהן', 'supplier'),
('קנקון', 'brand'),
('סוד הבשר', 'supplier'),
('חינאווי', 'supplier'),
('בשר בכפר', 'supplier'),
('רמי לוי', 'supplier'),
('מעדני גורמה', 'supplier'),
('איתן מעדי בשרים', 'supplier'),
('באפלו מיט', 'brand'),
('ליזא', 'brand'),
('טיאסדו', 'brand'),
('הכהנים', 'supplier'),
('החלוצים', 'supplier'),
('מיט פלייס', 'supplier'),
('בשר בעיר', 'supplier'),
('פסקוביץ', 'supplier'),
('דובלה', 'supplier'),
('צמד קצבים', 'supplier'),
('נתח בשרים', 'supplier'),
('ויקטורי', 'brand'),
('שירי', 'brand'),
('blue cow', 'brand'),
('שף בשר', 'supplier'),
('מילנזה', 'brand'),
('מיטאו', 'brand'),
('Butchery', 'supplier'),
('גיל גורמה', 'supplier'),
('משק זמיר', 'supplier'),
('מרינדו', 'brand'),
('זלמן', 'supplier'),
('אטליז גבעתיים', 'supplier'),
('האחים אהרון', 'supplier'),
('אבו חילווה', 'supplier'),
('העופר מעדנים', 'supplier'),
('קצביית שף', 'supplier'),
('בוארון', 'brand'),
('קוזי', 'brand'),
('חצי חינם', 'supplier'),
('A Meat', 'supplier'),
('דדוש', 'supplier'),
('דרום אמריקה', 'brand'),
('אייזן', 'brand'),
('ברכת שמואל', 'supplier'),
('שושני', 'brand'),
('פרה פרה', 'brand'),
('עיראקי עאסלי', 'supplier')

ON CONFLICT (name) DO NOTHING;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_meat_cuts_name ON meat_cuts USING gin(to_tsvector('hebrew', name));
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands USING gin(to_tsvector('hebrew', name));
CREATE INDEX IF NOT EXISTS idx_meat_cuts_category ON meat_cuts (category);
CREATE INDEX IF NOT EXISTS idx_brands_type ON brands (type);