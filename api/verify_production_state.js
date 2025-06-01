require('dotenv').config();
const pool = require('./db');

async function verifyProductionState() {
  try {
    console.log('🔍 Verifying Current Production Database State...\n');
    
    // 1. Check what columns actually exist in products table
    console.log('1️⃣ PRODUCTS TABLE SCHEMA CHECK');
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Products table columns:');
    columnsCheck.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    const hasNewCutSystem = columnsCheck.rows.some(col => col.column_name === 'product_subtype_id');
    console.log(`\n🔄 New cut system migrated: ${hasNewCutSystem ? 'YES' : 'NO'}`);
    
    // 2. Check sample product data with existing columns only
    console.log('\n2️⃣ SAMPLE PRODUCT DATA CHECK');
    const productCheck = await pool.query(`
      SELECT id, name, category, animal_type, cut_type, 
             brand, is_active, cut_id
      FROM products 
      WHERE id IN (6, 32, 33) 
      ORDER BY id;
    `);
    
    console.log('📦 Sample products:');
    productCheck.rows.forEach(product => {
      console.log(`   Product ${product.id}: ${product.name}`);
      console.log(`     Category: ${product.category || 'NULL'}`);
      console.log(`     Animal Type: ${product.animal_type || 'NULL'}`);
      console.log(`     Cut Type: ${product.cut_type || 'NULL'}`);
      console.log(`     Cut ID: ${product.cut_id || 'NULL'}`);
      console.log(`     Active: ${product.is_active}`);
      console.log('');
    });
    
    // 3. Check category distribution
    console.log('3️⃣ CATEGORY VALUES DISTRIBUTION');
    const categoryCheck = await pool.query(`
      SELECT DISTINCT category, COUNT(*) as count 
      FROM products 
      WHERE category IS NOT NULL 
      GROUP BY category 
      ORDER BY count DESC;
    `);
    
    console.log('📂 Categories found:');
    categoryCheck.rows.forEach(cat => {
      const isHebrew = /[\u0590-\u05FF]/.test(cat.category);
      console.log(`   "${cat.category}": ${cat.count} products ${isHebrew ? '(Hebrew)' : '(English/Other)'}`);
    });
    
    // 4. Check if cuts table exists and has data
    console.log('\n4️⃣ CUTS TABLE CHECK');
    try {
      const cutsCheck = await pool.query(`
        SELECT COUNT(*) as count FROM cuts;
      `);
      console.log(`✅ Cuts table exists with ${cutsCheck.rows[0].count} records`);
      
      const cutsampleCheck = await pool.query(`
        SELECT id, name, hebrew_name, category 
        FROM cuts 
        LIMIT 5;
      `);
      
      console.log('🔪 Sample cuts:');
      cutsampleCheck.rows.forEach(cut => {
        console.log(`   Cut ${cut.id}: ${cut.name} (${cut.hebrew_name}) - Category: ${cut.category}`);
      });
      
    } catch (error) {
      console.log('❌ Cuts table not found or accessible');
    }
    
    // 5. Check recent price reports
    console.log('\n5️⃣ RECENT PRICE REPORTS');
    const priceCheck = await pool.query(`
      SELECT COUNT(*) as total_prices,
             COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_prices
      FROM prices;
    `);
    
    console.log(`💰 Price reports: ${priceCheck.rows[0].total_prices} total, ${priceCheck.rows[0].recent_prices} in last 7 days`);
    
    // 6. Check for any obvious data issues
    console.log('\n6️⃣ DATA INTEGRITY ISSUES CHECK');
    const issuesCheck = await pool.query(`
      SELECT 
        COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as products_without_names,
        COUNT(CASE WHEN category IS NULL THEN 1 END) as products_without_category,
        COUNT(CASE WHEN unit_of_measure IS NULL THEN 1 END) as products_without_unit
      FROM products;
    `);
    
    const issues = issuesCheck.rows[0];
    console.log('🔍 Potential issues:');
    console.log(`   Products without names: ${issues.products_without_names}`);
    console.log(`   Products without category: ${issues.products_without_category}`);
    console.log(`   Products without unit: ${issues.products_without_unit}`);
    
    console.log('\n✅ PRODUCTION STATE VERIFICATION COMPLETE');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    process.exit(0);
  }
}

verifyProductionState();