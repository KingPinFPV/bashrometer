require('dotenv').config();
const pool = require('./db');

async function verifyFixes() {
  try {
    console.log('🔍 Verifying Critical Production Fixes...\n');
    
    // 1. Check product data consistency
    console.log('1️⃣ PRODUCT DATA CONSISTENCY CHECK');
    const productCheck = await pool.query(`
      SELECT id, name, category, cut_id, product_subtype_id, 
             animal_type, cut_type, status
      FROM products 
      WHERE id IN (6, 32, 33) 
      ORDER BY id;
    `);
    
    console.log('📊 Sample product data:');
    productCheck.rows.forEach(product => {
      console.log(`   Product ${product.id}: ${product.name}`);
      console.log(`     Category: ${product.category || 'NULL'}`);
      console.log(`     Cut ID: ${product.cut_id || 'NULL'}`);
      console.log(`     Subtype ID: ${product.product_subtype_id || 'NULL'}`);
      console.log(`     Status: ${product.status || 'NULL'}`);
      console.log(`     Deprecated fields: animal_type=${product.animal_type || 'NULL'}, cut_type=${product.cut_type || 'NULL'}`);
      console.log('');
    });
    
    // 2. Check category values consistency
    console.log('2️⃣ CATEGORY VALUES CONSISTENCY CHECK');
    const categoryCheck = await pool.query(`
      SELECT DISTINCT category, COUNT(*) as count 
      FROM products 
      WHERE category IS NOT NULL 
      GROUP BY category 
      ORDER BY count DESC;
    `);
    
    console.log('📂 Category distribution:');
    categoryCheck.rows.forEach(cat => {
      console.log(`   "${cat.category}": ${cat.count} products`);
    });
    
    // 3. Check cuts and subtypes relationship
    console.log('\n3️⃣ CUTS AND SUBTYPES RELATIONSHIP CHECK');
    const cutsCheck = await pool.query(`
      SELECT c.id, c.hebrew_name, c.category, 
             COUNT(ps.id) as subtype_count
      FROM cuts c
      LEFT JOIN product_subtypes ps ON c.id = ps.cut_id
      WHERE c.category IN ('בקר', 'עוף', 'טלה')
      GROUP BY c.id, c.hebrew_name, c.category
      ORDER BY c.category, c.id
      LIMIT 10;
    `);
    
    console.log('🔪 Cuts and subtypes sample:');
    cutsCheck.rows.forEach(cut => {
      console.log(`   Cut ${cut.id}: ${cut.hebrew_name} (${cut.category}) - ${cut.subtype_count} subtypes`);
    });
    
    // 4. Check for products with invalid foreign keys
    console.log('\n4️⃣ FOREIGN KEY VALIDATION CHECK');
    const fkCheck = await pool.query(`
      SELECT p.id, p.name, p.cut_id, p.product_subtype_id,
             c.id as cut_exists,
             ps.id as subtype_exists,
             ps.cut_id as subtype_cut_id
      FROM products p
      LEFT JOIN cuts c ON p.cut_id = c.id
      LEFT JOIN product_subtypes ps ON p.product_subtype_id = ps.id
      WHERE (p.cut_id IS NOT NULL AND c.id IS NULL)
         OR (p.product_subtype_id IS NOT NULL AND ps.id IS NULL)
         OR (p.cut_id IS NOT NULL AND p.product_subtype_id IS NOT NULL AND ps.cut_id != p.cut_id)
      LIMIT 10;
    `);
    
    if (fkCheck.rows.length === 0) {
      console.log('✅ No foreign key validation issues found');
    } else {
      console.log('❌ Found foreign key issues:');
      fkCheck.rows.forEach(issue => {
        console.log(`   Product ${issue.id}: ${issue.name}`);
        console.log(`     Cut ID ${issue.cut_id} exists: ${issue.cut_exists ? 'YES' : 'NO'}`);
        console.log(`     Subtype ID ${issue.product_subtype_id} exists: ${issue.subtype_exists ? 'YES' : 'NO'}`);
        if (issue.subtype_exists && issue.subtype_cut_id !== issue.cut_id) {
          console.log(`     ⚠️  Subtype belongs to cut ${issue.subtype_cut_id}, not ${issue.cut_id}`);
        }
      });
    }
    
    // 5. Check recent price reports for data integrity
    console.log('\n5️⃣ PRICE REPORTS DATA INTEGRITY CHECK');
    const priceCheck = await pool.query(`
      SELECT id, product_id, regular_price, sale_price, 
             is_on_sale, retailer_id, created_at
      FROM prices 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    
    console.log('💰 Recent price reports sample:');
    if (priceCheck.rows.length === 0) {
      console.log('   No recent price reports found');
    } else {
      priceCheck.rows.forEach(price => {
        console.log(`   Price ${price.id}: Product ${price.product_id}, Regular: ₪${price.regular_price}`);
        console.log(`     Sale: ${price.sale_price ? '₪' + price.sale_price : 'NULL'}, On Sale: ${price.is_on_sale}`);
        console.log(`     Retailer: ${price.retailer_id}, Date: ${price.created_at.toISOString().split('T')[0]}`);
      });
    }
    
    console.log('\n✅ VERIFICATION COMPLETE');
    console.log('📊 All critical data checks completed successfully');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

verifyFixes();