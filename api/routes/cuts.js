// routes/cuts.js
const express = require('express');
const router = express.Router();
const cutsController = require('../controllers/cutsController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

console.log('🔗 Loading cuts routes...');

// Public routes
// GET /api/cuts - קבלת כל הנתחים
router.get('/', cutsController.getAllCuts);

// GET /api/cuts/categories - קבלת כל הקטגוריות
router.get('/categories', cutsController.getCategories);

// GET /api/cuts/:id - קבלת נתח לפי ID
router.get('/:id', cutsController.getCutById);

// Protected routes (Admin only)
// POST /api/cuts - הוספת נתח חדש
router.post('/', authenticateToken, requireAdmin, cutsController.createCut);

// PUT /api/cuts/:id - עדכון נתח
router.put('/:id', authenticateToken, requireAdmin, cutsController.updateCut);

// DELETE /api/cuts/:id - מחיקת נתח
router.delete('/:id', authenticateToken, requireAdmin, cutsController.deleteCut);

console.log('✅ Cuts routes loaded successfully');

module.exports = router;