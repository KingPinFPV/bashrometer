// scripts/import-basar-data.js
// סקריפט ייבוא נתוני הבשרומטר למסד הנתונים

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// חיבור למסד נתונים
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function importBasarData() {
  console.log('🚀 מתחיל ייבוא נתוני הבשרומטר...');
  
  try {
    // בדיקת חיבור למסד נתונים
    const testConnection = await pool.query('SELECT NOW()');
    console.log('✅ חיבור למסד הנתונים הצליח');
    
    // קריאת קובץ הנתונים
    const dataPath = path.join(__dirname, 'basar-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    
    console.log(`📊 נטען קובץ נתונים עם ${data.products.length} מוצרים, ${data.retailers.length} קמעונאים, ו-${data.prices.length} מחירים`);
    
    // התחלת טרנזקציה
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // ייבוא קמעונאים
      console.log('🏪 מייבא קמעונאים...');
      let retailersImported = 0;
      
      for (const retailer of data.retailers) {
        // Check if retailer already exists
        const checkQuery = `SELECT id FROM retailers WHERE name = $1`;
        const existingRetailer = await client.query(checkQuery, [retailer.name]);
        
        if (existingRetailer.rows.length > 0) {
          console.log(`⏭️  קמעונאי כבר קיים: ${retailer.name}`);
          continue;
        }
        
        const query = `
          INSERT INTO retailers (name, address, website, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `;
        
        const values = [
          retailer.name,
          retailer.location, // Maps to address column
          retailer.website,
          retailer.notes || 'בשר טרי'
        ];
        
        const result = await client.query(query, values);
        if (result.rowCount > 0) {
          retailersImported++;
          console.log(`✅ הוסף קמעונאי: ${retailer.name}`);
        }
      }
      
      // ייבוא מוצרים
      console.log('🥩 מייבא מוצרים...');
      let productsImported = 0;
      
      for (const product of data.products) {
        // Check if product already exists
        const checkQuery = `SELECT id FROM products WHERE name = $1`;
        const existingProduct = await client.query(checkQuery, [product.name]);
        
        if (existingProduct.rows.length > 0) {
          console.log(`⏭️  מוצר כבר קיים: ${product.name}`);
          continue;
        }
        
        const query = `
          INSERT INTO products (name, category, cut_type, animal_type, brand, unit_of_measure, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `;
        
        const values = [
          product.name,
          product.category,
          product.cut_type,
          product.category, // Use category as animal_type for simplicity
          product.brand,
          product.weight_unit === 'kilogram' ? 'kg' : product.weight_unit
        ];
        
        const result = await client.query(query, values);
        if (result.rowCount > 0) {
          productsImported++;
          console.log(`✅ הוסף מוצר: ${product.name}`);
        }
      }
      
      // ייבוא מחירים
      console.log('💰 מייבא מחירים...');
      let pricesImported = 0;
      
      // קודם נקבל מיפוי של ID-ים
      const productIdMap = {};
      const productResult = await client.query('SELECT id, name FROM products');
      productResult.rows.forEach(row => {
        productIdMap[row.name] = row.id;
      });
      
      const retailerIdMap = {};
      const retailerResult = await client.query('SELECT id, name FROM retailers');
      retailerResult.rows.forEach(row => {
        retailerIdMap[row.name] = row.id;
      });
      
      for (const price of data.prices) {
        // מצא את המוצר והקמעונאי לפי ID במקור
        const originalProduct = data.products.find(p => p.id === price.product_id);
        const originalRetailer = data.retailers.find(r => r.id === price.retailer_id);
        
        if (!originalProduct || !originalRetailer) {
          console.log(`⚠️ לא נמצא מוצר או קמעונאי עבור מחיר ID ${price.id}`);
          continue;
        }
        
        const dbProductId = productIdMap[originalProduct.name];
        const dbRetailerId = retailerIdMap[originalRetailer.name];
        
        if (!dbProductId || !dbRetailerId) {
          console.log(`⚠️ לא נמצא ID במסד נתונים עבור ${originalProduct.name} או ${originalRetailer.name}`);
          continue;
        }
        
        const query = `
          INSERT INTO prices (
            product_id, retailer_id, regular_price, unit_for_price, 
            quantity_for_price, price_submission_date, status, source, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `;
        
        const values = [
          dbProductId,
          dbRetailerId,
          price.price,
          price.unit === 'kilogram' ? 'kg' : price.unit || 'kg',
          1.0, // כמות ברירת מחדל
          price.reported_date,
          price.status,
          'manual_import' // מקור הייבוא
        ];
        
        const result = await client.query(query, values);
        if (result.rowCount > 0) {
          pricesImported++;
          if (pricesImported % 50 === 0) {
            console.log(`💰 יובאו ${pricesImported} מחירים עד כה...`);
          }
        }
      }
      
      // אישור הטרנזקציה
      await client.query('COMMIT');
      
      console.log('🎉 ייבוא הנתונים הושלם בהצלחה!');
      console.log(`📊 סיכום נתונים שיובאו:`);
      console.log(`   קמעונאים: ${retailersImported}`);
      console.log(`   מוצרים: ${productsImported}`);
      console.log(`   מחירים: ${pricesImported}`);
      
      // בדיקת סה"כ נתונים במסד
      const totalRetailers = await client.query('SELECT COUNT(*) FROM retailers');
      const totalProducts = await client.query('SELECT COUNT(*) FROM products');
      const totalPrices = await client.query('SELECT COUNT(*) FROM prices');
      
      console.log(`📊 סיכום נתונים במסד:`);
      console.log(`   קמעונאים: ${totalRetailers.rows[0].count}`);
      console.log(`   מוצרים: ${totalProducts.rows[0].count}`);
      console.log(`   מחירים: ${totalPrices.rows[0].count}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ שגיאה בייבוא נתונים:', error);
    process.exit(1);
  }
}

// הרצת הייבוא
if (require.main === module) {
  importBasarData()
    .then(() => {
      console.log('✅ הייבוא הושלם בהצלחה');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ הייבוא נכשל:', error);
      process.exit(1);
    });
}

module.exports = { importBasarData };