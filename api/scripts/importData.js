const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function importCutsFromBasarData() {
  console.log('🔄 Importing cuts data from basar-data.json...');
  
  try {
    const basarDataPath = path.join(__dirname, 'basar-data.json');
    if (!fs.existsSync(basarDataPath)) {
      console.log('❌ basar-data.json not found, skipping basar data import');
      return;
    }
    
    const basarData = JSON.parse(fs.readFileSync(basarDataPath, 'utf8'));
    const products = basarData.products || [];
    
    // Extract unique categories and cuts
    const cutCategories = new Set();
    const productsByCategory = {};
    
    products.forEach(product => {
      if (product.category && product.name) {
        cutCategories.add(product.category);
        
        if (!productsByCategory[product.category]) {
          productsByCategory[product.category] = [];
        }
        productsByCategory[product.category].push(product);
      }
    });
    
    console.log(`📊 Found ${cutCategories.size} categories with ${products.length} products`);
    
    for (const product of products) {
      if (!product.name || !product.category) continue;
      
      // Check if cut already exists
      const existing = await pool.query(
        'SELECT id FROM cuts WHERE name = $1 AND category = $2',
        [product.name, product.category]
      );
      
      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO cuts (name, category, hebrew_name, description) VALUES ($1, $2, $3, $4)',
          [
            product.name, 
            product.category, 
            product.name, // Hebrew name is the same as name for now
            `${product.cut_type || ''} - יובא מהבשרומטר`
          ]
        );
        console.log(`✅ Added cut: ${product.name} (${product.category})`);
      } else {
        console.log(`⏭️  Cut already exists: ${product.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Error importing cuts from basar data:', error);
  }
}

async function importProductsFromBasarData() {
  console.log('🔄 Importing products data from basar-data.json...');
  
  try {
    const basarDataPath = path.join(__dirname, 'basar-data.json');
    if (!fs.existsSync(basarDataPath)) {
      console.log('❌ basar-data.json not found, skipping products import');
      return;
    }
    
    const basarData = JSON.parse(fs.readFileSync(basarDataPath, 'utf8'));
    const products = basarData.products || [];
    
    for (const product of products) {
      if (!product.name) continue;
      
      // Check if product already exists
      const existing = await pool.query(
        'SELECT id FROM products WHERE name = $1',
        [product.name]
      );
      
      if (existing.rows.length === 0) {
        // Find matching cut_id
        let cutId = null;
        if (product.category && product.name) {
          const cutResult = await pool.query(
            'SELECT id FROM cuts WHERE name = $1 AND category = $2',
            [product.name, product.category]
          );
          if (cutResult.rows.length > 0) {
            cutId = cutResult.rows[0].id;
          }
        }
        
        await pool.query(`
          INSERT INTO products (
            name, category, brand, cut_id, kosher_level, 
            unit_of_measure, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
          product.name,
          product.category || null,
          product.brand || null,
          cutId,
          product.kosher_type || 'unknown',
          product.weight_unit === 'kilogram' ? 'kg' : '100g'
        ]);
        console.log(`✅ Added product: ${product.name}`);
      } else {
        console.log(`⏭️  Product already exists: ${product.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Error importing products from basar data:', error);
  }
}

async function importRetailersFromBasarData() {
  console.log('🔄 Importing retailers data from basar-data.json...');
  
  try {
    const basarDataPath = path.join(__dirname, 'basar-data.json');
    if (!fs.existsSync(basarDataPath)) {
      console.log('❌ basar-data.json not found, skipping retailers import');
      return;
    }
    
    const basarData = JSON.parse(fs.readFileSync(basarDataPath, 'utf8'));
    const retailers = basarData.retailers || [];
    
    for (const retailer of retailers) {
      if (!retailer.name) continue;
      
      const existing = await pool.query(
        'SELECT id FROM retailers WHERE name = $1',
        [retailer.name]
      );
      
      if (existing.rows.length === 0) {
        await pool.query(`
          INSERT INTO retailers (
            name, location, website, created_at
          ) VALUES ($1, $2, $3, NOW())
        `, [
          retailer.name,
          retailer.location || retailer.city || '',
          retailer.website || ''
        ]);
        console.log(`✅ Added retailer: ${retailer.name}`);
      } else {
        console.log(`⏭️  Retailer already exists: ${retailer.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Error importing retailers from basar data:', error);
  }
}

async function importNormalizedCuts() {
  console.log('🔄 Importing normalized cuts...');
  
  try {
    const cutsPath = path.join(__dirname, '../data/normalized_cuts.json');
    if (!fs.existsSync(cutsPath)) {
      console.log('❌ normalized_cuts.json not found, skipping normalized cuts import');
      return;
    }
    
    const cutsData = JSON.parse(fs.readFileSync(cutsPath, 'utf8'));
    
    for (const cutName of cutsData) {
      if (!cutName) continue;
      
      // Try to determine category from the name
      let category = 'בקר'; // Default
      if (cutName.includes('עוף') || cutName.includes('חזה')) category = 'עופות';
      if (cutName.includes('כבש') || cutName.includes('טלה')) category = 'כבש';
      if (cutName.includes('הודו')) category = 'הודו';
      if (cutName.includes('חזיר')) category = 'חזיר';
      if (cutName.includes('אווז') || cutName.includes('ברווז')) category = 'ברווזים ואווזים';
      
      const existing = await pool.query(
        'SELECT id FROM cuts WHERE name = $1',
        [cutName]
      );
      
      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO cuts (name, category, hebrew_name, description) VALUES ($1, $2, $3, $4)',
          [cutName, category, cutName, 'יובא מרשימה מנורמלת']
        );
        console.log(`✅ Added normalized cut: ${cutName} (${category})`);
      } else {
        console.log(`⏭️  Normalized cut already exists: ${cutName}`);
      }
    }
  } catch (error) {
    console.error('❌ Error importing normalized cuts:', error);
  }
}

async function updateProductStatistics() {
  console.log('📊 Updating product statistics...');
  
  try {
    // Update cuts with product counts
    await pool.query(`
      UPDATE cuts SET description = 
        COALESCE(description, '') || ' (' || 
        (SELECT COUNT(*) FROM products WHERE cut_id = cuts.id AND is_active = TRUE) || 
        ' מוצרים)'
      WHERE id IN (SELECT DISTINCT cut_id FROM products WHERE cut_id IS NOT NULL)
    `);
    
    console.log('✅ Updated cuts with product counts');
    
    // Get final statistics
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as total_products,
        (SELECT COUNT(*) FROM cuts) as total_cuts,
        (SELECT COUNT(*) FROM retailers WHERE is_active = TRUE) as total_retailers,
        (SELECT COUNT(DISTINCT category) FROM cuts) as total_categories
    `);
    
    console.log('📈 Final Statistics:');
    console.log(`   Products: ${stats.rows[0].total_products}`);
    console.log(`   Cuts: ${stats.rows[0].total_cuts}`);
    console.log(`   Retailers: ${stats.rows[0].total_retailers}`);
    console.log(`   Categories: ${stats.rows[0].total_categories}`);
    
  } catch (error) {
    console.error('❌ Error updating statistics:', error);
  }
}

async function main() {
  console.log('🚀 Starting comprehensive data import...');
  
  try {
    // Step 1: Import cuts and basic data from basar-data.json
    await importCutsFromBasarData();
    
    // Step 2: Import additional normalized cuts
    await importNormalizedCuts();
    
    // Step 3: Import products 
    await importProductsFromBasarData();
    
    // Step 4: Import retailers
    await importRetailersFromBasarData();
    
    // Step 5: Update statistics
    await updateProductStatistics();
    
    console.log('✅ Comprehensive data import completed successfully!');
    console.log('🎯 Next steps: Review data in admin panel and approve pending products');
    
  } catch (error) {
    console.error('❌ Data import failed:', error);
    process.exit(1);
  } finally {
    if (pool && pool.end) {
      await pool.end();
    }
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Import interrupted by user');
  if (pool && pool.end) {
    await pool.end();
  }
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('💥 Uncaught exception:', error);
  if (pool && pool.end) {
    await pool.end();
  }
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = { 
  importCutsFromBasarData,
  importProductsFromBasarData, 
  importRetailersFromBasarData,
  importNormalizedCuts,
  updateProductStatistics
};