// routes/categories.js
const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');

console.log('🔗 Loading categories routes...');

// Health check for categories routes
router.get('/health', (req, res) => {
  res.json({ 
    status: 'Categories routes OK',
    timestamp: new Date().toISOString()
  });
});

// GET /api/categories - Get all categories
router.get('/', categoriesController.getAllCategories);
console.log('✅ GET / route registered');

// GET /api/categories/stats - Get categories statistics
router.get('/stats', categoriesController.getCategoriesStats);
console.log('✅ GET /stats route registered');

// GET /api/categories/:id - Get category by ID/slug
router.get('/:id', categoriesController.getCategoryById);
console.log('✅ GET /:id route registered');

// GET /api/categories/:id/products - Get products by category
router.get('/:id/products', categoriesController.getProductsByCategory);
console.log('✅ GET /:id/products route registered');

console.log('✅ Categories routes loaded successfully');

module.exports = router;