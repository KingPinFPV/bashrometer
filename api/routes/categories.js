const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');

console.log('🔗 Loading categories routes...');

// GET /api/categories - Get all categories
router.get('/', categoriesController.getAllCategories);

console.log('✅ Categories routes loaded successfully');

module.exports = router;