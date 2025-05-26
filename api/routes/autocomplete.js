// routes/autocomplete.js
const express = require('express');
const router = express.Router();
const autocompleteController = require('../controllers/autocompleteController');

// GET /api/autocomplete/meat-cuts?q=בקר&category=בקר&limit=10
router.get('/meat-cuts', autocompleteController.searchMeatCuts);

// GET /api/autocomplete/brands?q=רמי&type=supplier&limit=10  
router.get('/brands', autocompleteController.searchBrands);

// GET /api/autocomplete/meat-cut-categories
router.get('/meat-cut-categories', autocompleteController.getMeatCutCategories);

// GET /api/autocomplete/brand-types
router.get('/brand-types', autocompleteController.getBrandTypes);

module.exports = router;