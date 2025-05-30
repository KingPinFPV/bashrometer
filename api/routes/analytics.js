const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// כל נתיבי Analytics דורשים הרשאת admin
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

/**
 * GET /api/analytics/price-trends
 */
router.get('/price-trends', async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    
    // דיווח בסיסי - מספר דיווחי מחיר לפי יום
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as price_reports,
        AVG(regular_price) as avg_price
      FROM prices 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in price trends analytics:', error);
    res.status(500).json({ error: 'שגיאה בטעינת נתוני מגמות מחירים' });
  }
});

/**
 * GET /api/analytics/user-activity
 */
router.get('/user-activity', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_reports,
        DATE(created_at) as date
      FROM prices 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in user activity analytics:', error);
    res.status(500).json({ error: 'שגיאה בטעינת נתוני פעילות משתמשים' });
  }
});

/**
 * GET /api/analytics/retailers
 */
router.get('/retailers', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.name,
        COUNT(p.id) as report_count,
        AVG(p.regular_price) as avg_price
      FROM retailers r
      LEFT JOIN prices p ON r.id = p.retailer_id
      WHERE p.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY r.id, r.name
      ORDER BY report_count DESC
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in retailer analytics:', error);
    res.status(500).json({ error: 'שגיאה בטעינת נתוני קמעונאים' });
  }
});

module.exports = router;