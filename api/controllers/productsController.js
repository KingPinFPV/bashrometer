// controllers/productsController.js
const pool = require('../db');

console.log('🔄 Loading products controller...');

const getAllProducts = async (req, res) => {
  try {
    console.log('📦 Getting all products...');
    console.log('Query params:', req.query);
    
    const { 
      limit = 20, offset = 0, sort_by = 'name', order = 'ASC'
    } = req.query;
    
    const validSortColumns = ['name', 'price', 'retailer', 'cut_type', 'created_at'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'name';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    // Count total products
    const countQuery = 'SELECT COUNT(*) FROM products';
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult?.rows?.[0]?.count || 0);
    
    // Get products with all expected columns
    const productsQuery = `
      SELECT id, name, 
             COALESCE(price, 0) as price,
             retailer, cut_type, weight, category,
             created_at, updated_at
      FROM products 
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $1 OFFSET $2
    `;
    
    console.log('📝 Query:', productsQuery);
    
    const result = await pool.query(productsQuery, [parseInt(limit), parseInt(offset)]);
    const products = result?.rows || [];
    
    console.log(`✅ Found ${products.length} products (total: ${total})`);
    
    // Frontend-compatible response format
    res.json({
      products: products,
      total_items: total,
      total_pages: Math.ceil(total / parseInt(limit)),
      current_page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      items_per_page: parseInt(limit),
      has_next: (parseInt(offset) + parseInt(limit)) < total,
      has_previous: parseInt(offset) > 0
    });
    
  } catch (error) {
    console.error('❌ Error getting products:', error);
    console.error('Error details:', error.message);
    
    // If the error is about missing price column, try without it
    if (error.message.includes('column "price" does not exist')) {
      console.log('🔄 Retrying without price column...');
      try {
        const fallbackQuery = `
          SELECT id, name, 0 as price,
                 retailer, cut_type, weight, category,
                 created_at, updated_at
          FROM products 
          ORDER BY name ASC
          LIMIT $1 OFFSET $2
        `;
        
        const result = await pool.query(fallbackQuery, [parseInt(limit), parseInt(offset)]);
        const countResult = await pool.query('SELECT COUNT(*) FROM products');
        const products = result?.rows || [];
        const total = parseInt(countResult?.rows?.[0]?.count || 0);
        
        return res.json({
          products: products,
          total_items: total,
          total_pages: Math.ceil(total / parseInt(limit)),
          current_page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
          items_per_page: parseInt(limit),
          has_next: (parseInt(offset) + parseInt(limit)) < total,
          has_previous: parseInt(offset) > 0,
          warning: 'Price column missing - showing default prices'
        });
      } catch (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError);
      }
    }
    
    // Enhanced error response with frontend-compatible format
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
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📦 Getting product by ID: ${id}`);
    
    const query = 'SELECT * FROM products WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({
      product: result.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error getting product by ID:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
};

const createProduct = async (req, res) => {
  try {
    console.log('➕ Creating new product...');
    console.log('Request body:', req.body);
    
    const { name, price, retailer, cut_type, weight } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    const query = `
      INSERT INTO products (name, price, retailer, cut_type, weight)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [name, price, retailer || null, cut_type || null, weight || null];
    const result = await pool.query(query, values);
    
    console.log('✅ Product created:', result.rows[0]);
    
    res.status(201).json({
      product: result.rows[0],
      message: 'Product created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Updating product ID: ${id}`);
    
    const { name, price, retailer, cut_type, weight } = req.body;
    
    // Check if product exists
    const checkQuery = 'SELECT * FROM products WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const query = `
      UPDATE products 
      SET name = $1, price = $2, retailer = $3, cut_type = $4, weight = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;
    
    const values = [
      name || checkResult.rows[0].name,
      price || checkResult.rows[0].price,
      retailer !== undefined ? retailer : checkResult.rows[0].retailer,
      cut_type !== undefined ? cut_type : checkResult.rows[0].cut_type,
      weight !== undefined ? weight : checkResult.rows[0].weight,
      id
    ];
    
    const result = await pool.query(query, values);
    
    console.log('✅ Product updated:', result.rows[0]);
    
    res.json({
      product: result.rows[0],
      message: 'Product updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting product ID: ${id}`);
    
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    console.log('✅ Product deleted:', id);
    res.status(204).send();
    
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

const getProductStats = async (req, res) => {
  try {
    console.log('📊 Getting product statistics...');
    
    const query = `
      SELECT 
        COUNT(*) as total_products,
        AVG(COALESCE(price, 0)) as average_price,
        MIN(COALESCE(price, 0)) as min_price,
        MAX(COALESCE(price, 0)) as max_price,
        COUNT(DISTINCT retailer) as unique_retailers
      FROM products
    `;
    
    const result = await pool.query(query);
    const stats = result?.rows?.[0] || {};
    
    console.log('✅ Product stats calculated');
    
    res.json({
      totalProducts: parseInt(stats.total_products || 0),
      averagePrice: parseFloat(stats.average_price || 0),
      minPrice: parseFloat(stats.min_price || 0),
      maxPrice: parseFloat(stats.max_price || 0),
      uniqueRetailers: parseInt(stats.unique_retailers || 0)
    });
    
  } catch (error) {
    console.error('❌ Products stats error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      totalProducts: 0,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      uniqueRetailers: 0
    });
  }
};

console.log('✅ Products controller loaded');

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
};