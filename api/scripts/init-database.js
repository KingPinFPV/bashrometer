const pool = require('../db');

async function createProductsTable() {
  try {
    console.log('🔄 Creating products table if not exists...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        retailer VARCHAR(255),
        cut_type VARCHAR(100),
        weight VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Products table ready');
  } catch (error) {
    console.error('❌ Error creating products table:', error);
    throw error;
  }
}

async function createIndexes() {
  try {
    console.log('🔄 Creating database indexes...');
    
    // Add indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_products_retailer ON products(retailer);
      CREATE INDEX IF NOT EXISTS idx_products_cut_type ON products(cut_type);
      CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
    `);
    
    console.log('✅ Database indexes ready');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    // Don't throw - indexes are optional
  }
}

async function initializeDatabase() {
  try {
    await createProductsTable();
    await createIndexes();
    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

module.exports = { 
  createProductsTable,
  createIndexes,
  initializeDatabase
};