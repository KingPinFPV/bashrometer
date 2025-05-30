const express = require('express');
const router = express.Router();
const { 
  normalizeProduct, 
  parseProductName, 
  findExistingProduct,
  findSimilarProducts,
  getNormalizationStats 
} = require('../utils/productNormalizer');
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

/**
 * נרמול מוצר יחיד
 * POST /api/normalize/normalize-product
 */
router.post('/normalize-product', authenticateToken, async (req, res) => {
  try {
    const { productName, retailerId } = req.body;
    
    if (!productName || typeof productName !== 'string' || productName.trim() === '') {
      return res.status(400).json({ 
        error: 'Product name is required and must be a non-empty string' 
      });
    }
    
    const normalizedProduct = await normalizeProduct(productName.trim(), retailerId);
    
    res.json({
      success: true,
      normalizedProduct,
      originalName: productName.trim()
    });
    
  } catch (error) {
    console.error('Error normalizing product:', error);
    res.status(500).json({ 
      error: 'Failed to normalize product',
      details: error.message 
    });
  }
});

/**
 * ניתוח מוצר (מבלי לשמור במסד הנתונים)
 * POST /api/normalize/parse-product
 */
router.post('/parse-product', async (req, res) => {
  try {
    const { productName } = req.body;
    
    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    
    const parsed = parseProductName(productName);
    
    res.json({
      success: true,
      parsed
    });
    
  } catch (error) {
    console.error('Error parsing product:', error);
    res.status(500).json({ 
      error: 'Failed to parse product',
      details: error.message 
    });
  }
});

/**
 * חיפוש מוצרים דומים
 * GET /api/normalize/similar-products?q=search_term
 */
router.get('/similar-products', async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;
    
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const similarProducts = await findSimilarProducts(query.trim(), parseInt(limit));
    
    res.json({
      success: true,
      query: query.trim(),
      products: similarProducts
    });
    
  } catch (error) {
    console.error('Error finding similar products:', error);
    res.status(500).json({ 
      error: 'Failed to find similar products',
      details: error.message 
    });
  }
});

/**
 * רשימת מוצרים מנורמלים עם מספר aliases
 * GET /api/normalize/normalized-products
 */
router.get('/normalized-products', async (req, res) => {
  try {
    const { page = 1, limit = 50, category, meat_type } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const queryParams = [limit, offset];
    let paramIndex = 3;
    
    if (category) {
      whereClause += ` WHERE np.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }
    
    if (meat_type) {
      whereClause += category ? ` AND np.meat_type = $${paramIndex}` : ` WHERE np.meat_type = $${paramIndex}`;
      queryParams.push(meat_type);
      paramIndex++;
    }
    
    const query = `
      SELECT np.*, 
             COUNT(pa.id) as aliases_count,
             array_agg(DISTINCT pa.alias_name) FILTER (WHERE pa.alias_name IS NOT NULL) as sample_aliases,
             COUNT(DISTINCT pr.id) as prices_count
      FROM normalized_products np
      LEFT JOIN product_aliases pa ON np.id = pa.normalized_product_id
      LEFT JOIN prices pr ON np.id = pr.normalized_product_id
      ${whereClause}
      GROUP BY np.id
      ORDER BY aliases_count DESC, np.name
      LIMIT $1 OFFSET $2
    `;
    
    const countQuery = `
      SELECT COUNT(DISTINCT np.id) as total
      FROM normalized_products np
      ${whereClause}
    `;
    
    const [result, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(2)) // Remove limit and offset for count
    ]);
    
    res.json({
      success: true,
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching normalized products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch normalized products',
      details: error.message 
    });
  }
});

/**
 * פרטי מוצר מנורמל עם כל ה-aliases שלו
 * GET /api/normalize/normalized-products/:id
 */
router.get('/normalized-products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid product ID is required' });
    }
    
    const query = `
      SELECT np.*,
             json_agg(
               json_build_object(
                 'id', pa.id,
                 'alias_name', pa.alias_name,
                 'confidence_score', pa.confidence_score,
                 'source', pa.source,
                 'retailer_id', pa.retailer_id,
                 'retailer_name', r.name,
                 'is_verified', pa.is_verified,
                 'created_at', pa.created_at
               ) ORDER BY pa.confidence_score DESC, pa.created_at DESC
             ) FILTER (WHERE pa.id IS NOT NULL) as aliases
      FROM normalized_products np
      LEFT JOIN product_aliases pa ON np.id = pa.normalized_product_id
      LEFT JOIN retailers r ON pa.retailer_id = r.id
      WHERE np.id = $1
      GROUP BY np.id
    `;
    
    const result = await pool.query(query, [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Normalized product not found' });
    }
    
    res.json({
      success: true,
      product: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching normalized product details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch normalized product details',
      details: error.message 
    });
  }
});

/**
 * הוספת alias חדש למוצר מנורמל
 * POST /api/normalize/add-alias
 */
router.post('/add-alias', authenticateToken, async (req, res) => {
  try {
    const { normalizedProductId, aliasName, source = 'manual', retailerId } = req.body;
    
    if (!normalizedProductId || !aliasName) {
      return res.status(400).json({ 
        error: 'Normalized product ID and alias name are required' 
      });
    }
    
    // בדיקה שהמוצר המנורמל קיים
    const productCheck = await pool.query(
      'SELECT id FROM normalized_products WHERE id = $1',
      [normalizedProductId]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Normalized product not found' });
    }
    
    // הוספת ה-alias
    const { addProductAlias } = require('../utils/productNormalizer');
    const newAlias = await addProductAlias(normalizedProductId, aliasName, source, retailerId);
    
    if (!newAlias) {
      return res.status(409).json({ error: 'Alias already exists for this product' });
    }
    
    res.status(201).json({
      success: true,
      alias: newAlias
    });
    
  } catch (error) {
    console.error('Error adding alias:', error);
    res.status(500).json({ 
      error: 'Failed to add alias',
      details: error.message 
    });
  }
});

/**
 * סטטיסטיקות מערכת הנרמול
 * GET /api/normalize/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getNormalizationStats();
    
    // סטטיסטיקות נוספות
    const additionalStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT pa.source) as unique_sources,
        COUNT(CASE WHEN pa.is_verified = true THEN 1 END) as verified_aliases,
        COUNT(CASE WHEN np.is_premium = true THEN 1 END) as premium_products,
        COUNT(CASE WHEN np.has_bone = true THEN 1 END) as products_with_bone
      FROM normalized_products np
      LEFT JOIN product_aliases pa ON np.id = pa.normalized_product_id
    `);
    
    res.json({
      success: true,
      stats: {
        ...stats,
        ...additionalStats.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Error fetching normalization stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch normalization statistics',
      details: error.message 
    });
  }
});

/**
 * קטגוריות וסוגי בשר זמינים
 * GET /api/normalize/categories
 */
router.get('/categories', async (req, res) => {
  try {
    const query = `
      SELECT 
        category,
        meat_type,
        cut_type,
        COUNT(*) as count
      FROM normalized_products 
      WHERE category IS NOT NULL OR meat_type IS NOT NULL OR cut_type IS NOT NULL
      GROUP BY GROUPING SETS (
        (category),
        (meat_type), 
        (cut_type)
      )
      ORDER BY count DESC
    `;
    
    const result = await pool.query(query);
    
    const categories = {
      categories: [],
      meatTypes: [],
      cutTypes: []
    };
    
    result.rows.forEach(row => {
      if (row.category) {
        categories.categories.push({ name: row.category, count: parseInt(row.count) });
      }
      if (row.meat_type) {
        categories.meatTypes.push({ name: row.meat_type, count: parseInt(row.count) });
      }
      if (row.cut_type) {
        categories.cutTypes.push({ name: row.cut_type, count: parseInt(row.count) });
      }
    });
    
    res.json({
      success: true,
      categories
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      details: error.message 
    });
  }
});

module.exports = router;