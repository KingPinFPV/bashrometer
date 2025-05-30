const pool = require('../db');

async function createProductsTable() {
  try {
    console.log('🔄 Creating products table if not exists...');
    
    // First create the basic table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Basic products table created');
    
    // Then add missing columns if they don't exist
    console.log('🔄 Checking and adding missing columns...');
    
    const missingColumns = [
      { name: 'price', type: 'DECIMAL(10,2) DEFAULT 0' },
      { name: 'retailer', type: 'VARCHAR(255)' },
      { name: 'cut_type', type: 'VARCHAR(100)' },
      { name: 'weight', type: 'VARCHAR(50)' }
    ];
    
    for (const column of missingColumns) {
      try {
        await pool.query(`
          ALTER TABLE products 
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};
        `);
        console.log(`✅ Column ${column.name} ready`);
      } catch (colError) {
        console.log(`ℹ️ Column ${column.name} already exists or error:`, colError.message);
      }
    }
    
    console.log('✅ Products table with all columns ready');
  } catch (error) {
    console.error('❌ Error creating products table:', error);
    throw error;
  }
}

async function createIndexes() {
  try {
    console.log('🔄 Creating database indexes...');
    
    // First verify table structure
    const tableInfo = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND table_schema = 'public';
    `);
    
    const columnNames = tableInfo.rows.map(row => row.column_name);
    console.log('🔍 Available columns:', columnNames);
    
    // Only create indexes for existing columns
    const indexesToCreate = [
      { column: 'name', index: 'idx_products_name' },
      { column: 'price', index: 'idx_products_price' }
    ];
    
    // Add conditional indexes for optional columns
    if (columnNames.includes('retailer')) {
      indexesToCreate.push({ column: 'retailer', index: 'idx_products_retailer' });
    }
    if (columnNames.includes('cut_type')) {
      indexesToCreate.push({ column: 'cut_type', index: 'idx_products_cut_type' });
    }
    
    for (const { column, index } of indexesToCreate) {
      try {
        await pool.query(`CREATE INDEX IF NOT EXISTS ${index} ON products(${column});`);
        console.log(`✅ Index ${index} created`);
      } catch (indexError) {
        console.log(`ℹ️ Index ${index} already exists:`, indexError.message);
      }
    }
    
    console.log('✅ Database indexes ready');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    // Don't throw - indexes are optional
  }
}

async function addSampleData() {
  try {
    console.log('🔄 Checking if sample data needed...');
    
    // Check if products table has any data
    const countResult = await pool.query('SELECT COUNT(*) FROM products');
    const productCount = parseInt(countResult.rows[0].count);
    
    if (productCount === 0) {
      console.log('📦 Adding sample data...');
      
      const sampleProducts = [
        { name: 'אנטריקוט בקר', price: 89.90, retailer: 'חווה ברקן', cut_type: 'בקר', weight: '1 ק"ג' },
        { name: 'חזה עוף', price: 29.90, retailer: 'סופר פארם', cut_type: 'עוף', weight: '1.2 ק"ג' },
        { name: 'פילה בקר', price: 119.90, retailer: 'יוחננוף', cut_type: 'בקר', weight: '500 גרם' },
        { name: 'שוק עוף', price: 19.90, retailer: 'חווה ברקן', cut_type: 'עוף', weight: '1 ק"ג' },
        { name: 'קציצות טלה', price: 45.90, retailer: 'מעדני גליל', cut_type: 'טלה', weight: '600 גרם' }
      ];
      
      for (const product of sampleProducts) {
        try {
          await pool.query(`
            INSERT INTO products (name, price, retailer, cut_type, weight)
            VALUES ($1, $2, $3, $4, $5)
          `, [product.name, product.price, product.retailer, product.cut_type, product.weight]);
        } catch (insertError) {
          console.log(`ℹ️ Sample product already exists: ${product.name}`);
        }
      }
      
      console.log('✅ Sample data added');
    } else {
      console.log(`ℹ️ Products table already has ${productCount} items, skipping sample data`);
      
      // But still update prices for existing products that don't have them
      await updateMissingPrices();
    }
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    // Don't throw - sample data is optional
  }
}

async function updateMissingPrices() {
  try {
    console.log('🔄 Updating existing products with missing prices...');
    
    // Update products that have price = 0 or NULL
    const updateQuery = `
      UPDATE products 
      SET price = CASE 
        WHEN name ILIKE '%אנטריקוט%' THEN 89.90
        WHEN name ILIKE '%חזה עוף%' OR name ILIKE '%חזה%' THEN 24.90  
        WHEN name ILIKE '%כתף כבש%' OR name ILIKE '%כתף%' THEN 65.00
        WHEN name ILIKE '%פילה%' THEN 119.90
        WHEN name ILIKE '%שוק%' THEN 19.90
        WHEN name ILIKE '%קציצות%' THEN 45.90
        ELSE 50.00
      END
      WHERE price = 0 OR price IS NULL;
    `;
    
    const result = await pool.query(updateQuery);
    console.log(`✅ Updated ${result.rowCount} products with sample prices`);
    
  } catch (error) {
    console.error('❌ Error updating prices:', error);
    // Don't throw - price updates are optional
  }
}

async function initializeDatabase() {
  try {
    await createProductsTable();
    await createIndexes();
    await addSampleData();
    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

module.exports = { 
  createProductsTable,
  createIndexes,
  addSampleData,
  updateMissingPrices,
  initializeDatabase
};