// scripts/run-cuts-migration.js
// Script to run the cuts normalization migration and verify setup

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function runCutsMigration() {
  try {
    console.log('🚀 Starting cuts normalization migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '006_create_cuts_normalization.sql');
    
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
      AND table_name IN ('normalized_cuts', 'cut_variations')
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    console.log('📊 Created tables:', tablesResult.rows.map(r => r.table_name));
    
    // Check indexes
    const indexesQuery = `
      SELECT indexname, tablename
      FROM pg_indexes 
      WHERE tablename IN ('normalized_cuts', 'cut_variations')
      AND schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    const indexesResult = await pool.query(indexesQuery);
    console.log('🔗 Created indexes:', indexesResult.rows.length);
    
    // Check sample data
    const cutsQuery = 'SELECT COUNT(*) as count, category FROM normalized_cuts GROUP BY category ORDER BY category';
    const cutsResult = await pool.query(cutsQuery);
    console.log('🥩 Sample normalized cuts by category:');
    cutsResult.rows.forEach(row => {
      console.log(`   ${row.category}: ${row.count} cuts`);
    });
    
    const variationsQuery = 'SELECT COUNT(*) as count FROM cut_variations';
    const variationsResult = await pool.query(variationsQuery);
    console.log('🔄 Sample variations:', variationsResult.rows[0].count);
    
    // Test the view
    const viewQuery = 'SELECT * FROM cuts_normalization_stats ORDER BY category';
    const viewResult = await pool.query(viewQuery);
    console.log('\n📈 Normalization statistics:');
    viewResult.rows.forEach(row => {
      console.log(`   ${row.category}: ${row.normalized_cuts_count} cuts, ${row.variations_count} variations, ${(row.avg_confidence * 100).toFixed(1)}% avg confidence`);
    });
    
    // Test similarity search
    console.log('\n🔍 Testing similarity search...');
    const similarityQuery = `
      SELECT name, similarity(name, 'אנטרקוט') as sim_score
      FROM normalized_cuts 
      WHERE similarity(name, 'אנטרקוט') > 0.3
      ORDER BY sim_score DESC
      LIMIT 3;
    `;
    
    const similarityResult = await pool.query(similarityQuery);
    console.log('🎯 Similarity test results for "אנטרקוט":');
    similarityResult.rows.forEach(row => {
      console.log(`   ${row.name}: ${(row.sim_score * 100).toFixed(1)}% similarity`);
    });
    
    console.log('\n🎉 Migration completed successfully! Ready to use cuts normalization system.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.pool?.end();
    process.exit(0);
  }
}

// Test cuts normalizer utility
async function testCutsNormalizer() {
  try {
    console.log('\n🧪 Testing cuts normalizer utility...');
    
    const { 
      analyzeCut, 
      cleanHebrewText, 
      detectCategory,
      calculateSimilarity 
    } = require('../utils/cutNormalizer');
    
    // Test text cleaning
    console.log('\n📝 Testing text cleaning:');
    const testTexts = [
      'אנטרקוט  בקר!!!',
      'CHICKEN חזה',
      '  פילה    דג  '
    ];
    
    testTexts.forEach(text => {
      const cleaned = cleanHebrewText(text);
      console.log(`   "${text}" → "${cleaned}"`);
    });
    
    // Test category detection
    console.log('\n🏷️ Testing category detection:');
    const categoryTests = [
      'אנטריקוט בקר',
      'חזה עוף טרי',
      'פילה סלמון נורווגי'
    ];
    
    categoryTests.forEach(text => {
      const category = detectCategory(text);
      console.log(`   "${text}" → ${category || 'לא זוהה'}`);
    });
    
    // Test similarity calculation
    console.log('\n📊 Testing similarity calculation:');
    const similarityTests = [
      ['אנטריקוט', 'אנטרקוט'],
      ['פילה', 'פילה בקר'],
      ['חזה עוף', 'חזה'],
      ['סלמון', 'טונה']
    ];
    
    similarityTests.forEach(([str1, str2]) => {
      const similarity = calculateSimilarity(str1, str2);
      console.log(`   "${str1}" ↔ "${str2}": ${(similarity * 100).toFixed(1)}%`);
    });
    
    // Test cut analysis
    console.log('\n🔬 Testing cut analysis:');
    const analysisTests = [
      'אנטרקוט בלק אנגוס',
      'פילה עוף ללא עור',
      'טחון בקר 80%'
    ];
    
    for (const cutName of analysisTests) {
      try {
        const analysis = await analyzeCut(cutName);
        console.log(`   "${cutName}":`);
        console.log(`     קטגוריה: ${analysis.suggestedCategory || 'לא זוהתה'}`);
        console.log(`     סוג נתח: ${analysis.suggestedCutType || 'לא זוהה'}`);
        console.log(`     שם מנורמל: ${analysis.suggestedNormalizedName}`);
        console.log(`     ביטחון: ${(analysis.confidence * 100).toFixed(1)}%`);
      } catch (error) {
        console.log(`     שגיאה: ${error.message}`);
      }
    }
    
    console.log('\n✅ Utility testing completed!');
    
  } catch (error) {
    console.error('❌ Utility testing failed:', error.message);
  }
}

// Main execution
async function main() {
  await runCutsMigration();
  await testCutsNormalizer();
}

main();