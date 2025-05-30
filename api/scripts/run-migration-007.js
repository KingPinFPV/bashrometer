// scripts/run-migration-007.js
const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function runMigration() {
  try {
    console.log('🔄 Running migration 007: Create cuts and sale prices...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/007_create_cuts_and_sale_prices.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the entire migration as one transaction
    console.log(`📝 Executing migration SQL...`);
    await pool.query(migrationSQL);
    
    console.log('✅ Migration 007 completed successfully!');
    
    // Test the migration by checking if cuts table exists and has data
    const cutsCheck = await pool.query('SELECT COUNT(*) as count FROM cuts');
    console.log(`🔍 Cuts table has ${cutsCheck.rows[0].count} entries`);
    
    // Check if price columns were added
    const priceColumnsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'prices' 
      AND column_name IN ('is_sale', 'sale_end_date', 'original_price')
    `);
    console.log(`🔍 Added ${priceColumnsCheck.rows.length} new columns to prices table`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();