const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const {
  createProductRequest,
  createRetailerRequest,
  getPendingProductRequests,
  getPendingRetailerRequests,
  processProductRequest,
  processRetailerRequest
} = require('../controllers/requestsController');

// User routes - create requests
router.post('/products', authenticateToken, createProductRequest);
router.post('/retailers', authenticateToken, createRetailerRequest);

// Admin routes - manage requests
router.get('/products/pending', authenticateToken, requireAdmin, getPendingProductRequests);
router.get('/retailers/pending', authenticateToken, requireAdmin, getPendingRetailerRequests);
router.post('/products/:id/process', authenticateToken, requireAdmin, processProductRequest);
router.post('/retailers/:id/process', authenticateToken, requireAdmin, processRetailerRequest);

module.exports = router;