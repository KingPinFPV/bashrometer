// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authRateLimit } = require('../middleware/rateLimitMiddleware');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (with rate limiting)
router.post('/register', authRateLimit, authController.register);

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public (with rate limiting)
router.post('/login', authRateLimit, authController.login);

// @route   GET /api/auth/me
// @desc    Get current logged-in user's information
// @access  Private (requires token)
router.get('/me', authenticateToken, authController.me);

module.exports = router;