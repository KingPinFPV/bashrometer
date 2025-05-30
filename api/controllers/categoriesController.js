// controllers/categoriesController.js
const pool = require('../db');

console.log('🔄 Loading categories controller...');

const categoriesController = {
  // Get all categories
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
        product_count: parseInt(row.product_count),
        description: `קטגוריית ${row.name}`,
        parent: null
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
        details: error.message,
        categories: [],
        total_items: 0,
        total_pages: 0,
        current_page: 1,
        items_per_page: 0,
        has_next: false,
        has_previous: false
      });
    }
  },

  // Get category by ID/slug
  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      console.log(`📂 Getting category: ${id}`);
      
      // Convert slug back to category name
      const categoryName = id.replace(/-/g, ' ');
      
      const result = await pool.query(`
        SELECT category as name, 
               COUNT(*) as product_count
        FROM products 
        WHERE LOWER(category) LIKE LOWER($1)
        GROUP BY category
      `, [`%${categoryName}%`]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Category not found',
          category: null
        });
      }
      
      const row = result.rows[0];
      const category = {
        id: row.name.toLowerCase().replace(/\s+/g, '-'),
        name: row.name,
        slug: row.name.toLowerCase().replace(/\s+/g, '-'),
        product_count: parseInt(row.product_count),
        description: `קטגוריית ${row.name}`,
        parent: null
      };
      
      console.log(`✅ Found category: ${category.name}`);
      return res.json(category);
      
    } catch (error) {
      console.error('❌ Category error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: error.message,
        category: null
      });
    }
  },

  // Get products by category
  async getProductsByCategory(req, res) {
    try {
      const { id } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      
      console.log(`📂 Getting products for category: ${id}`);
      
      // Convert slug back to category name
      const categoryName = id.replace(/-/g, ' ');
      
      const result = await pool.query(`
        SELECT id, name, 
               COALESCE(price, 0) as price,
               retailer, cut_type, weight, 
               category, created_at, updated_at
        FROM products 
        WHERE LOWER(category) LIKE LOWER($1)
        ORDER BY name ASC
        LIMIT $2 OFFSET $3
      `, [`%${categoryName}%`, parseInt(limit), parseInt(offset)]);
      
      // Get total count
      const countResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM products 
        WHERE LOWER(category) LIKE LOWER($1)
      `, [`%${categoryName}%`]);
      
      const products = result.rows || [];
      const total = parseInt(countResult.rows[0]?.count || 0);
      
      console.log(`✅ Found ${products.length} products in category`);
      
      return res.json({
        products: products,
        category: categoryName,
        total_items: total,
        total_pages: Math.ceil(total / parseInt(limit)),
        current_page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
        items_per_page: parseInt(limit),
        has_next: (parseInt(offset) + parseInt(limit)) < total,
        has_previous: parseInt(offset) > 0
      });
      
    } catch (error) {
      console.error('❌ Category products error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: error.message,
        products: [],
        total_items: 0,
        total_pages: 0,
        current_page: 1,
        items_per_page: parseInt(limit),
        has_next: false,
        has_previous: false
      });
    }
  },

  // Get categories stats
  async getCategoriesStats(req, res) {
    try {
      console.log('📊 Getting categories statistics...');
      
      const result = await pool.query(`
        SELECT 
          COUNT(DISTINCT category) as total_categories,
          COUNT(*) as total_products,
          AVG(COALESCE(price, 0)) as average_price
        FROM products 
        WHERE category IS NOT NULL 
        AND category != ''
      `);
      
      const stats = result.rows[0] || {};
      
      console.log('✅ Categories stats calculated');
      
      return res.json({
        totalCategories: parseInt(stats.total_categories || 0),
        totalProducts: parseInt(stats.total_products || 0),
        averagePrice: parseFloat(stats.average_price || 0)
      });
      
    } catch (error) {
      console.error('❌ Categories stats error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: error.message,
        totalCategories: 0,
        totalProducts: 0,
        averagePrice: 0
      });
    }
  }
};

console.log('✅ Categories controller loaded');

module.exports = categoriesController;