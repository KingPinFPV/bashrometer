const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const { query } = require('../db');

// GET /api/analytics/price-trends
router.get('/price-trends', authenticateToken, async (req, res) => {
  try {
    const { product_id, range = '30d', category } = req.query;
    
    let dateFilter = '';
    switch (range) {
      case '7d':
        dateFilter = "AND pr.created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        dateFilter = "AND pr.created_at >= NOW() - INTERVAL '30 days'";
        break;
      case '90d':
        dateFilter = "AND pr.created_at >= NOW() - INTERVAL '90 days'";
        break;
      case '1y':
        dateFilter = "AND pr.created_at >= NOW() - INTERVAL '1 year'";
        break;
    }

    let productFilter = '';
    let values = [];
    if (product_id) {
      productFilter = 'AND pr.product_id = $1';
      values.push(product_id);
    }

    const queryText = `
      SELECT 
        DATE(pr.created_at) as date,
        AVG(CAST(pr.regular_price AS NUMERIC)) as average_price,
        MIN(CAST(pr.regular_price AS NUMERIC)) as min_price,
        MAX(CAST(pr.regular_price AS NUMERIC)) as max_price,
        COUNT(*) as report_count,
        AVG(
          CASE 
            WHEN pr.unit_for_price = 'ק"ג' THEN (CAST(pr.regular_price AS NUMERIC) / (pr.quantity_for_price * 1000)) * 100
            WHEN pr.unit_for_price = 'גרם' THEN (CAST(pr.regular_price AS NUMERIC) / pr.quantity_for_price) * 100
            WHEN pr.unit_for_price = '100 גרם' THEN (CAST(pr.regular_price AS NUMERIC) / (pr.quantity_for_price * 100)) * 100
            ELSE (CAST(pr.regular_price AS NUMERIC) / (pr.quantity_for_price * 500)) * 100
          END
        ) as normalized_price
      FROM prices pr
      JOIN products p ON pr.product_id = p.id
      WHERE pr.status = 'approved' ${dateFilter} ${productFilter}
      GROUP BY DATE(pr.created_at)
      ORDER BY date ASC
    `;

    const result = await query(queryText, values);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching price trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/retailers
router.get('/retailers', authenticateToken, async (req, res) => {
  try {
    const { range = '30d', category } = req.query;
    
    let dateFilter = '';
    switch (range) {
      case '7d':
        dateFilter = "AND pr.created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        dateFilter = "AND pr.created_at >= NOW() - INTERVAL '30 days'";
        break;
      case '90d':
        dateFilter = "AND pr.created_at >= NOW() - INTERVAL '90 days'";
        break;
    }

    const queryText = `
      SELECT 
        r.name as retailer_name,
        AVG(CAST(pr.regular_price AS NUMERIC)) as average_price,
        COUNT(*) as report_count,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 2) as market_share
      FROM prices pr
      JOIN retailers r ON pr.retailer_id = r.id
      WHERE pr.status = 'approved' ${dateFilter}
      GROUP BY r.id, r.name
      ORDER BY report_count DESC
    `;

    const result = await query(queryText);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching retailer analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/user-activity
router.get('/user-activity', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    
    let dateFilter = '';
    switch (range) {
      case '7d':
        dateFilter = "WHERE date >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        dateFilter = "WHERE date >= NOW() - INTERVAL '30 days'";
        break;
      case '90d':
        dateFilter = "WHERE date >= NOW() - INTERVAL '90 days'";
        break;
    }

    const queryText = `
      WITH daily_activity AS (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_reports,
          COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as active_users
        FROM prices 
        GROUP BY DATE(created_at)
      ),
      daily_likes AS (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as likes_given
        FROM price_report_likes
        GROUP BY DATE(created_at)
      )
      SELECT 
        da.date,
        COALESCE(da.new_reports, 0) as new_reports,
        COALESCE(da.active_users, 0) as active_users,
        COALESCE(dl.likes_given, 0) as likes_given
      FROM daily_activity da
      LEFT JOIN daily_likes dl ON da.date = dl.date
      ${dateFilter}
      ORDER BY da.date ASC
    `;

    const result = await query(queryText);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/products/:id
router.get('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const queryText = `
      SELECT 
        p.name,
        p.category,
        COUNT(pr.id) as total_reports,
        AVG(CAST(pr.regular_price AS NUMERIC)) as average_price,
        MIN(CAST(pr.regular_price AS NUMERIC)) as min_price,
        MAX(CAST(pr.regular_price AS NUMERIC)) as max_price,
        COUNT(DISTINCT pr.retailer_id) as retailer_count
      FROM products p
      LEFT JOIN prices pr ON p.id = pr.product_id AND pr.status = 'approved'
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.category
    `;

    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;