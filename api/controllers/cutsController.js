// controllers/cutsController.js
const pool = require('../db');

const cutsController = {
  // GET /api/cuts - קבלת כל הנתחים
  async getAllCuts(req, res, next) {
    try {
      console.log('📂 Getting all cuts...');
      
      const { category, limit = 50, offset = 0 } = req.query;
      
      let query = 'SELECT * FROM cuts';
      let queryParams = [];
      let paramIndex = 1;
      
      if (category) {
        query += ' WHERE category = $' + paramIndex;
        queryParams.push(category);
        paramIndex++;
      }
      
      query += ' ORDER BY category, hebrew_name';
      query += ' LIMIT $' + paramIndex + ' OFFSET $' + (paramIndex + 1);
      queryParams.push(parseInt(limit));
      queryParams.push(parseInt(offset));
      
      const result = await pool.query(query, queryParams);
      
      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM cuts';
      let countParams = [];
      if (category) {
        countQuery += ' WHERE category = $1';
        countParams.push(category);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0]?.total || 0);
      
      console.log(`✅ Found ${result.rows.length} cuts (total: ${total})`);
      
      res.json({
        success: true,
        cuts: result.rows,
        total_items: total,
        total_pages: Math.ceil(total / parseInt(limit)),
        current_page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
        items_per_page: parseInt(limit),
        has_next: (parseInt(offset) + parseInt(limit)) < total,
        has_previous: parseInt(offset) > 0,
        // Old format for compatibility
        data: result.rows
      });
      
    } catch (error) {
      console.error('❌ Error fetching cuts:', error);
      next(error);
    }
  },

  // GET /api/cuts/:id - קבלת נתח לפי ID
  async getCutById(req, res, next) {
    try {
      const { id } = req.params;
      console.log(`📂 Getting cut by ID: ${id}`);
      
      const result = await pool.query('SELECT * FROM cuts WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'נתח לא נמצא'
        });
      }
      
      console.log(`✅ Found cut: ${result.rows[0].hebrew_name}`);
      res.json({
        success: true,
        cut: result.rows[0]
      });
      
    } catch (error) {
      console.error('❌ Error fetching cut by ID:', error);
      next(error);
    }
  },

  // POST /api/cuts - הוספת נתח חדש (אדמין בלבד)
  async createCut(req, res, next) {
    try {
      const { name, hebrew_name, category, description } = req.body;
      
      // Validation
      if (!name || !hebrew_name) {
        return res.status(400).json({
          success: false,
          error: 'שם באנגלית ושם בעברית הם שדות חובה'
        });
      }
      
      console.log(`➕ Creating new cut: ${hebrew_name}`);
      
      const result = await pool.query(
        'INSERT INTO cuts (name, hebrew_name, category, description) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, hebrew_name, category, description]
      );
      
      console.log(`✅ Cut created: ${result.rows[0].hebrew_name}`);
      
      res.status(201).json({
        success: true,
        message: 'נתח נוסף בהצלחה',
        cut: result.rows[0]
      });
      
    } catch (error) {
      console.error('❌ Error creating cut:', error);
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          success: false,
          error: 'נתח עם שם זה כבר קיים'
        });
      }
      next(error);
    }
  },

  // PUT /api/cuts/:id - עדכון נתח (אדמין בלבד)
  async updateCut(req, res, next) {
    try {
      const { id } = req.params;
      const { name, hebrew_name, category, description } = req.body;
      
      console.log(`🔄 Updating cut ID: ${id}`);
      
      const result = await pool.query(
        'UPDATE cuts SET name = $1, hebrew_name = $2, category = $3, description = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
        [name, hebrew_name, category, description, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'נתח לא נמצא'
        });
      }
      
      console.log(`✅ Cut updated: ${result.rows[0].hebrew_name}`);
      
      res.json({
        success: true,
        message: 'נתח עודכן בהצלחה',
        cut: result.rows[0]
      });
      
    } catch (error) {
      console.error('❌ Error updating cut:', error);
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          success: false,
          error: 'נתח עם שם זה כבר קיים'
        });
      }
      next(error);
    }
  },

  // DELETE /api/cuts/:id - מחיקת נתח (אדמין בלבד)
  async deleteCut(req, res, next) {
    try {
      const { id } = req.params;
      
      console.log(`🗑️ Deleting cut ID: ${id}`);
      
      // Check if cut is in use
      const usageCheck = await pool.query('SELECT COUNT(*) as count FROM products WHERE cut_id = $1', [id]);
      const usageCount = parseInt(usageCheck.rows[0]?.count || 0);
      
      if (usageCount > 0) {
        return res.status(409).json({
          success: false,
          error: `לא ניתן למחוק נתח זה כי הוא משויך ל-${usageCount} מוצרים`
        });
      }
      
      const result = await pool.query('DELETE FROM cuts WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'נתח לא נמצא'
        });
      }
      
      console.log(`✅ Cut deleted: ${result.rows[0].hebrew_name}`);
      
      res.json({
        success: true,
        message: 'נתח נמחק בהצלחה'
      });
      
    } catch (error) {
      console.error('❌ Error deleting cut:', error);
      next(error);
    }
  },

  // GET /api/cuts/categories - קבלת כל הקטגוריות
  async getCategories(req, res, next) {
    try {
      console.log('📂 Getting cut categories...');
      
      const result = await pool.query(`
        SELECT category, COUNT(*) as count 
        FROM cuts 
        WHERE category IS NOT NULL 
        GROUP BY category 
        ORDER BY category
      `);
      
      console.log(`✅ Found ${result.rows.length} categories`);
      
      res.json({
        success: true,
        categories: result.rows,
        total_items: result.rows.length
      });
      
    } catch (error) {
      console.error('❌ Error fetching cut categories:', error);
      next(error);
    }
  }
};

module.exports = cutsController;