-- Migration 011: Add search indexes for enhanced performance
-- Created: 2025-05-31
-- Purpose: Create specialized indexes for advanced search functionality

-- ========== GIN INDEXES FOR FULL-TEXT SEARCH ==========
-- Enable trigram extension if not exists (for fuzzy text search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for text search on products
CREATE INDEX IF NOT EXISTS idx_products_name_gin ON products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_brand_gin ON products USING GIN (brand gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_gin ON products USING GIN (description gin_trgm_ops);

-- Create GIN indexes for text search on cuts
CREATE INDEX IF NOT EXISTS idx_cuts_hebrew_name_gin ON cuts USING GIN (hebrew_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cuts_description_gin ON cuts USING GIN (description gin_trgm_ops);

-- Create GIN indexes for text search on product subtypes
CREATE INDEX IF NOT EXISTS idx_product_subtypes_hebrew_desc_gin ON product_subtypes USING GIN (hebrew_description gin_trgm_ops);

-- ========== COMPOSITE INDEXES FOR COMPLEX QUERIES ==========
-- Index for category + active status + cut filtering
CREATE INDEX IF NOT EXISTS idx_products_category_active_cut ON products(category, is_active, cut_id);

-- Index for price range queries (joining with prices table)
CREATE INDEX IF NOT EXISTS idx_prices_product_date_price ON prices(product_id, price_submission_date, regular_price);

-- Index for recent prices with status
CREATE INDEX IF NOT EXISTS idx_prices_status_date_product ON prices(status, price_submission_date DESC, product_id);

-- Index for sale prices
CREATE INDEX IF NOT EXISTS idx_prices_sale_status ON prices(is_on_sale, status) WHERE is_on_sale = true;

-- ========== INDEXES FOR SORTING AND PAGINATION ==========
-- Index for alphabetical sorting
CREATE INDEX IF NOT EXISTS idx_products_name_lower ON products(LOWER(name));

-- Index for creation date sorting
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc ON products(created_at DESC);

-- Index for price-based sorting (average price calculation)
CREATE INDEX IF NOT EXISTS idx_prices_product_regular_price ON prices(product_id, regular_price) WHERE status = 'approved';

-- ========== PARTIAL INDEXES FOR PERFORMANCE ==========
-- Index only active products (most common queries)
CREATE INDEX IF NOT EXISTS idx_products_active_only ON products(name, category, cut_id) WHERE is_active = true;

-- Index only approved prices (most common price queries)
CREATE INDEX IF NOT EXISTS idx_prices_approved_only ON prices(product_id, retailer_id, regular_price, price_submission_date) WHERE status = 'approved';

-- ========== INDEXES FOR AUTOCOMPLETE FUNCTIONALITY ==========
-- Index for product name prefix searches
CREATE INDEX IF NOT EXISTS idx_products_name_prefix ON products(name varchar_pattern_ops) WHERE is_active = true;

-- Index for brand prefix searches
CREATE INDEX IF NOT EXISTS idx_products_brand_prefix ON products(brand varchar_pattern_ops) WHERE brand IS NOT NULL;

-- ========== FOREIGN KEY OPTIMIZATION ==========
-- These should already exist from previous migrations, but ensuring they're optimal
CREATE INDEX IF NOT EXISTS idx_products_cut_id_optimized ON products(cut_id) WHERE cut_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_subtype_id_optimized ON products(product_subtype_id) WHERE product_subtype_id IS NOT NULL;

-- ========== STATISTICS UPDATE ==========
-- Update table statistics for query planner
ANALYZE products;
ANALYZE cuts;
ANALYZE product_subtypes;
ANALYZE prices;

-- ========== COMMENTS ==========
COMMENT ON INDEX idx_products_name_gin IS 'GIN index for fuzzy text search on product names';
COMMENT ON INDEX idx_products_category_active_cut IS 'Composite index for filtered product listings';
COMMENT ON INDEX idx_prices_product_date_price IS 'Optimized index for price range queries and trends';
COMMENT ON INDEX idx_products_active_only IS 'Partial index covering most common product queries';