const pool = require('../db');

// כללי ניקוי טקסט
const normalizationRules = {
  // הסרת מילים לא רלוונטיות
  cleanup: [
    /\bטרי\b/gi,
    /\bקפוא\b/gi, 
    /\bמעושן\b/gi,
    /\bמופשר\b/gi,
    /\d+\s*ק[״"]?ג/gi, // משקלים
    /מבצע.*$/gi, // הסרת "מבצע" וכל מה שאחריו
    /\-.*$/gi, // הסרת מחיר וכל מה שאחרי מקף
    /\bארוז\b/gi,
    /\bטרי\s+חלק\b/gi,
    /\bאדום\s+אדום\b/gi,
    /\bלפי\s+משקל\b/gi,
    /\bמשקל\s+משתנה\b/gi,
    /\bמחיר\s+למאה\s+גרם\b/gi,
    /\bמחיר\s+לק[״"]?ג\b/gi,
    /₪.*$/gi, // הסרת מחירים
    /\d+\.\d+.*$/gi // הסרת מספרים עשרוניים (מחירים)
  ],
  
  // מיפוי נתחים לשם מנורמל
  cutMappings: {
    'אנטריקוט': [
      'אנטרקוט', 'אנטירקוט', 'אנטריקוט בקר', 'אנטריקוט עם עצם',
      'אנטריקוט ללא עצם', 'אנטרקוט בלק אנגוס', 'אנטריקוט מבכירה',
      'אנטרקוט טרי', 'אנטריקוט קפוא', 'entrecote'
    ],
    'פילה': [
      'פילה בקר', 'פילה מדומה', 'פאלש פילה', 'false fillet', 
      'פילה אמיתי', 'פילה טרי', 'filet', 'פילט'
    ],
    'שייטל': [
      'שיי.*?טל', 'שפיץ שייטל', 'שייטל בקר', 'שייטל עגל',
      'שייטל טרי', 'shaytel'
    ],
    'חזה עוף': [
      'חזה עוף שלם', 'חזה עוף חצוי', 'חזה עוף פרוס', 'שניצל עוף',
      'חזה עוף ללא עצם', 'חזה עוף טרי', 'חזה עוף קפוא'
    ],
    'פרגיות': [
      'פרגית', 'פרגיות עוף', 'ירכיים עוף', 'סטייק פרגית',
      'פרגיות טריות', 'פרגיות קפואות'
    ],
    'כנפיים': [
      'כנפיים עוף', 'כנף עוף', 'כנפיים טריות', 'כנפיים קפואות'
    ],
    'רוסטביף': [
      'רוסט ביף', 'רוסטביף בקר', 'צלי כתף', 'roast beef'
    ],
    'אסאדו': [
      'אסדו', 'אסדו בקר', 'asado', 'צלעות קצרות'
    ],
    'גולש': [
      'גולאש', 'בשר לגולש', 'גולש בקר', 'goulash'
    ]
  },
  
  // זיהוי סוג בשר
  meatTypes: {
    'בקר': ['בקר', 'עגל', 'פרה', 'שור', 'beef'],
    'עוף': ['עוף', 'תרנגול', 'chicken', 'פרגית'],
    'טלה': ['טלה', 'כבש', 'lamb'], 
    'חזיר': ['חזיר', 'לבן', 'pork'],
    'הודו': ['הודו', 'turkey'],
    'דגים': ['סלמון', 'טונה', 'בסה', 'דניס', 'אמנון', 'דג', 'fish']
  },
  
  // זיהוי איכות פרימיום
  premiumIndicators: [
    'וואגיו', 'ואגיו', 'wagyu', 'אנגוס', 'angus', 'פרימיום', 
    'מיושן', 'dry aged', 'grass fed', 'בלק אנגוס', 'black angus',
    'אורגני', 'organic', 'bio', 'איכותי'
  ],

  // זיהוי הכנה
  preparations: {
    'טרי': ['טרי', 'fresh'],
    'קפוא': ['קפוא', 'frozen'],
    'מעושן': ['מעושן', 'smoked'],
    'מתובל': ['מתובל', 'marinated', 'במרינדה'],
    'טחון': ['טחון', 'קצוץ', 'ground', 'minced']
  }
};

/**
 * ניקוי וחילוץ מידע מטקסט מוצר
 */
function parseProductName(productName) {
  if (!productName || typeof productName !== 'string') {
    return {
      originalName: productName,
      cleanedName: '',
      cutType: null,
      meatType: null,
      isPremium: false,
      hasBone: false,
      preparation: null
    };
  }

  let cleaned = productName.trim();
  
  // ניקוי בסיסי
  normalizationRules.cleanup.forEach(rule => {
    cleaned = cleaned.replace(rule, '').trim();
  });
  
  // ניקוי רווחים כפולים ותווים מיוחדים
  cleaned = cleaned.replace(/\s+/g, ' ')
    .replace(/[״'']/g, '')
    .replace(/[()]/g, '')
    .trim();
  
  // זיהוי נתח
  let cutType = null;
  for (const [mainCut, aliases] of Object.entries(normalizationRules.cutMappings)) {
    const foundAlias = aliases.find(alias => {
      const regex = new RegExp(alias.replace(/\.\*\?\?/g, '.*?'), 'i');
      return regex.test(productName);
    });
    if (foundAlias) {
      cutType = mainCut;
      break;
    }
  }
  
  // זיהוי סוג בשר
  let meatType = null;
  for (const [mainType, aliases] of Object.entries(normalizationRules.meatTypes)) {
    if (aliases.some(alias => new RegExp(`\\b${alias}\\b`, 'i').test(productName))) {
      meatType = mainType;
      break;
    }
  }
  
  // זיהוי פרימיום
  const isPremium = normalizationRules.premiumIndicators.some(
    indicator => new RegExp(`\\b${indicator}\\b`, 'i').test(productName)
  );
  
  // זיהוי עצם
  const hasBone = /עם עצם|על עצם|בעצם/.test(productName) && !/ללא עצם|בלי עצם|חסר עצם/.test(productName);
  
  // זיהוי הכנה
  let preparation = null;
  for (const [prepType, aliases] of Object.entries(normalizationRules.preparations)) {
    if (aliases.some(alias => new RegExp(`\\b${alias}\\b`, 'i').test(productName))) {
      preparation = prepType;
      break;
    }
  }

  return {
    originalName: productName,
    cleanedName: cleaned,
    cutType,
    meatType,
    isPremium,
    hasBone,
    preparation
  };
}

/**
 * חיפוש מוצר קיים בטבלה המנורמלת
 */
async function findExistingProduct(productName) {
  const parsed = parseProductName(productName);
  
  try {
    // חיפוש לפי שם מדויק או דמיון גבוה
    const query = `
      SELECT DISTINCT np.*, 
             GREATEST(
               SIMILARITY(np.name, $1),
               COALESCE(MAX(SIMILARITY(pa.alias_name, $1)), 0)
             ) as similarity_score
      FROM normalized_products np
      LEFT JOIN product_aliases pa ON np.id = pa.normalized_product_id
      WHERE 
        LOWER(np.name) = LOWER($1) OR
        SIMILARITY(np.name, $1) > 0.6 OR
        EXISTS (
          SELECT 1 FROM product_aliases pa2 
          WHERE pa2.normalized_product_id = np.id 
          AND (LOWER(pa2.alias_name) = LOWER($1) OR SIMILARITY(pa2.alias_name, $1) > 0.6)
        )
      GROUP BY np.id, np.name
      HAVING GREATEST(
        SIMILARITY(np.name, $1),
        COALESCE(MAX(SIMILARITY(pa.alias_name, $1)), 0)
      ) > 0.6
      ORDER BY similarity_score DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [productName]);
    return result.rows[0] || null;
    
  } catch (error) {
    console.log('Error in findExistingProduct:', error);
    return null;
  }
}

/**
 * יצירת מוצר מנורמל חדש
 */
async function createNormalizedProduct(productName) {
  const parsed = parseProductName(productName);
  
  // יצירת שם מנורמל
  let normalizedName = parsed.cleanedName;
  
  if (parsed.cutType && parsed.meatType) {
    normalizedName = `${parsed.cutType} ${parsed.meatType}`;
  } else if (parsed.cutType) {
    normalizedName = parsed.cutType;
  } else if (parsed.meatType) {
    normalizedName = parsed.meatType;
  }
  
  // אם לא זיהינו כלום, נשתמש בשם המנוקה
  if (!normalizedName) {
    normalizedName = parsed.cleanedName || productName;
  }

  // הגדרת קטגוריה
  let category = 'אחר';
  if (parsed.meatType === 'בקר' || parsed.meatType === 'טלה') {
    category = 'בשר אדום';
  } else if (parsed.meatType === 'עוף' || parsed.meatType === 'הודו') {
    category = 'עוף';
  } else if (parsed.meatType === 'דגים') {
    category = 'דגים';
  }
  
  const insertQuery = `
    INSERT INTO normalized_products (
      name, category, meat_type, cut_type, preparation, has_bone, is_premium, description
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const result = await pool.query(insertQuery, [
    normalizedName,
    category,
    parsed.meatType,
    parsed.cutType,
    parsed.preparation,
    parsed.hasBone,
    parsed.isPremium,
    `נוצר אוטומטית מ: ${productName}`
  ]);
  
  return result.rows[0];
}

/**
 * הוספת שם חלופי למוצר
 */
async function addProductAlias(normalizedProductId, aliasName, source = 'auto', retailerId = null) {
  try {
    const insertQuery = `
      INSERT INTO product_aliases (
        normalized_product_id, alias_name, source, retailer_id, confidence_score
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (normalized_product_id, alias_name) DO NOTHING
      RETURNING *
    `;
    
    // קביעת ציון אמינות בהתאם למקור
    let confidenceScore = 0.80; // ברירת מחדל
    if (source === 'manual') confidenceScore = 1.00;
    else if (source === 'original') confidenceScore = 0.95;
    else if (source === 'retailer_name') confidenceScore = 0.85;
    
    const result = await pool.query(insertQuery, [
      normalizedProductId,
      aliasName,
      source,
      retailerId,
      confidenceScore
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error adding product alias:', error);
    return null;
  }
}

/**
 * פונקציה ראשית לנרמול מוצר
 */
async function normalizeProduct(productName, retailerId = null) {
  try {
    if (!productName || typeof productName !== 'string' || productName.trim() === '') {
      throw new Error('Product name is required');
    }

    const trimmedName = productName.trim();
    
    // חיפוש מוצר קיים
    let existingProduct = await findExistingProduct(trimmedName);
    
    if (existingProduct) {
      // הוספת שם חלופי למוצר קיים (אם לא קיים כבר)
      await addProductAlias(existingProduct.id, trimmedName, 'auto', retailerId);
      return existingProduct;
    }
    
    // יצירת מוצר חדש
    const newProduct = await createNormalizedProduct(trimmedName);
    
    // הוספת השם המקורי כ-alias
    await addProductAlias(newProduct.id, trimmedName, 'original', retailerId);
    
    return newProduct;
    
  } catch (error) {
    console.error('Error normalizing product:', error);
    throw error;
  }
}

/**
 * חיפוש מוצרים דומים לטקסט נתון
 */
async function findSimilarProducts(searchText, limit = 10) {
  try {
    const query = `
      SELECT DISTINCT np.*, 
             GREATEST(
               SIMILARITY(np.name, $1),
               COALESCE(MAX(SIMILARITY(pa.alias_name, $1)), 0)
             ) as similarity_score,
             array_agg(DISTINCT pa.alias_name) FILTER (WHERE pa.alias_name IS NOT NULL) as aliases
      FROM normalized_products np
      LEFT JOIN product_aliases pa ON np.id = pa.normalized_product_id
      WHERE 
        SIMILARITY(np.name, $1) > 0.3 OR
        EXISTS (
          SELECT 1 FROM product_aliases pa2 
          WHERE pa2.normalized_product_id = np.id 
          AND SIMILARITY(pa2.alias_name, $1) > 0.3
        )
      GROUP BY np.id, np.name
      HAVING GREATEST(
        SIMILARITY(np.name, $1),
        COALESCE(MAX(SIMILARITY(pa.alias_name, $1)), 0)
      ) > 0.3
      ORDER BY similarity_score DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [searchText, limit]);
    return result.rows;
    
  } catch (error) {
    console.error('Error finding similar products:', error);
    return [];
  }
}

/**
 * קבלת סטטיסטיקות על המערכת המנורמלת
 */
async function getNormalizationStats() {
  try {
    const query = `
      SELECT 
        COUNT(DISTINCT np.id) as normalized_products_count,
        COUNT(pa.id) as total_aliases,
        ROUND(AVG(alias_counts.count), 2) as avg_aliases_per_product,
        COUNT(DISTINCT pa.retailer_id) as retailers_with_aliases
      FROM normalized_products np
      LEFT JOIN product_aliases pa ON np.id = pa.normalized_product_id
      LEFT JOIN (
        SELECT normalized_product_id, COUNT(*) as count
        FROM product_aliases 
        GROUP BY normalized_product_id
      ) alias_counts ON np.id = alias_counts.normalized_product_id
    `;
    
    const result = await pool.query(query);
    return result.rows[0];
    
  } catch (error) {
    console.error('Error getting normalization stats:', error);
    return null;
  }
}

module.exports = {
  parseProductName,
  findExistingProduct,
  createNormalizedProduct,
  addProductAlias,
  normalizeProduct,
  findSimilarProducts,
  getNormalizationStats,
  normalizationRules
};