// routes/autocomplete.js
const express = require('express');
const router = express.Router();
const autocompleteController = require('../controllers/autocompleteController');
const db = require('../db');

// GET /api/autocomplete/meat-cuts?q=בקר&category=בקר&limit=10
router.get('/meat-cuts', autocompleteController.searchMeatCuts);

// GET /api/autocomplete/brands?q=רמי&type=supplier&limit=10  
router.get('/brands', autocompleteController.searchBrands);

// GET /api/autocomplete/meat-cut-categories
router.get('/meat-cut-categories', autocompleteController.getMeatCutCategories);

// GET /api/autocomplete/brand-types
router.get('/brand-types', autocompleteController.getBrandTypes);

/**
 * GET /api/autocomplete/products
 * Autocomplete search for products
 */
router.get('/products', async (req, res) => {
  try {
    const { q, limit = 8 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const searchTerm = `%${q}%`;
    const query = `
      SELECT 
        id,
        name,
        brand,
        category
      FROM products 
      WHERE 
        is_active = true 
        AND (
          name ILIKE $1 
          OR brand ILIKE $1 
          OR category ILIKE $1
        )
      ORDER BY 
        CASE 
          WHEN name ILIKE $2 THEN 1
          WHEN brand ILIKE $2 THEN 2
          ELSE 3
        END,
        name
      LIMIT $3
    `;

    const exactSearchTerm = `${q}%`;
    const result = await db.query(query, [searchTerm, exactSearchTerm, limit]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error in products autocomplete:', error);
    res.status(500).json({ error: 'שגיאה בחיפוש מוצרים' });
  }
});

/**
 * GET /api/autocomplete/retailers
 * Autocomplete search for retailers
 */
router.get('/retailers', async (req, res) => {
  try {
    const { q, limit = 8 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const searchTerm = `%${q}%`;
    const query = `
      SELECT 
        id,
        name,
        address,
        chain,
        type
      FROM retailers 
      WHERE 
        is_active = true 
        AND (
          name ILIKE $1 
          OR address ILIKE $1 
          OR chain ILIKE $1
        )
      ORDER BY 
        CASE 
          WHEN name ILIKE $2 THEN 1
          WHEN chain ILIKE $2 THEN 2
          ELSE 3
        END,
        name
      LIMIT $3
    `;

    const exactSearchTerm = `${q}%`;
    const result = await db.query(query, [searchTerm, exactSearchTerm, limit]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error in retailers autocomplete:', error);
    res.status(500).json({ error: 'שגיאה בחיפוש חנויות' });
  }
});

module.exports = router;