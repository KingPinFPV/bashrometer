#!/usr/bin/env node
/**
 * Script לנרמול נתונים קיימים במסד הנתונים
 * הרצה: node scripts/normalizeExistingData.js
 */

require('dotenv').config();
const { normalizeProduct, getNormalizationStats } = require('../utils/productNormalizer');
const pool = require('../db');

// הגדרות הrscript
const BATCH_SIZE = 50; // כמות מוצרים לעבד בכל batch
const DELAY_BETWEEN_BATCHES = 1000; // המתנה במילישניות בין batches

/**
 * פונקציה לעכב ביצוע (sleep)
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * עדכון המחירים לקשר למוצר המנורמל
 */
async function updatePricesWithNormalizedProduct(originalProductName, normalizedProductId) {
  try {
    const updateQuery = `
      UPDATE prices 
      SET normalized_product_id = $1 
      WHERE product_id IN (
        SELECT id FROM products WHERE LOWER(name) = LOWER($2)
      ) AND normalized_product_id IS NULL
    `;
    
    const result = await pool.query(updateQuery, [normalizedProductId, originalProductName]);
    return result.rowCount;
  } catch (error) {
    console.error(`Error updating prices for product "${originalProductName}":`, error.message);
    return 0;
  }
}

/**
 * פונקציה ראשית לנרמול נתונים קיימים
 */
async function normalizeExistingData() {
  let client;
  
  try {
    console.log('🚀 Starting normalization of existing products...');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    // שליפת כל המוצרים הקיימים יחד עם מידע על הקמעונאים
    console.log('📊 Fetching existing products...');
    
    const existingProductsQuery = `
      SELECT DISTINCT 
        p.name as product_name,
        p.id as product_id,
        COUNT(DISTINCT pr.id) as price_reports_count,
        array_agg(DISTINCT r.id) FILTER (WHERE r.id IS NOT NULL) as retailer_ids,
        array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) as retailer_names
      FROM products p
      LEFT JOIN prices pr ON p.id = pr.product_id
      LEFT JOIN retailers r ON pr.retailer_id = r.id
      WHERE p.name IS NOT NULL 
        AND p.name != '' 
        AND LENGTH(TRIM(p.name)) > 0
      GROUP BY p.id, p.name
      HAVING COUNT(DISTINCT pr.id) > 0  -- רק מוצרים עם דיווחי מחירים
      ORDER BY price_reports_count DESC, p.name
    `;
    
    const existingProducts = await pool.query(existingProductsQuery);
    
    console.log(`📋 Found ${existingProducts.rows.length} unique products with price reports to normalize`);
    
    if (existingProducts.rows.length === 0) {
      console.log('ℹ️ No products found to normalize. Exiting.');
      return;
    }
    
    let processed = 0;
    let errors = 0;
    let skipped = 0;
    let totalPricesUpdated = 0;
    
    // עיבוד בbatches
    for (let i = 0; i < existingProducts.rows.length; i += BATCH_SIZE) {
      const batch = existingProducts.rows.slice(i, i + BATCH_SIZE);
      
      console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(existingProducts.rows.length / BATCH_SIZE)}`);
      console.log(`📦 Batch size: ${batch.length} products`);
      
      for (const product of batch) {
        try {
          const productName = product.product_name.trim();
          
          // דלג על שמות מוצרים קצרים מדי או לא תקינים
          if (productName.length < 2) {
            console.log(`⏭️ Skipping product with name too short: "${productName}"`);
            skipped++;
            continue;
          }
          
          console.log(`\n🔍 Processing: "${productName}" (${processed + skipped + errors + 1}/${existingProducts.rows.length})`);
          console.log(`   📊 Price reports: ${product.price_reports_count}`);
          console.log(`   🏪 Retailers: ${product.retailer_names ? product.retailer_names.length : 0}`);
          
          // בחירת retailer_id עיקרי (הראשון ברשימה)
          const primaryRetailerId = product.retailer_ids && product.retailer_ids.length > 0 ? product.retailer_ids[0] : null;
          
          // נרמול המוצר
          const normalized = await normalizeProduct(productName, primaryRetailerId);
          
          console.log(`   ✅ Normalized to: "${normalized.name}" (ID: ${normalized.id})`);
          
          // עדכון המחירים לקשר למוצר המנורמל
          const updatedPricesCount = await updatePricesWithNormalizedProduct(productName, normalized.id);
          totalPricesUpdated += updatedPricesCount;
          
          console.log(`   🔗 Updated ${updatedPricesCount} price records`);
          
          processed++;
          
          // הצגת progress כל 10 מוצרים
          if ((processed + errors + skipped) % 10 === 0) {
            console.log(`\n📈 Progress: ${processed + errors + skipped}/${existingProducts.rows.length} (${Math.round((processed + errors + skipped) / existingProducts.rows.length * 100)}%)`);
            console.log(`   ✅ Processed: ${processed}`);
            console.log(`   ❌ Errors: ${errors}`);
            console.log(`   ⏭️ Skipped: ${skipped}`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing product "${product.product_name}":`, error.message);
          errors++;
        }
      }
      
      // המתנה בין batches כדי לא להעמיס על המסד
      if (i + BATCH_SIZE < existingProducts.rows.length) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await sleep(DELAY_BETWEEN_BATCHES);
      }
    }
    
    console.log(`\n🎉 Normalization completed!`);
    console.log(`⏰ Finished at: ${new Date().toISOString()}`);
    console.log(`\n📊 Final Statistics:`);
    console.log(`   ✅ Successfully processed: ${processed} products`);
    console.log(`   ❌ Errors encountered: ${errors} products`);
    console.log(`   ⏭️ Skipped: ${skipped} products`);
    console.log(`   🔗 Total price records updated: ${totalPricesUpdated}`);
    
    // סטטיסטיקות מערכת הנרמול
    console.log(`\n📈 System Normalization Statistics:`);
    const stats = await getNormalizationStats();
    
    if (stats) {
      console.log(`   🏷️ Normalized products: ${stats.normalized_products_count}`);
      console.log(`   🔄 Total aliases: ${stats.total_aliases}`);
      console.log(`   📊 Average aliases per product: ${stats.avg_aliases_per_product}`);
      console.log(`   🏪 Retailers with aliases: ${stats.retailers_with_aliases || 'N/A'}`);
    }
    
    // בדיקת מוצרים ללא קישור לנרמול
    const unmappedPricesQuery = `
      SELECT COUNT(*) as unmapped_count
      FROM prices pr
      JOIN products p ON pr.product_id = p.id
      WHERE pr.normalized_product_id IS NULL
    `;
    
    const unmappedResult = await pool.query(unmappedPricesQuery);
    const unmappedCount = parseInt(unmappedResult.rows[0].unmapped_count);
    
    console.log(`\n⚠️ Quality Check:`);
    console.log(`   🔍 Price records without normalization: ${unmappedCount}`);
    
    if (unmappedCount > 0) {
      console.log(`   💡 Consider running the script again or manual review of unmapped items`);
    } else {
      console.log(`   ✅ All price records have been normalized successfully!`);
    }
    
    // דוגמאות של מוצרים מנורמלים
    console.log(`\n🏆 Top Normalized Products (by alias count):`);
    const topProductsQuery = `
      SELECT np.name, np.category, np.meat_type, COUNT(pa.id) as alias_count
      FROM normalized_products np
      LEFT JOIN product_aliases pa ON np.id = pa.normalized_product_id
      GROUP BY np.id, np.name, np.category, np.meat_type
      ORDER BY alias_count DESC
      LIMIT 5
    `;
    
    const topProducts = await pool.query(topProductsQuery);
    topProducts.rows.forEach((product, index) => {
      console.log(`   ${index + 1}. "${product.name}" (${product.category}, ${product.meat_type}) - ${product.alias_count} aliases`);
    });
    
    console.log(`\n🎯 Normalization process completed successfully! 🎯`);
    
  } catch (error) {
    console.error('💥 Fatal error during normalization:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // סגירת החיבור לבסיס הנתונים
    if (client) {
      client.release();
    }
    console.log(`\n👋 Closing database connections...`);
    process.exit(0);
  }
}

// בדיקת הרצה בlive mode או dry-run
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🧪 DRY RUN MODE - No changes will be made to the database');
  console.log('To run for real, execute: node scripts/normalizeExistingData.js');
  process.exit(0);
} else {
  console.log('🔴 LIVE MODE - Changes will be made to the database');
  console.log('To run in dry-run mode, execute: node scripts/normalizeExistingData.js --dry-run');
  
  // הרצת הscript
  normalizeExistingData();
}

// טיפול בsignals לעצירה נקיה
process.on('SIGINT', () => {
  console.log('\n⚠️ Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});