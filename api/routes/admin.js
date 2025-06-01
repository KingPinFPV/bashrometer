const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const {
  getDashboardStats, getSubtypesManagement, createSubtype, updateSubtype,
  getUsersManagement, updateUserRole, approveProduct, rejectProduct, 
  updateProduct, getAllUsers, deleteUser
} = require('../controllers/adminController');
const {
  getProductByIdAdmin
} = require('../controllers/productsController');

// דשבורד מנהל
router.get('/dashboard', authenticateToken, authorizeRole(['admin']), getDashboardStats);

// ניהול תת-סוגים
router.get('/subtypes', authenticateToken, authorizeRole(['admin']), getSubtypesManagement);
router.post('/subtypes', authenticateToken, authorizeRole(['admin']), createSubtype);
router.put('/subtypes/:id', authenticateToken, authorizeRole(['admin']), updateSubtype);

// ניהול משתמשים
router.get('/users', authenticateToken, authorizeRole(['admin']), getAllUsers);
router.get('/users/management', authenticateToken, authorizeRole(['admin']), getUsersManagement);
router.put('/users/:id/role', authenticateToken, authorizeRole(['admin']), updateUserRole);
router.patch('/users/:id/role', authenticateToken, authorizeRole(['admin']), updateUserRole);
router.delete('/users/:id', authenticateToken, authorizeRole(['admin']), deleteUser);

// ניהול מוצרים
router.get('/products/:id', authenticateToken, authorizeRole(['admin']), getProductByIdAdmin);
router.post('/products/:id/approve', authenticateToken, authorizeRole(['admin']), approveProduct);
router.post('/products/:id/reject', authenticateToken, authorizeRole(['admin']), rejectProduct);
router.put('/products/:id', authenticateToken, authorizeRole(['admin']), updateProduct);

module.exports = router;