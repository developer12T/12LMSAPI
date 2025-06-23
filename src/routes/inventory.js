const express = require('express');
const router = express.Router();
const { executeStoredProcedure } = require('../config/database');
const { authMiddleware } = require('../middleware/ldapAuth');
const { getCacheKey, getCachedData } = require('../utils/cache');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

// Apply authentication middleware to all inventory routes
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const cacheKey = getCacheKey('inventory', req.query);
    
    const data = await getCachedData(
      cacheKey,
      async () => {
        logger.info('Fetching inventory data from database');
        return await executeStoredProcedure('SP_GetInventory', req.query);
      }
    );

    res.json(data);
  } catch (error) {
    logger.error('Error in inventory route:', error);
    res.status(500).json({
      error: 'Failed to fetch inventory data',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Additional inventory endpoints can be added here
// Example: POST for updating inventory
router.post('/update', async (req, res) => {
  try {
    const result = await executeStoredProcedure('SP_UpdateInventory', req.body);
    res.json(result);
  } catch (error) {
    logger.error('Error updating inventory:', error);
    res.status(500).json({
      error: 'Failed to update inventory',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 