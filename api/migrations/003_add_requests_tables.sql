-- Migration: Add tables for product and retailer requests from users
-- These tables store requests for new products/retailers that need admin approval

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