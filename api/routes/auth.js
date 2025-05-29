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

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private (requires token, with rate limiting)
router.put('/change-password', authRateLimit, authenticateToken, authController.changePassword);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public (with rate limiting)
router.post('/forgot-password', authRateLimit, authController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
// @access  Public (with rate limiting)
router.post('/reset-password', authRateLimit, authController.resetPassword);

// @route   PUT /api/auth/update-profile
// @desc    Update user profile (name, email)
// @access  Private (requires token, with rate limiting)
router.put('/update-profile', authRateLimit, authenticateToken, authController.updateProfile);

module.exports = router;