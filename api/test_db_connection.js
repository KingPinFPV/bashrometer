require('dotenv').config();
const pool = require('./db');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0]);
    
    // Check if normalization tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('normalized_products', 'product_aliases')
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    console.log('\n📊 Normalization tables status:');
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No normalization tables found. Migration needs to be run.');
    } else {
      console.log('✅ Found tables:', tablesResult.rows.map(r => r.table_name));
      
      // Check table contents
      for (const row of tablesResult.rows) {
        const countQuery = `SELECT COUNT(*) as count FROM ${row.table_name}`;
        const countResult = await pool.query(countQuery);
        console.log(`   ${row.table_name}: ${countResult.rows[0].count} records`);
      }
    }
    
    // Check if prices table has normalized_product_id column
    const columnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'prices' 
      AND column_name = 'normalized_product_id'
    `;
    
    const columnResult = await pool.query(columnQuery);
    if (columnResult.rows.length > 0) {
      console.log('✅ prices table has normalized_product_id column');
    } else {
      console.log('❌ prices table missing normalized_product_id column');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testConnection();