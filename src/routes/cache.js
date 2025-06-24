const express = require('express');
const router = express.Router();
const { clearCache } = require('../controllers/cacheController');
const { authMiddleware } = require('../middleware/ldapAuth');

/**
 * @route   POST /api/cache/clear
 * @desc    Clear cache by prefix
 * @access  Private
 */
router.post('/clear', authMiddleware, clearCache);

module.exports = router; 