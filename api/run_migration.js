require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function runMigration() {
  try {
    console.log('🚀 Running normalization migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '005_create_normalized_products.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📖 Read migration file successfully');
    
    // Execute the migration
    console.log('⚡ Executing migration...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the results
    console.log('\n🔍 Verifying migration results:');
    
    // Check tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('normalized_products', 'product_aliases')
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    console.log('📊 Created tables:', tablesResult.rows.map(r => r.table_name));
    
    // Check column
    const columnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'prices' 
      AND column_name = 'normalized_product_id'
    `;
    
    const columnResult = await pool.query(columnQuery);
    console.log('📋 prices.normalized_product_id column:', columnResult.rows.length > 0 ? 'EXISTS' : 'MISSING');
    
    // Check sample data
    const sampleQuery = 'SELECT COUNT(*) as count FROM normalized_products';
    const sampleResult = await pool.query(sampleQuery);
    console.log('🏷️ Sample normalized products:', sampleResult.rows[0].count);
    
    const aliasQuery = 'SELECT COUNT(*) as count FROM product_aliases';
    const aliasResult = await pool.query(aliasQuery);
    console.log('🔄 Sample aliases:', aliasResult.rows[0].count);
    
    console.log('\n🎉 Migration completed successfully! Ready to test normalization.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();