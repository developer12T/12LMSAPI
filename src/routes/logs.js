const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/ldapAuth');
const { setupLogger } = require('../utils/logger'); 

const logger = setupLogger();

// Protect the log viewer with authentication
// router.use(authMiddleware);

// Log viewer page
router.get('/', (req, res) => {
    res.render('layout');
});

module.exports = router; 