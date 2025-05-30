-- ===============================================
-- COMPLETE DATABASE INITIALIZATION SCRIPT
-- For Production Environment
-- ===============================================
-- This script contains the complete schema and all migrations
-- to ensure production database has all required tables

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Table: users
CREATE TABLE IF NOT EXISTS users ( -- Added IF NOT EXISTS
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'editor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_modtime') THEN
        CREATE TRIGGER update_users_modtime
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp_column();
    END IF;
END $$;

-- Table: products
CREATE TABLE IF NOT EXISTS products ( -- Added IF NOT EXISTS
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(75),
    origin_country VARCHAR(75),
    kosher_level VARCHAR(30) CHECK (kosher_level IN ('רגיל', 'מהדרין', 'גלאט', 'ללא', 'לא ידוע', 'אחר')),
    animal_type VARCHAR(50), 
    cut_type VARCHAR(75),
    description TEXT,
    category VARCHAR(50),
    unit_of_measure VARCHAR(20) NOT NULL DEFAULT '100g' CHECK (unit_of_measure IN ('100g', 'kg', 'g', 'unit', 'package')),
    default_weight_per_unit_grams NUMERIC(10,2) NULL,
    image_url TEXT,
    short_description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_animal_type ON products(animal_type);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_modtime') THEN
        CREATE TRIGGER update_products_modtime
        BEFORE UPDATE ON products
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp_column();
    END IF;
END $$;

-- Table: retailers
CREATE TABLE IF NOT EXISTS retailers ( -- Added IF NOT EXISTS
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    chain VARCHAR(75),
    address VARCHAR(255),
    type VARCHAR(50) CHECK (type IN ('סופרמרקט', 'קצביה', 'מעדניה', 'חנות נוחות', 'אונליין', 'שוק')),
    geo_lat DOUBLE PRECISION,
    geo_lon DOUBLE PRECISION,
    opening_hours VARCHAR(255),
    user_rating NUMERIC(2,1) CHECK (user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5)),
    rating_count INT DEFAULT 0 CHECK (rating_count >= 0),
    phone VARCHAR(30),
    website VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_retailers_name ON retailers(name);
CREATE INDEX IF NOT EXISTS idx_retailers_chain ON retailers(chain);
CREATE INDEX IF NOT EXISTS idx_retailers_type ON retailers(type);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_retailers_modtime') THEN
        CREATE TRIGGER update_retailers_modtime
        BEFORE UPDATE ON retailers
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp_column();
    END IF;
END $$;

-- Table: prices
CREATE TABLE IF NOT EXISTS prices ( -- Added IF NOT EXISTS
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    retailer_id INTEGER NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, 
    price_submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    price_valid_from DATE DEFAULT CURRENT_DATE,
    price_valid_to DATE,
    unit_for_price VARCHAR(20) NOT NULL CHECK (unit_for_price IN ('100g', 'kg', 'g', 'unit', 'package')),
    quantity_for_price NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity_for_price > 0),
    regular_price NUMERIC(10,2) NOT NULL CHECK (regular_price > 0),
    sale_price NUMERIC(10,2) CHECK (sale_price IS NULL OR sale_price > 0),
    is_on_sale BOOLEAN DEFAULT FALSE,
    source VARCHAR(50) CHECK (source IN ('user_report', 'web_scrape', 'manual_import', 'retailer_feed', 'other')),
    report_type VARCHAR(20) CHECK (report_type IS NULL OR report_type IN ('community', 'auto', 'manual')),
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'expired', 'edited')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_sale_price_if_on_sale CHECK (NOT (is_on_sale = TRUE AND sale_price IS NULL)),
    CONSTRAINT chk_price_logic CHECK (sale_price IS NULL OR sale_price <= regular_price)
);

CREATE INDEX IF NOT EXISTS idx_prices_product_retailer ON prices(product_id, retailer_id);
CREATE INDEX IF NOT EXISTS idx_prices_submission_date ON prices(price_submission_date);
CREATE INDEX IF NOT EXISTS idx_prices_status ON prices(status);
CREATE INDEX IF NOT EXISTS idx_prices_user_id ON prices(user_id);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_prices_modtime') THEN
        CREATE TRIGGER update_prices_modtime
        BEFORE UPDATE ON prices
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp_column();
    END IF;
END $$;

-- NEW TABLE: price_report_likes
CREATE TABLE IF NOT EXISTS price_report_likes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    price_id INTEGER NOT NULL REFERENCES prices(id) ON DELETE CASCADE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, price_id) 
);

CREATE INDEX IF NOT EXISTS idx_price_report_likes_price_id ON price_report_likes(price_id);

-- ===============================================
-- MIGRATION 001: Add meat cuts and brands lookup tables
-- ===============================================

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
('עיראקי עאסי', 'supplier')

ON CONFLICT (name) DO NOTHING;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_meat_cuts_name ON meat_cuts USING gin(to_tsvector('hebrew', name));
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands USING gin(to_tsvector('hebrew', name));
CREATE INDEX IF NOT EXISTS idx_meat_cuts_category ON meat_cuts (category);
CREATE INDEX IF NOT EXISTS idx_brands_type ON brands (type);

-- ===============================================
-- MIGRATION 003: Add tables for product and retailer requests from users
-- ===============================================

-- Create table for new product requests
CREATE TABLE IF NOT EXISTS product_requests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100),
    animal_type VARCHAR(50),
    cut_type VARCHAR(100),
    description TEXT,
    unit_of_measure VARCHAR(20) DEFAULT 'kg',
    kosher_level VARCHAR(50),
    origin_country VARCHAR(100),
    requested_by INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    admin_notes TEXT,
    processed_by INTEGER REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create table for new retailer requests
CREATE TABLE IF NOT EXISTS retailer_requests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- סופרמרקט, קצביה, חנות נוחות, אחר
    chain VARCHAR(100),
    address TEXT,
    website VARCHAR(255),
    phone VARCHAR(20),
    requested_by INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    admin_notes TEXT,
    processed_by INTEGER REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_requests_status ON product_requests (status);
CREATE INDEX IF NOT EXISTS idx_product_requests_requested_by ON product_requests (requested_by);
CREATE INDEX IF NOT EXISTS idx_retailer_requests_status ON retailer_requests (status);
CREATE INDEX IF NOT EXISTS idx_retailer_requests_requested_by ON retailer_requests (requested_by);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to the new tables
CREATE TRIGGER update_product_requests_updated_at BEFORE UPDATE ON product_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_retailer_requests_updated_at BEFORE UPDATE ON retailer_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- MIGRATION 004: Add password reset tokens table
-- ===============================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Add cleanup function for expired tokens (can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() OR used = TRUE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE password_reset_tokens IS 'Stores tokens for password reset functionality';
COMMENT ON COLUMN password_reset_tokens.token IS 'Unique token for password reset (should be cryptographically secure)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expiration time (typically 1 hour from creation)';
COMMENT ON COLUMN password_reset_tokens.used IS 'Whether the token has been used for password reset';

-- ===============================================
-- FINAL COMMENTS
-- ===============================================

COMMENT ON COLUMN products.default_weight_per_unit_grams IS 'Weight in grams if unit_of_measure is ''unit'' or ''package'' for a single item (quantity_for_price=1)';
COMMENT ON COLUMN prices.quantity_for_price IS 'Number of units (as defined by unit_for_price) for which the given price applies (e.g., 1 for a single unit/kg/100g, or 3 for a pack of 3 units)';

-- Success message
SELECT 'Complete database initialization completed successfully! All 10 tables created with full schema and migrations.' as initialization_status;