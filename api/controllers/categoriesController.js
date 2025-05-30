const pool = require('../db');

const categoriesController = {
  async getAllCategories(req, res) {
    try {
      console.log('📂 Getting all categories...');
      
      const result = await pool.query(`
        SELECT DISTINCT category as name, 
               COUNT(*) as product_count
        FROM products 
        WHERE category IS NOT NULL 
        AND category != ''
        GROUP BY category
        ORDER BY category ASC
      `);
      
      const categories = result.rows.map(row => ({
        id: row.name.toLowerCase().replace(/\s+/g, '-'),
        name: row.name,
        slug: row.name.toLowerCase().replace(/\s+/g, '-'),
        product_count: parseInt(row.product_count)
      }));
      
      console.log(`✅ Found ${categories.length} categories`);
      
      return res.json({
        categories: categories,
        total_items: categories.length,
        total_pages: 1,
        current_page: 1,
        items_per_page: categories.length,
        has_next: false,
        has_previous: false
      });
      
    } catch (error) {
      console.error('❌ Categories error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        categories: [],
        total_items: 0,
        total_pages: 0,
        current_page: 1,
        items_per_page: 0,
        has_next: false,
        has_previous: false
      });
    }
  }
};

module.exports = categoriesController;