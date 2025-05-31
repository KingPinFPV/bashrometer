-- Migration 010: Populate base data for product subtypes
-- Created: 2025-05-31
-- Purpose: Add initial data for common product subtypes (אנטריקוט, חזה עוף, בשר טחון)

-- ========== BEEF SUBTYPES (אנטריקוט) ==========
-- First, get the cut_id for beef sirloin (אנטריקוט)
INSERT INTO product_subtypes (cut_id, name, hebrew_description, purpose, price_range) 
SELECT 
    c.id,
    'entrecote_full',
    'אנטריקוט מלא',
    'צלייה, גריל',
    'גבוה'
FROM cuts c 
WHERE c.name = 'beef_sirloin'
ON CONFLICT (cut_id, name) DO NOTHING;

INSERT INTO product_subtypes (cut_id, name, hebrew_description, purpose, price_range) 
SELECT 
    c.id,
    'entrecote_cap',
    'מכסה אנטריקוט',
    'צלייה, בישול איטי',
    'בינוני'
FROM cuts c 
WHERE c.name = 'beef_sirloin'
ON CONFLICT (cut_id, name) DO NOTHING;

INSERT INTO product_subtypes (cut_id, name, hebrew_description, purpose, price_range) 
SELECT 
    c.id,
    'entrecote_skewers',
    'שיפודי אנטריקוט',
    'שיפודים, גריל מהיר',
    'גבוה'
FROM cuts c 
WHERE c.name = 'beef_sirloin'
ON CONFLICT (cut_id, name) DO NOTHING;

-- ========== CHICKEN BREAST SUBTYPES (חזה עוף) ==========
INSERT INTO product_subtypes (cut_id, name, hebrew_description, purpose, price_range) 
SELECT 
    c.id,
    'chicken_breast_whole',
    'חזה עוף שלם',
    'צלייה, קליית מחבת',
    'בינוני'
FROM cuts c 
WHERE c.name = 'chicken_breast'
ON CONFLICT (cut_id, name) DO NOTHING;

INSERT INTO product_subtypes (cut_id, name, hebrew_description, purpose, price_range) 
SELECT 
    c.id,
    'chicken_breast_sliced',
    'חזה עוף פרוס',
    'קליית מחבת מהירה, סלטים',
    'גבוה'
FROM cuts c 
WHERE c.name = 'chicken_breast'
ON CONFLICT (cut_id, name) DO NOTHING;

INSERT INTO product_subtypes (cut_id, name, hebrew_description, purpose, price_range) 
SELECT 
    c.id,
    'chicken_breast_cubes',
    'קוביות חזה עוף',
    'תבשילים, קארי, וו×ק',
    'גבוה'
FROM cuts c 
WHERE c.name = 'chicken_breast'
ON CONFLICT (cut_id, name) DO NOTHING;

INSERT INTO product_subtypes (cut_id, name, hebrew_description, purpose, price_range) 
SELECT 
    c.id,
    'chicken_breast_strips',
    'רצועות חזה עוף',
    'שניצל, פאחיטה',
    'גבוה'
FROM cuts c 
WHERE c.name = 'chicken_breast'
ON CONFLICT (cut_id, name) DO NOTHING;

-- ========== GROUND BEEF SUBTYPES (בשר טחון בקר) ==========
INSERT INTO product_subtypes (cut_id, name, hebrew_description, purpose, price_range) 
SELECT 
    c.id,
    'ground_beef_5_fat',
    'בשר טחון בקר 5% שומן',
    'המבורגר פרימיום, בולונז',
    'גבוה'
FROM cuts c 
WHERE c.name = 'ground_beef'
ON CONFLICT (cut_id, name) DO NOTHING;

INSERT INTO product_subtypes (cut_id, name, hebrew_description, purpose, price_range) 
SELECT 
    c.id,
    'ground_beef_15_fat',
    'בשר טחון בקר 15% שומן',
    'המבורגר, קציצות',
    'בינוני'
FROM cuts c 
WHERE c.name = 'ground_beef'
ON CONFLICT (cut_id, name) DO NOTHING;

INSERT INTO product_subtypes (cut_id, name, hebrew_description, purpose, price_range) 
SELECT 
    c.id,
    'ground_beef_20_fat',
    'בשר טחון בקר 20% שומן',
    'תבשילים, רגו',
    'נמוך'
FROM cuts c 
WHERE c.name = 'ground_beef'
ON CONFLICT (cut_id, name) DO NOTHING;

-- ========== CHICKEN THIGH SUBTYPES (ירך עוף) ==========
INSERT INTO product_subtypes (cut_id, name, hebrew_description, purpose, price_range) 
SELECT 
    c.id,
    'chicken_thigh_bone_in',
    'ירך עוף עם עצם',
    'תבשילים, צלייה',
    'נמוך'
FROM cuts c 
WHERE c.name = 'chicken_thigh'
ON CONFLICT (cut_id, name) DO NOTHING;

INSERT INTO product_subtypes (cut_id, name, hebrew_description, purpose, price_range) 
SELECT 
    c.id,
    'chicken_thigh_boneless',
    'ירך עוף ללא עצם',
    'מילוי, גלילה',
    'בינוני'
FROM cuts c 
WHERE c.name = 'chicken_thigh'
ON CONFLICT (cut_id, name) DO NOTHING;

-- ========== BEEF CHUCK SUBTYPES (צווארון בקר) ==========
INSERT INTO product_subtypes (cut_id, name, hebrew_description, purpose, price_range) 
SELECT 
    c.id,
    'beef_chuck_roast',
    'צווארון בקר לצלי',
    'צלי, בישול איטי',
    'בינוני'
FROM cuts c 
WHERE c.name = 'beef_chuck'
ON CONFLICT (cut_id, name) DO NOTHING;

INSERT INTO product_subtypes (cut_id, name, hebrew_description, purpose, price_range) 
SELECT 
    c.id,
    'beef_chuck_stew',
    'צווארון בקר לתבשיל',
    'תבשילים, מרק',
    'נמוך'
FROM cuts c 
WHERE c.name = 'beef_chuck'
ON CONFLICT (cut_id, name) DO NOTHING;

-- ========== VERIFICATION QUERY ==========
-- This comment shows how to verify the data was inserted correctly:
-- SELECT ps.*, c.hebrew_name as cut_name 
-- FROM product_subtypes ps 
-- JOIN cuts c ON ps.cut_id = c.id 
-- ORDER BY c.category, c.hebrew_name, ps.hebrew_description;