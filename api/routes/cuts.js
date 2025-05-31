const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// GET all cuts grouped by category
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all cuts...');
    
    const query = `
      SELECT 
        id, name, hebrew_name, category, description,
        (SELECT COUNT(*) FROM products p WHERE p.cut_id = c.id AND p.is_active = TRUE) as products_count
      FROM cuts c 
      ORDER BY category ASC, hebrew_name ASC, name ASC
    `;
    
    const result = await pool.query(query);
    
    // Group by category
    const cutsByCategory = {};
    result.rows.forEach(cut => {
      if (!cutsByCategory[cut.category]) {
        cutsByCategory[cut.category] = [];
      }
      cutsByCategory[cut.category].push({
        ...cut,
        products_count: parseInt(cut.products_count) || 0
      });
    });
    
    console.log('✅ Cuts fetched successfully:', Object.keys(cutsByCategory).length, 'categories');
    
    res.json({
      success: true,
      data: cutsByCategory,
      total_categories: Object.keys(cutsByCategory).length,
      total_cuts: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching cuts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'שגיאה בטעינת רשימת הנתחים',
      details: error.message 
    });
  }
});

// POST new cut (requires authentication)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, category, hebrew_name, description } = req.body;
    const userId = req.user.id;
    
    console.log('➕ Creating new cut:', { name, category, hebrew_name, userId });
    
    // Validation
    if (!name || !category) {
      return res.status(400).json({ 
        success: false, 
        error: 'שם הנתח וקטגוריה נדרשים',
        details: 'Name and category are required fields'
      });
    }
    
    // Check if cut already exists
    const existingCut = await pool.query(
      'SELECT id FROM cuts WHERE name = $1 AND category = $2',
      [name, category]
    );
    
    if (existingCut.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'נתח עם השם הזה כבר קיים בקטגוריה זו',
        existing_cut_id: existingCut.rows[0].id
      });
    }
    
    // Insert new cut
    const insertQuery = `
      INSERT INTO cuts (name, category, hebrew_name, description) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      name.trim(),
      category.trim(),
      hebrew_name ? hebrew_name.trim() : name.trim(),
      description ? description.trim() : null
    ]);
    
    const newCut = result.rows[0];
    
    console.log('✅ Cut created successfully:', newCut.id, newCut.name);
    
    res.status(201).json({
      success: true,
      data: newCut,
      message: 'נתח חדש נוצר בהצלחה'
    });
    
  } catch (error) {
    console.error('❌ Error creating cut:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ 
        success: false, 
        error: 'נתח עם השם הזה כבר קיים' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'שגיאה ביצירת הנתח החדש',
      details: error.message 
    });
  }
});

module.exports = router;