-- Migration 009: Create meat names mapping system
-- This migration creates tables for normalized meat categories and name variants

-- Create normalized categories table
CREATE TABLE IF NOT EXISTS normalized_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  hebrew_name VARCHAR(200) NOT NULL,
  animal_type VARCHAR(50),
  body_part VARCHAR(50),
  cut_style VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create product name variants table
CREATE TABLE IF NOT EXISTS product_name_variants (
  id SERIAL PRIMARY KEY,
  normalized_name VARCHAR(200) NOT NULL,
  variant_name VARCHAR(200) NOT NULL,
  source VARCHAR(100),
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(normalized_name, variant_name)
);

-- Create indexes for fast search
CREATE INDEX IF NOT EXISTS idx_normalized_categories_name ON normalized_categories(name);
CREATE INDEX IF NOT EXISTS idx_normalized_categories_hebrew ON normalized_categories(hebrew_name);
CREATE INDEX IF NOT EXISTS idx_normalized_categories_animal ON normalized_categories(animal_type);
CREATE INDEX IF NOT EXISTS idx_normalized_categories_body_part ON normalized_categories(body_part);

CREATE INDEX IF NOT EXISTS idx_product_variants_normalized ON product_name_variants(normalized_name);
CREATE INDEX IF NOT EXISTS idx_product_variants_variant ON product_name_variants(variant_name);
CREATE INDEX IF NOT EXISTS idx_product_variants_confidence ON product_name_variants(confidence_score DESC);

-- Simple text search indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_search_text ON product_name_variants 
  USING gin(to_tsvector('simple', variant_name));
CREATE INDEX IF NOT EXISTS idx_normalized_categories_search_text ON normalized_categories 
  USING gin(to_tsvector('simple', hebrew_name));