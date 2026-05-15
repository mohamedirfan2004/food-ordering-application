const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// @route   POST /api/auth/login
// @desc    Authenticate admin & get token
// @access  Public
router.post('/login', authController.login);

// @route   GET /api/auth/profile
// @desc    Get admin profile
// @access  Private
router.get('/profile', auth, authController.getProfile);

// @route   PUT /api/auth/print-settings
// @desc    Update admin print permissions and print defaults
// @access  Private
router.put('/print-settings', auth, authController.updatePrintSettings);

module.exports = router;
