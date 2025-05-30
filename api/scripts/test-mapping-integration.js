// scripts/test-mapping-integration.js
// Test script for meat names mapping integration

require('dotenv').config();
const { 
  normalizeMeatNameWithMapping,
  cleanHebrewText,
  cleanHebrewTextForMapping,
  detectCategory,
  meatNamesMapping,
  reverseMeatNamesMapping
} = require('../utils/cutNormalizer');

async function testMappingIntegration() {
  console.log('🧪 Testing Meat Names Mapping Integration\n');
  
  // Test 1: Basic mapping loading
  console.log('📊 Basic Mapping Stats:');
  console.log(`   Normalized cuts in mapping: ${Object.keys(meatNamesMapping).length}`);
  console.log(`   Total variations in reverse mapping: ${Object.keys(reverseMeatNamesMapping).length}`);
  console.log('');
  
  // Test 2: Direct mapping matches
  console.log('🎯 Testing Direct Mapping Matches:');
  const directTests = [
    'אונטריב בקר',
    'אוסבוכו עגל',
    'אנטריקוט בקר',
    'בריסקט בקר'
  ];
  
  directTests.forEach(testName => {
    const result = normalizeMeatNameWithMapping(testName);
    if (result) {
      console.log(`   ✅ "${testName}" → "${result.normalizedName}" (${result.confidence}, ${result.source})`);
    } else {
      console.log(`   ❌ "${testName}" → No mapping found`);
    }
  });
  console.log('');
  
  // Test 3: Variation mapping
  console.log('🔄 Testing Variation Mapping:');
  const variationTests = [
    'צלעות בקר טרי',
    'אוסובוכו טרי',
    'אנטריקוט עם עצם',
    'בריסקט טרי מוכשר'
  ];
  
  variationTests.forEach(testName => {
    const result = normalizeMeatNameWithMapping(testName);
    if (result) {
      console.log(`   ✅ "${testName}" → "${result.normalizedName}" (${result.confidence}, ${result.source})`);
      if (result.matchedVariation) {
        console.log(`      Matched variation: "${result.matchedVariation}"`);
      }
    } else {
      console.log(`   ❌ "${testName}" → No mapping found`);
    }
  });
  console.log('');
  
  // Test 4: Text cleaning comparison
  console.log('🧹 Testing Text Cleaning:');
  const cleaningTests = [
    'צלעות בקר טרי מס\' 2',
    'אוסובוכו עגל "מוכשר" לפי משקל',
    'אנטריקוט בלק אנגוס פרמיום',
    'בריסקט טרי\\קפוא'
  ];
  
  cleaningTests.forEach(testName => {
    const basicClean = cleanHebrewText(testName);
    const mappingClean = cleanHebrewTextForMapping(testName);
    console.log(`   Original: "${testName}"`);
    console.log(`   Basic clean: "${basicClean}"`);
    console.log(`   Mapping clean: "${mappingClean}"`);
    console.log('');
  });
  
  // Test 5: Category detection
  console.log('🏷️ Testing Category Detection:');
  const categoryTests = [
    'אונטריב בקר',
    'חזה עוף',
    'פילה סלמון',
    'צלעות חזיר'
  ];
  
  categoryTests.forEach(testName => {
    const category = detectCategory(testName);
    console.log(`   "${testName}" → Category: ${category || 'לא זוהה'}`);
  });
  console.log('');
  
  // Test 6: Sample from each major category in mapping
  console.log('📋 Sample Mappings by Category:');
  const sampleByCategory = {};
  
  Object.entries(meatNamesMapping).forEach(([normalized, variations]) => {
    const category = detectCategory(normalized);
    if (category && !sampleByCategory[category]) {
      sampleByCategory[category] = {
        normalized,
        sampleVariations: variations.slice(0, 3)
      };
    }
  });
  
  Object.entries(sampleByCategory).forEach(([category, data]) => {
    console.log(`   ${category}:`);
    console.log(`     Normalized: "${data.normalized}"`);
    console.log(`     Sample variations: ${data.sampleVariations.map(v => `"${v}"`).join(', ')}`);
    console.log('');
  });
  
  // Test 7: Performance test
  console.log('⚡ Performance Test (1000 lookups):');
  const performanceTests = [
    'אונטריב בקר',
    'צלעות טרי',
    'אנטריקוט',
    'פילה בקר',
    'לא קיים במיפוי'
  ];
  
  const start = Date.now();
  for (let i = 0; i < 1000; i++) {
    const testName = performanceTests[i % performanceTests.length];
    normalizeMeatNameWithMapping(testName);
  }
  const end = Date.now();
  
  console.log(`   Time for 1000 lookups: ${end - start}ms`);
  console.log(`   Average per lookup: ${((end - start) / 1000).toFixed(2)}ms`);
  console.log('');
  
  // Test 8: Edge cases
  console.log('🚨 Testing Edge Cases:');
  const edgeCases = [
    '', // Empty string
    '   ', // Only spaces
    'xyz123', // No Hebrew
    'אנטרקוט', // Common misspelling
    'BEEF RIBS', // English
    null, // Null
    undefined // Undefined
  ];
  
  edgeCases.forEach(testCase => {
    try {
      const result = normalizeMeatNameWithMapping(testCase);
      console.log(`   "${testCase}" → ${result ? `"${result.normalizedName}"` : 'No mapping'}`);
    } catch (error) {
      console.log(`   "${testCase}" → Error: ${error.message}`);
    }
  });
  
  console.log('\n✅ Mapping Integration Test Completed!');
  console.log('\n📊 Summary:');
  console.log(`   • Loaded ${Object.keys(meatNamesMapping).length} normalized cuts`);
  console.log(`   • Loaded ${Object.keys(reverseMeatNamesMapping).length} total variations`);
  console.log(`   • Direct mapping tests: ${directTests.length} performed`);
  console.log(`   • Variation mapping tests: ${variationTests.length} performed`);
  console.log(`   • Performance: ~${((end - start) / 1000).toFixed(2)}ms per lookup`);
}

// Run the test
testMappingIntegration().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});