-- Migration 008: Create product_subtypes table
-- Created: 2025-05-31
-- Purpose: Add support for product subtypes (e.g., "אנטריקוט מלא" vs "מכסה אנטריקוט" vs "שיפודי אנטריקוט")

-- ========== CREATE TIMESTAMP FUNCTION IF NOT EXISTS ==========
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- ========== PRODUCT SUBTYPES TABLE ==========
CREATE TABLE IF NOT EXISTS product_subtypes (
    id SERIAL PRIMARY KEY,
    cut_id INTEGER NOT NULL REFERENCES cuts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    hebrew_description VARCHAR(255) NOT NULL,
    purpose TEXT, -- e.g., "צלייה", "בישול איטי", "שיפודים"
    price_range VARCHAR(50), -- e.g., "גבוה", "בינוני", "נמוך"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique combination of cut and subtype name
    CONSTRAINT unique_cut_subtype UNIQUE (cut_id, name)
);

-- ========== INDEXES FOR PERFORMANCE ==========
CREATE INDEX IF NOT EXISTS idx_product_subtypes_cut_id ON product_subtypes(cut_id);
CREATE INDEX IF NOT EXISTS idx_product_subtypes_name ON product_subtypes(name);
CREATE INDEX IF NOT EXISTS idx_product_subtypes_active ON product_subtypes(is_active);

-- ========== TRIGGER FOR UPDATED_AT ==========
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_subtypes_modtime') THEN
        CREATE TRIGGER update_product_subtypes_modtime
        BEFORE UPDATE ON product_subtypes
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp_column();
    END IF;
END $$;

-- ========== COMMENTS ==========
COMMENT ON TABLE product_subtypes IS 'Sub-categories for cuts (e.g., different preparations or portions of the same cut)';
COMMENT ON COLUMN product_subtypes.cut_id IS 'Reference to the main cut category';
COMMENT ON COLUMN product_subtypes.name IS 'Internal name for the subtype (e.g., "entrecote_full", "entrecote_cap")';
COMMENT ON COLUMN product_subtypes.hebrew_description IS 'Hebrew display name for users';
COMMENT ON COLUMN product_subtypes.purpose IS 'Cooking purpose or preparation method';
COMMENT ON COLUMN product_subtypes.price_range IS 'Expected relative price range compared to other subtypes of the same cut';