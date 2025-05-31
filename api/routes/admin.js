const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const {
  getDashboardStats, getSubtypesManagement, createSubtype, updateSubtype,
  getUsersManagement, updateUserRole
} = require('../controllers/adminController');

// דשבורד מנהל
router.get('/dashboard', authenticateToken, authorizeRole(['admin']), getDashboardStats);

// ניהול תת-סוגים
router.get('/subtypes', authenticateToken, authorizeRole(['admin']), getSubtypesManagement);
router.post('/subtypes', authenticateToken, authorizeRole(['admin']), createSubtype);
router.put('/subtypes/:id', authenticateToken, authorizeRole(['admin']), updateSubtype);

// ניהול משתמשים
router.get('/users', authenticateToken, authorizeRole(['admin']), getUsersManagement);
router.patch('/users/:id/role', authenticateToken, authorizeRole(['admin']), updateUserRole);

module.exports = router;