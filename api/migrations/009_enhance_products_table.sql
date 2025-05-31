-- Migration 009: Enhance products table with new fields
-- Created: 2025-05-31
-- Purpose: Add product_subtype_id and additional product metadata fields

-- ========== ADD NEW COLUMNS TO PRODUCTS TABLE ==========
-- Add product subtype reference
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_subtype_id INTEGER REFERENCES product_subtypes(id) ON DELETE SET NULL;

-- Add processing and quality fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS processing_state VARCHAR(100); -- e.g., "טרי", "קפוא", "מעובד", "מתובל"
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_bone BOOLEAN DEFAULT NULL; -- NULL means not applicable/unknown
ALTER TABLE products ADD COLUMN IF NOT EXISTS quality_grade VARCHAR(50); -- e.g., "A", "AA", "פרימיום", "רגיל"

-- Add DEPRECATED comments to old fields that will be phased out
COMMENT ON COLUMN products.cut_type IS 'DEPRECATED: Use cut_id and product_subtype_id instead';
COMMENT ON COLUMN products.animal_type IS 'DEPRECATED: Use cuts.category instead';

-- ========== INDEXES FOR PERFORMANCE ==========
CREATE INDEX IF NOT EXISTS idx_products_subtype_id ON products(product_subtype_id);
CREATE INDEX IF NOT EXISTS idx_products_processing_state ON products(processing_state);
CREATE INDEX IF NOT EXISTS idx_products_has_bone ON products(has_bone);
CREATE INDEX IF NOT EXISTS idx_products_quality_grade ON products(quality_grade);

-- ========== COMPOSITE INDEXES FOR COMPLEX QUERIES ==========
CREATE INDEX IF NOT EXISTS idx_products_cut_subtype ON products(cut_id, product_subtype_id);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category, is_active);

-- ========== COMMENTS ==========
COMMENT ON COLUMN products.product_subtype_id IS 'Reference to specific subtype of the cut (e.g., different preparations of the same cut)';
COMMENT ON COLUMN products.processing_state IS 'Processing/preparation state of the product (fresh, frozen, seasoned, etc.)';
COMMENT ON COLUMN products.has_bone IS 'Whether the product contains bone (NULL for non-applicable products)';
COMMENT ON COLUMN products.quality_grade IS 'Quality grade or premium level of the product';