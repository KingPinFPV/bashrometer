// controllers/autocompleteController.js
const pool = require('../db');

const searchMeatCuts = async (req, res, next) => {
  const { q, category, limit = 10 } = req.query;
  
  if (!q || q.trim().length < 1) {
    return res.json({ data: [] });
  }
  
  try {
    let query = `
      SELECT id, name, category 
      FROM meat_cuts 
      WHERE is_active = TRUE 
        AND LOWER(name) LIKE LOWER($1)
    `;
    
    const queryParams = [`%${q.trim()}%`];
    let paramIndex = 2;
    
    if (category) {
      query += ` AND category = $${paramIndex++}`;
      queryParams.push(category);
    }
    
    query += ` ORDER BY 
      CASE WHEN LOWER(name) LIKE LOWER($${paramIndex}) THEN 1 ELSE 2 END,
      LENGTH(name),
      name
      LIMIT $${paramIndex + 1}`;
    
    queryParams.push(`${q.trim()}%`); // For exact prefix match priority
    queryParams.push(parseInt(limit));
    
    const result = await pool.query(query, queryParams);
    
    res.json({ 
      data: result.rows,
      query: q,
      total: result.rows.length 
    });
  } catch (err) {
    console.error('Error in searchMeatCuts:', err.message);
    next(err);
  }
};

const searchBrands = async (req, res, next) => {
  const { q, type, limit = 10 } = req.query;
  
  if (!q || q.trim().length < 1) {
    return res.json({ data: [] });
  }
  
  try {
    let query = `
      SELECT id, name, type 
      FROM brands 
      WHERE is_active = TRUE 
        AND LOWER(name) LIKE LOWER($1)
    `;
    
    const queryParams = [`%${q.trim()}%`];
    let paramIndex = 2;
    
    if (type) {
      query += ` AND type = $${paramIndex++}`;
      queryParams.push(type);
    }
    
    query += ` ORDER BY 
      CASE WHEN LOWER(name) LIKE LOWER($${paramIndex}) THEN 1 ELSE 2 END,
      LENGTH(name),
      name
      LIMIT $${paramIndex + 1}`;
    
    queryParams.push(`${q.trim()}%`); // For exact prefix match priority
    queryParams.push(parseInt(limit));
    
    const result = await pool.query(query, queryParams);
    
    res.json({ 
      data: result.rows,
      query: q,
      total: result.rows.length 
    });
  } catch (err) {
    console.error('Error in searchBrands:', err.message);
    next(err);
  }
};

const getMeatCutCategories = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT category 
      FROM meat_cuts 
      WHERE is_active = TRUE AND category IS NOT NULL
      ORDER BY category
    `);
    
    res.json({ 
      data: result.rows.map(row => row.category) 
    });
  } catch (err) {
    console.error('Error in getMeatCutCategories:', err.message);
    next(err);
  }
};

const getBrandTypes = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT type 
      FROM brands 
      WHERE is_active = TRUE AND type IS NOT NULL
      ORDER BY type
    `);
    
    res.json({ 
      data: result.rows.map(row => row.type) 
    });
  } catch (err) {
    console.error('Error in getBrandTypes:', err.message);
    next(err);
  }
};

module.exports = {
  searchMeatCuts,
  searchBrands,
  getMeatCutCategories,
  getBrandTypes
};