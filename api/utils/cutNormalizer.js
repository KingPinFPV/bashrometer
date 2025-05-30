// utils/cutNormalizer.js
// Hebrew meat cuts normalization utilities

const pool = require('../db');
const fs = require('fs');
const path = require('path');

// Load external meat names mapping
let meatNamesMapping = {};
let reverseMeatNamesMapping = {}; // For faster reverse lookup
try {
  const mappingData = fs.readFileSync(
    path.join(__dirname, '../data/meat_names_mapping.json'), 
    'utf8'
  );
  meatNamesMapping = JSON.parse(mappingData);
  
  // Create reverse mapping for faster lookups
  Object.entries(meatNamesMapping).forEach(([normalizedName, variations]) => {
    variations.forEach(variation => {
      const cleanVariation = variation.trim().toLowerCase();
      reverseMeatNamesMapping[cleanVariation] = normalizedName;
    });
    // Also map the normalized name to itself
    reverseMeatNamesMapping[normalizedName.toLowerCase()] = normalizedName;
  });
  
  console.log(`✅ Loaded ${Object.keys(meatNamesMapping).length} meat name mappings with ${Object.keys(reverseMeatNamesMapping).length} total variations`);
} catch (error) {
  console.warn('⚠️ Could not load meat names mapping:', error.message);
  console.warn('Falling back to built-in mappings only');
}

/**
 * Mapping tables for Hebrew meat cut normalization
 */
const cutMappings = {
  // Beef cuts - נתחי בקר
  'אנטריקוט': [
    'אנטרקוט', 'אנטירקוט', 'אנטריקוט בקר', 'אנטריקוט עם עצם',
    'אנטריקוט ללא עצם', 'אנטרקוט בלק אנגוס', 'אנטריקוט פרמיום',
    'entrecote', 'ribeye'
  ],
  'פילה בקר': [
    'פילה', 'פילה מדומה', 'פאלש פילה', 'false fillet',
    'טנדרלוין', 'tenderloin', 'פילה טרי', 'פילה מיובש'
  ],
  'פרימיום רוסט': [
    'רוסט', 'רוסט בקר', 'צלי בקר', 'צלי פרמיום',
    'prime rib', 'rib roast', 'רוסט עם עצם'
  ],
  'שוק בקר': [
    'שוק', 'שוק אחורי', 'שוק קדמי', 'שוקיים',
    'silverside', 'topside', 'eye of round'
  ],
  'צלע בקר': [
    'צלעות', 'צלעות בקר', 'צלע עם עצם', 'short ribs',
    'צלעות קצרות', 'צלעות ארוכות'
  ],
  'בקר טחון': [
    'טחון', 'בשר טחון', 'קציצות', 'המבורגר',
    'טחון רזה', 'טחון שמן', 'טחון 80%', 'טחון 90%'
  ],

  // Chicken cuts - נתחי עוף
  'חזה עוף': [
    'חזה', 'פילה עוף', 'חזה ללא עור', 'חזה ללא עצם',
    'גרמיליה', 'שניצל עוף', 'chicken breast', 'breast fillet'
  ],
  'שוק עוף': [
    'שוק', 'שוק עליון', 'שוק תחתון', 'שוקיים',
    'thigh', 'drumstick', 'שוק עם עור', 'שוק ללא עור'
  ],
  'כנפיים עוף': [
    'כנפיים', 'כנף', 'כנפי עוף', 'wings',
    'כנפיים מפורקות', 'כנפיים שלמות'
  ],
  'עוף שלם': [
    'עוף', 'תרנגולת', 'פטר', 'עוף טרי', 'עוף קפוא',
    'whole chicken', 'עוף אורגני', 'עוף חופשי'
  ],
  'גיד עוף': [
    'גידים', 'רצועות עוף', 'סטריפס', 'chicken strips',
    'גיד חזה', 'פסי עוף'
  ],

  // Lamb cuts - נתחי טלה/כבש
  'שוק טלה': [
    'שוק כבש', 'leg of lamb', 'שוק טלה עם עצם',
    'שוק טלה ללא עצם', 'gigot'
  ],
  'צלעות טלה': [
    'צלעות כבש', 'lamb chops', 'rack of lamb',
    'צלעות טלה עם עצם', 'קוטלט טלה'
  ],
  'כבש טחון': [
    'טלה טחון', 'בשר כבש טחון', 'ground lamb',
    'קציצות כבש', 'קבב'
  ],

  // Pork cuts - נתחי חזיר
  'צלעות חזיר': [
    'ריבס', 'pork ribs', 'spare ribs', 'baby back ribs',
    'צלעות חזיר מעושנות'
  ],
  'שוק חזיר': [
    'ham', 'פרושוטו', 'שוק חזיר מעושן',
    'שוק חזיר טרי', 'pork leg'
  ],

  // Fish - דגים
  'פילה סלמון': [
    'סלמון', 'salmon fillet', 'סלמון טרי', 'סלמון קפוא',
    'סלמון נורווגי', 'סלמון אטלנטי', 'סלמון פארו'
  ],
  'פילה דניס': [
    'דניס', 'sea bream', 'דניס ים תיכוני', 'דניס מגודל',
    'דניס טרי', 'דניס שלם'
  ],
  'פילה אמנון': [
    'אמנון', 'tilapia', 'אמנון מגודל', 'אמנון טרי',
    'אמנון קפוא', 'saint peter fish'
  ],
  'טונה': [
    'סטייק טונה', 'tuna steak', 'טונה טרייה',
    'טונה צהובת סנפיר', 'yellowfin tuna'
  ]
};

// Common Hebrew text variations and corrections
const hebrewCorrections = {
  // Common misspellings
  'אנטרקוט': 'אנטריקוט',
  'אנטרקוט': 'אנטריקוט', 
  'אנטירקוט': 'אנטריקוט',
  'פאלש': 'פילה מדומה',
  'false': 'פילה מדומה',
  'שוקיים': 'שוק',
  'כנפיים': 'כנפיים עוף',
  
  // Hebrew-English mixed
  'chicken': 'עוף',
  'beef': 'בקר',
  'lamb': 'טלה',
  'pork': 'חזיר',
  'fish': 'דג',
  'breast': 'חזה',
  'thigh': 'שוק',
  'wings': 'כנפיים'
};

/**
 * Normalize meat name using external mapping file
 * This has priority over built-in mappings
 */
function normalizeMeatNameWithMapping(meatName) {
  if (!meatName || typeof meatName !== 'string') return null;
  
  const cleaned = cleanHebrewText(meatName);
  
  // Check direct mapping in reverse lookup
  if (reverseMeatNamesMapping[cleaned]) {
    return {
      normalizedName: reverseMeatNamesMapping[cleaned],
      source: 'mapping',
      confidence: 1.0,
      originalVariation: meatName.trim()
    };
  }
  
  // Check partial matches for more complex variations
  for (const [variation, normalizedName] of Object.entries(reverseMeatNamesMapping)) {
    // Skip exact matches (already checked above)
    if (variation === cleaned) continue;
    
    const similarity = calculateSimilarity(cleaned, variation);
    if (similarity > 0.85) {
      return {
        normalizedName,
        source: 'mapping_fuzzy',
        confidence: similarity,
        originalVariation: meatName.trim(),
        matchedVariation: variation
      };
    }
  }
  
  return null; // No mapping found
}

/**
 * Enhanced clean Hebrew text that also handles mapping-specific patterns
 */
function cleanHebrewTextForMapping(text) {
  if (!text || typeof text !== 'string') return '';
  
  let cleaned = text.trim().toLowerCase();
  
  // Remove common noise words that appear in mapping variations
  const noiseWords = [
    'טרי', 'קפוא', 'מיובא', 'מקומי', 'פרמיום', 'איכות',
    'מס\'', 'מס', 'לפי משקל', 'מוכשר', 'צרכני', 'חלק',
    'אדום', 'על עצם', 'ללא עצם', 'עם עצם', 'מקוצבות',
    'קוביות', 'פרוס', 'מיושן', 'לבישול', 'טחין'
  ];
  
  noiseWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '').trim();
  });
  
  // Remove special characters and normalize spaces
  cleaned = cleaned
    .replace(/[^\u0590-\u05FF\u0020-\u007E\s]/g, '') // Keep Hebrew, English, and basic punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/["\']/g, '') // Remove quotes
    .replace(/[\\\/]/g, ' ') // Replace slashes with spaces
    .trim();
  
  return cleaned;
}

// Category detection keywords
const categoryKeywords = {
  'בקר': ['בקר', 'beef', 'פרה', 'שור', 'עגל'],
  'עוף': ['עוף', 'chicken', 'תרנגולת', 'פטר', 'הודו', 'turkey'],
  'טלה': ['טלה', 'כבש', 'lamb', 'sheep', 'עז', 'גדי'],
  'חזיר': ['חזיר', 'pork', 'pig', 'ham', 'bacon'],
  'דגים': ['דג', 'fish', 'סלמון', 'טונה', 'דניס', 'אמנון', 'בורי', 'לוקוס']
};

// Cut type detection keywords  
const cutTypeKeywords = {
  'סטייק': ['סטייק', 'steak', 'מנה', 'פרוסה'],
  'צלי': ['צלי', 'roast', 'רוסט'],
  'טחון': ['טחון', 'ground', 'קציצות', 'המבורגר', 'קבב'],
  'פילה': ['פילה', 'fillet', 'filet'],
  'שוק': ['שוק', 'leg', 'thigh', 'drumstick'],
  'כנף': ['כנף', 'wing', 'כנפיים'],
  'חזה': ['חזה', 'breast'],
  'צלעות': ['צלע', 'rib', 'צלעות', 'ribs'],
  'גיד': ['גיד', 'strip', 'רצועה'],
  'שלם': ['שלם', 'whole', 'מלא']
};

// Premium indicators
const premiumKeywords = [
  'פרמיום', 'premium', 'איכות', 'מובחר', 'מעולה',
  'אורגני', 'organic', 'חופשי', 'free range', 
  'בלק אנגוס', 'black angus', 'וואגיו', 'wagyu',
  'אטלנטי', 'נורווגי', 'פארו', 'ים תיכוני'
];

/**
 * Clean and normalize Hebrew text
 */
function cleanHebrewText(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Remove extra whitespace and special characters
  let cleaned = text.trim()
    .replace(/[^\u0590-\u05FF\u0020-\u007E\s]/g, '') // Keep Hebrew, English, and basic punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .toLowerCase();
  
  // Apply common corrections
  for (const [wrong, correct] of Object.entries(hebrewCorrections)) {
    cleaned = cleaned.replace(new RegExp(wrong, 'gi'), correct);
  }
  
  return cleaned;
}

/**
 * Detect meat category from text
 */
function detectCategory(text) {
  const cleaned = cleanHebrewText(text);
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (cleaned.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  return null;
}

/**
 * Detect cut type from text
 */
function detectCutType(text) {
  const cleaned = cleanHebrewText(text);
  
  for (const [cutType, keywords] of Object.entries(cutTypeKeywords)) {
    for (const keyword of keywords) {
      if (cleaned.includes(keyword.toLowerCase())) {
        return cutType;
      }
    }
  }
  
  return null;
}

/**
 * Detect if cut is premium
 */
function isPremiumCut(text) {
  const cleaned = cleanHebrewText(text);
  
  return premiumKeywords.some(keyword => 
    cleaned.includes(keyword.toLowerCase())
  );
}

/**
 * Calculate similarity between two Hebrew strings using various methods
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const clean1 = cleanHebrewText(str1);
  const clean2 = cleanHebrewText(str2);
  
  if (clean1 === clean2) return 1.0;
  
  // Levenshtein distance
  const levenshtein = calculateLevenshteinDistance(clean1, clean2);
  const maxLength = Math.max(clean1.length, clean2.length);
  const levenshteinSimilarity = 1 - (levenshtein / maxLength);
  
  // Jaccard similarity (word-based)
  const jaccardSimilarity = calculateJaccardSimilarity(clean1, clean2);
  
  // Substring matching
  const substringScore = calculateSubstringScore(clean1, clean2);
  
  // Weighted average
  return (levenshteinSimilarity * 0.4 + jaccardSimilarity * 0.4 + substringScore * 0.2);
}

function calculateLevenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,     // deletion
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

function calculateJaccardSimilarity(str1, str2) {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

function calculateSubstringScore(str1, str2) {
  const shorter = str1.length < str2.length ? str1 : str2;
  const longer = str1.length >= str2.length ? str1 : str2;
  
  if (longer.includes(shorter)) return 0.8;
  
  let maxSubstring = 0;
  for (let i = 0; i < shorter.length; i++) {
    for (let j = i + 1; j <= shorter.length; j++) {
      const substring = shorter.substring(i, j);
      if (longer.includes(substring) && substring.length > maxSubstring) {
        maxSubstring = substring.length;
      }
    }
  }
  
  return maxSubstring / Math.max(str1.length, str2.length);
}

/**
 * Find the best matching normalized cut for a given input
 */
async function findBestMatch(inputName, options = {}) {
  const { minConfidence = 0.6, category = null, includeVariations = true } = options;
  
  try {
    const cleaned = cleanHebrewText(inputName);
    const matches = [];
    
    // First, check direct mappings
    for (const [normalizedName, variations] of Object.entries(cutMappings)) {
      for (const variation of variations) {
        const similarity = calculateSimilarity(cleaned, variation);
        if (similarity >= minConfidence) {
          matches.push({
            normalizedName,
            confidence: similarity,
            matchType: 'mapping',
            variation
          });
        }
      }
    }
    
    // Then check database for exact and fuzzy matches
    if (includeVariations) {
      const dbQuery = `
        SELECT DISTINCT
          nc.id, nc.name, nc.category, nc.cut_type,
          cv.original_name, cv.confidence_score,
          similarity(nc.name, $1) as name_similarity,
          similarity(cv.original_name, $1) as variation_similarity
        FROM normalized_cuts nc
        LEFT JOIN cut_variations cv ON nc.id = cv.normalized_cut_id
        WHERE 
          (similarity(nc.name, $1) > $2 OR similarity(cv.original_name, $1) > $2)
          ${category ? 'AND nc.category = $3' : ''}
        ORDER BY GREATEST(
          similarity(nc.name, $1), 
          COALESCE(similarity(cv.original_name, $1), 0)
        ) DESC
        LIMIT 10
      `;
      
      const params = [cleaned, minConfidence];
      if (category) params.push(category);
      
      const result = await pool.query(dbQuery, params);
      
      for (const row of result.rows) {
        const dbConfidence = Math.max(row.name_similarity || 0, row.variation_similarity || 0);
        matches.push({
          id: row.id,
          normalizedName: row.name,
          category: row.category,
          cutType: row.cut_type,
          confidence: dbConfidence,
          matchType: 'database',
          isVariation: !!row.original_name
        });
      }
    }
    
    // Sort by confidence and remove duplicates
    const uniqueMatches = matches
      .sort((a, b) => b.confidence - a.confidence)
      .filter((match, index, arr) => 
        arr.findIndex(m => m.normalizedName === match.normalizedName) === index
      );
    
    return uniqueMatches.slice(0, 5); // Return top 5 matches
    
  } catch (error) {
    console.error('Error finding best match:', error);
    throw error;
  }
}

/**
 * Analyze and suggest normalization for a cut name
 */
async function analyzeCut(inputName) {
  try {
    const cleaned = cleanHebrewText(inputName);
    const detectedCategory = detectCategory(cleaned);
    const detectedCutType = detectCutType(cleaned);
    const isDetectedPremium = isPremiumCut(cleaned);
    
    const matches = await findBestMatch(cleaned, {
      category: detectedCategory,
      minConfidence: 0.4
    });
    
    const bestMatch = matches[0];
    
    // Generate suggested normalized name
    let suggestedName = cleaned;
    if (bestMatch && bestMatch.confidence > 0.7) {
      suggestedName = bestMatch.normalizedName;
    } else if (detectedCategory && detectedCutType) {
      suggestedName = `${detectedCutType} ${detectedCategory}`;
    }
    
    const reasons = [];
    if (detectedCategory) reasons.push(`זוהתה קטגוריה: ${detectedCategory}`);
    if (detectedCutType) reasons.push(`זוהה סוג נתח: ${detectedCutType}`);
    if (isDetectedPremium) reasons.push('זוהה כנתח פרמיום');
    if (bestMatch) reasons.push(`נמצא התאמה עם ביטחון ${(bestMatch.confidence * 100).toFixed(1)}%`);
    
    return {
      originalName: inputName,
      cleanedName: cleaned,
      suggestedCategory: detectedCategory,
      suggestedCutType: detectedCutType,
      suggestedNormalizedName: suggestedName,
      isPremium: isDetectedPremium,
      confidence: bestMatch ? bestMatch.confidence : 0.5,
      reasons,
      possibleMatches: matches.map(match => ({
        normalizedCut: {
          id: match.id,
          name: match.normalizedName,
          category: match.category,
          cutType: match.cutType
        },
        confidence: match.confidence,
        matchType: match.matchType,
        reasons: match.reasons || []
      }))
    };
    
  } catch (error) {
    console.error('Error analyzing cut:', error);
    throw error;
  }
}

/**
 * Normalize a cut name and create/update database records
 */
async function normalizeCut(inputName, options = {}) {
  const { 
    forceCreate = false, 
    category = null, 
    cutType = null,
    userId = null,
    source = 'manual'
  } = options;
  
  try {
    // First, try external mapping (highest priority)
    const mappingResult = normalizeMeatNameWithMapping(inputName);
    
    if (mappingResult && !forceCreate) {
      // Found in external mapping - check if normalized cut exists in DB
      const existingCutQuery = 'SELECT * FROM normalized_cuts WHERE LOWER(name) = LOWER($1)';
      const existingCutResult = await pool.query(existingCutQuery, [mappingResult.normalizedName]);
      
      if (existingCutResult.rows.length > 0) {
        // Use existing normalized cut
        const normalizedCut = existingCutResult.rows[0];
        
        // Create/update variation record with mapping source
        const variationQuery = `
          INSERT INTO cut_variations (original_name, normalized_cut_id, confidence_score, source, created_by)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (original_name, normalized_cut_id) DO UPDATE SET
            confidence_score = EXCLUDED.confidence_score,
            source = EXCLUDED.source,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;
        
        const variationResult = await pool.query(variationQuery, [
          inputName,
          normalizedCut.id,
          mappingResult.confidence,
          mappingResult.source,
          userId
        ]);
        
        return {
          success: true,
          normalizedCut,
          variation: variationResult.rows[0],
          isNewCut: false,
          confidence: mappingResult.confidence,
          source: mappingResult.source,
          usedMapping: true,
          mappingInfo: mappingResult
        };
      } else {
        // Create new normalized cut based on mapping
        const detectedCategory = category || detectCategory(mappingResult.normalizedName) || 'אחר';
        const detectedCutType = cutType || detectCutType(mappingResult.normalizedName);
        
        const createCutQuery = `
          INSERT INTO normalized_cuts (name, category, cut_type, is_premium)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        
        const cutResult = await pool.query(createCutQuery, [
          mappingResult.normalizedName,
          detectedCategory,
          detectedCutType,
          isPremiumCut(mappingResult.normalizedName)
        ]);
        
        const normalizedCut = cutResult.rows[0];
        
        // Create variation record
        const variationQuery = `
          INSERT INTO cut_variations (original_name, normalized_cut_id, confidence_score, source, created_by)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        const variationResult = await pool.query(variationQuery, [
          inputName,
          normalizedCut.id,
          mappingResult.confidence,
          mappingResult.source,
          userId
        ]);
        
        return {
          success: true,
          normalizedCut,
          variation: variationResult.rows[0],
          isNewCut: true,
          confidence: mappingResult.confidence,
          source: mappingResult.source,
          usedMapping: true,
          mappingInfo: mappingResult
        };
      }
    }
    
    // Fall back to existing analysis logic if no mapping found
    const analysis = await analyzeCut(inputName);
    let normalizedCut = null;
    let variation = null;
    let isNewCut = false;
    
    const bestMatch = analysis.possibleMatches[0];
    
    if (bestMatch && bestMatch.confidence > 0.8 && !forceCreate) {
      // Use existing normalized cut
      const cutQuery = 'SELECT * FROM normalized_cuts WHERE id = $1';
      const cutResult = await pool.query(cutQuery, [bestMatch.normalizedCut.id]);
      normalizedCut = cutResult.rows[0];
      
      // Create variation record
      const variationQuery = `
        INSERT INTO cut_variations (original_name, normalized_cut_id, confidence_score, source, created_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (original_name, normalized_cut_id) DO UPDATE SET
          confidence_score = EXCLUDED.confidence_score,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const variationResult = await pool.query(variationQuery, [
        inputName,
        normalizedCut.id,
        bestMatch.confidence,
        source,
        userId
      ]);
      
      variation = variationResult.rows[0];
      
    } else if (forceCreate || !bestMatch || bestMatch.confidence < 0.6) {
      // Create new normalized cut
      const finalCategory = category || analysis.suggestedCategory || 'אחר';
      const finalCutType = cutType || analysis.suggestedCutType;
      
      const createCutQuery = `
        INSERT INTO normalized_cuts (name, category, cut_type, is_premium)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const cutResult = await pool.query(createCutQuery, [
        analysis.suggestedNormalizedName,
        finalCategory,
        finalCutType,
        analysis.isPremium
      ]);
      
      normalizedCut = cutResult.rows[0];
      isNewCut = true;
      
      // Create variation record
      const variationQuery = `
        INSERT INTO cut_variations (original_name, normalized_cut_id, confidence_score, source, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const variationResult = await pool.query(variationQuery, [
        inputName,
        normalizedCut.id,
        1.0, // Perfect confidence for new cut
        source,
        userId
      ]);
      
      variation = variationResult.rows[0];
    }
    
    return {
      success: true,
      normalizedCut,
      variation,
      isNewCut,
      confidence: variation ? variation.confidence_score : 1.0,
      analysis
    };
    
  } catch (error) {
    console.error('Error normalizing cut:', error);
    throw error;
  }
}

/**
 * Get normalization statistics
 */
async function getNormalizationStats() {
  try {
    const statsQuery = `
      SELECT 
        category,
        normalized_cuts_count,
        variations_count,
        avg_confidence,
        verified_variations
      FROM cuts_normalization_stats
      ORDER BY category
    `;
    
    const result = await pool.query(statsQuery);
    return result.rows;
    
  } catch (error) {
    console.error('Error getting normalization stats:', error);
    throw error;
  }
}

module.exports = {
  cleanHebrewText,
  cleanHebrewTextForMapping,
  detectCategory,
  detectCutType,
  isPremiumCut,
  calculateSimilarity,
  findBestMatch,
  analyzeCut,
  normalizeCut,
  normalizeMeatNameWithMapping,
  getNormalizationStats,
  cutMappings,
  meatNamesMapping,
  reverseMeatNamesMapping,
  categoryKeywords,
  cutTypeKeywords,
  premiumKeywords
};