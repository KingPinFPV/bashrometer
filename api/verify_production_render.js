// Production verification script using direct Render PostgreSQL connection
const { Pool } = require('pg');

// Production database connection config from Render
const pool = new Pool({
  user: 'user',
  host: 'dpg-d0s4po15pdvs73974930-a.frankfurt-postgres.render.com',
  database: 'bashrometer_36mx',
  password: 'xrOjercAVYbki5i3r2lgndRISXqnxUwq',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

async function verifyProductionRender() {
  try {
    console.log('🔍 Connecting to PRODUCTION Render Database...\n');
    
    // 1. Test connection
    const timeCheck = await pool.query('SELECT NOW() as server_time');
    console.log('✅ Connected to production database');
    console.log(`🕐 Server time: ${timeCheck.rows[0].server_time}\n`);
    
    // 2. Get complete products table schema
    console.log('1️⃣ PRODUCTION PRODUCTS TABLE SCHEMA');
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Products table schema:');
    columnsCheck.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check for new cut system fields
    const hasNewFields = {
      cut_id: columnsCheck.rows.some(col => col.column_name === 'cut_id'),
      product_subtype_id: columnsCheck.rows.some(col => col.column_name === 'product_subtype_id'),
      status: columnsCheck.rows.some(col => col.column_name === 'status'),
      approved_at: columnsCheck.rows.some(col => col.column_name === 'approved_at'),
      created_by_user_id: columnsCheck.rows.some(col => col.column_name === 'created_by_user_id')
    };
    
    console.log('\n🔄 Migration status:');
    Object.entries(hasNewFields).forEach(([field, exists]) => {
      console.log(`   ${field}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
    // 3. Sample products data
    console.log('\n2️⃣ SAMPLE PRODUCTS DATA');
    const productCount = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log(`📦 Total products: ${productCount.rows[0].count}`);
    
    const productSample = await pool.query(`
      SELECT id, name, category, animal_type, cut_type, cut_id, brand, is_active
      FROM products 
      ORDER BY id 
      LIMIT 10;
    `);
    
    console.log('📋 Sample products:');
    productSample.rows.forEach(product => {
      console.log(`   ID ${product.id}: ${product.name}`);
      console.log(`     Category: ${product.category || 'NULL'}`);
      console.log(`     Animal Type: ${product.animal_type || 'NULL'}`);
      console.log(`     Cut Type: ${product.cut_type || 'NULL'}`);
      console.log(`     Cut ID: ${product.cut_id || 'NULL'}`);
      console.log(`     Active: ${product.is_active}`);
      console.log('');
    });
    
    // 4. Categories analysis
    console.log('3️⃣ CATEGORIES ANALYSIS');
    const categoryDist = await pool.query(`
      SELECT category, COUNT(*) as count 
      FROM products 
      WHERE category IS NOT NULL 
      GROUP BY category 
      ORDER BY count DESC;
    `);
    
    console.log('📂 Category distribution:');
    categoryDist.rows.forEach(cat => {
      const isHebrew = /[\u0590-\u05FF]/.test(cat.category);
      console.log(`   "${cat.category}": ${cat.count} products ${isHebrew ? '(Hebrew)' : '(English/Other)'}`);
    });
    
    // 5. Cuts table verification
    console.log('\n4️⃣ CUTS TABLE VERIFICATION');
    try {
      const cutsCount = await pool.query('SELECT COUNT(*) as count FROM cuts');
      const cutsSample = await pool.query(`
        SELECT id, name, hebrew_name, category 
        FROM cuts 
        ORDER BY category, id 
        LIMIT 10;
      `);
      
      console.log(`🔪 Cuts table: ${cutsCount.rows[0].count} records`);
      console.log('Sample cuts:');
      cutsSample.rows.forEach(cut => {
        console.log(`   ${cut.id}: ${cut.name} (${cut.hebrew_name}) - ${cut.category}`);
      });
      
    } catch (error) {
      console.log('❌ Cuts table error:', error.message);
    }
    
    // 6. Product subtypes verification
    console.log('\n5️⃣ PRODUCT SUBTYPES VERIFICATION');
    try {
      const subtypesCount = await pool.query('SELECT COUNT(*) as count FROM product_subtypes');
      const subtypesSample = await pool.query(`
        SELECT ps.id, ps.hebrew_description, ps.cut_id, c.hebrew_name as cut_name
        FROM product_subtypes ps
        LEFT JOIN cuts c ON ps.cut_id = c.id
        ORDER BY ps.cut_id, ps.id
        LIMIT 10;
      `);
      
      console.log(`🔧 Product subtypes: ${subtypesCount.rows[0].count} records`);
      console.log('Sample subtypes:');
      subtypesSample.rows.forEach(subtype => {
        console.log(`   ${subtype.id}: ${subtype.hebrew_description} (Cut: ${subtype.cut_name})`);
      });
      
    } catch (error) {
      console.log('❌ Product subtypes table error:', error.message);
    }
    
    // 7. Prices table analysis
    console.log('\n6️⃣ PRICES TABLE ANALYSIS');
    const pricesCount = await pool.query('SELECT COUNT(*) as count FROM prices');
    const recentPrices = await pool.query(`
      SELECT COUNT(*) as count 
      FROM prices 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `);
    
    console.log(`💰 Total prices: ${pricesCount.rows[0].count}`);
    console.log(`📅 Recent prices (30 days): ${recentPrices.rows[0].count}`);
    
    if (pricesCount.rows[0].count > 0) {
      const pricesSample = await pool.query(`
        SELECT p.id, p.product_id, p.regular_price, p.sale_price, 
               p.is_on_sale, p.retailer_id, p.created_at,
               pr.name as product_name
        FROM prices p
        LEFT JOIN products pr ON p.product_id = pr.id
        ORDER BY p.created_at DESC
        LIMIT 5;
      `);
      
      console.log('Recent price reports:');
      pricesSample.rows.forEach(price => {
        console.log(`   Price ${price.id}: ${price.product_name || 'Unknown Product'}`);
        console.log(`     Regular: ₪${price.regular_price}, Sale: ${price.sale_price || 'None'}`);
        console.log(`     Date: ${price.created_at.toISOString().split('T')[0]}`);
      });
    }
    
    // 8. Users and authentication
    console.log('\n7️⃣ USERS TABLE ANALYSIS');
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const rolesCount = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY count DESC;
    `);
    
    console.log(`👥 Total users: ${usersCount.rows[0].count}`);
    console.log('User roles:');
    rolesCount.rows.forEach(role => {
      console.log(`   ${role.role}: ${role.count} users`);
    });
    
    console.log('\n✅ PRODUCTION DATABASE VERIFICATION COMPLETE');
    
  } catch (error) {
    console.error('❌ Production verification failed:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

verifyProductionRender();