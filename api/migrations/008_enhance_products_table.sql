-- Enhancement migration for products table and admin system
-- Add status, metadata, and admin action logging

-- Add status and approval fields to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved';
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER REFERENCES users(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS approved_by_user_id INTEGER REFERENCES users(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add metadata fields to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_price_update TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category, status);
CREATE INDEX IF NOT EXISTS idx_products_last_update ON products(last_price_update);

-- Add constraints
ALTER TABLE products ADD CONSTRAINT check_product_status 
CHECK (status IN ('pending', 'approved', 'rejected', 'draft'));

-- Update existing products to be approved
UPDATE products SET 
  status = 'approved',
  approved_at = created_at
WHERE status IS NULL OR status = 'approved';

-- Add fields to retailers table
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved';
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER REFERENCES users(id);
ALTER TABLE retailers ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified';

-- Create product categories table for dynamic management only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_categories') THEN
        CREATE TABLE product_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          hebrew_name VARCHAR(100) NOT NULL,
          description TEXT,
          icon VARCHAR(50),
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Insert basic categories
INSERT INTO product_categories (name, hebrew_name, description, sort_order) VALUES
('beef', 'בקר', 'בשר בקר איכותי', 1),
('chicken', 'עוף', 'בשר עוף טרי', 2),
('lamb', 'כבש', 'בשר כבש', 3),
('turkey', 'הודו', 'בשר הודו', 4),
('duck', 'ברווז', 'בשר ברווז', 5),
('goose', 'אווז', 'בשר אווז', 6),
('veal', 'עגל', 'בשר עגל', 7),
('goat', 'עז', 'בשר עז', 8),
('rabbit', 'ארנב', 'בשר ארנב', 9),
('organ', 'איברים', 'איברי בעלי חיים', 10)
ON CONFLICT (name) DO NOTHING;

-- Create admin actions log table only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_actions') THEN
        CREATE TABLE admin_actions (
          id SERIAL PRIMARY KEY,
          admin_user_id INTEGER NOT NULL REFERENCES users(id),
          action_type VARCHAR(50) NOT NULL,
          target_type VARCHAR(50) NOT NULL, -- 'product', 'user', 'retailer', etc.
          target_id INTEGER NOT NULL,
          details JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Create indexes for admin actions
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at);

-- Add trigger to update product report count
CREATE OR REPLACE FUNCTION update_product_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products 
    SET report_count = report_count + 1,
        last_price_update = NEW.created_at
    WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products 
    SET report_count = GREATEST(0, report_count - 1)
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for price reports
DROP TRIGGER IF EXISTS trigger_update_product_report_count ON prices;
CREATE TRIGGER trigger_update_product_report_count
  AFTER INSERT OR DELETE ON prices
  FOR EACH ROW
  EXECUTE FUNCTION update_product_report_count();