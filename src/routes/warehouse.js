const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/ldapAuth');
const { setupLogger } = require('../utils/logger');
const {
  getActiveWarehouses,
  getAllWarehouses,
  getWarehouseById,
  addWarehouse,
  editWarehouse,
  activateWarehouse,
  deactivateWarehouse,
  toggleWarehouseStatus,
  deleteWarehouse
} = require('../controllers/warehouseController');

const logger = setupLogger();

// Apply authentication middleware to all warehouse routes
router.use(authMiddleware);

/**
 * GET /api/warehouse
 * Get active warehouses
 */
router.get('/', async (req, res) => {
  try {
    logger.info('Fetching active warehouses from database');
    const data = await getActiveWarehouses(req.query);

    res.json({
      success: true,
      data: data,
      message: 'Active warehouses retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in warehouse route (active):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active warehouses',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/warehouse/all
 * Get all warehouses including inactive
 */
router.get('/all', async (req, res) => {
  try {
    logger.info('Fetching all warehouses from database');
    const data = await getAllWarehouses(req.query);

    res.json({
      success: true,
      data: data,
      message: 'All warehouses retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in warehouse route (all):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch all warehouses',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/warehouse/:id
 * Get warehouse by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = await getWarehouseById({ warehouse_id: id });

    res.json({
      success: true,
      data: data,
      message: 'Warehouse retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in warehouse route (by ID):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch warehouse',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/warehouse
 * Add new warehouse
 */
router.post('/', async (req, res) => {
  try {
    const { warehouse_id, warehouse_name, status = '1' } = req.body;

    if (!warehouse_id || !warehouse_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'warehouse_id and warehouse_name are required'
      });
    }

    const result = await addWarehouse({
      warehouse_id,
      warehouse_name,
      status
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Warehouse added successfully'
    });
  } catch (error) {
    logger.error('Error in warehouse route (add):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add warehouse',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/warehouse/:id
 * Edit warehouse
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouse_name, status = '1' } = req.body;

    if (!warehouse_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'warehouse_name is required'
      });
    }

    const result = await editWarehouse({
      warehouse_id: id,
      warehouse_name,
      status
    });

    res.json({
      success: true,
      data: result,
      message: 'Warehouse updated successfully'
    });
  } catch (error) {
    logger.error('Error in warehouse route (edit):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update warehouse',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/warehouse/:id/activate
 * Activate warehouse
 */
router.patch('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await activateWarehouse({ warehouse_id: id });

    res.json({
      success: true,
      data: result,
      message: 'Warehouse activated successfully'
    });
  } catch (error) {
    logger.error('Error in warehouse route (activate):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate warehouse',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/warehouse/:id/deactivate
 * Deactivate warehouse
 */
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deactivateWarehouse({ warehouse_id: id });

    res.json({
      success: true,
      data: result,
      message: 'Warehouse deactivated successfully'
    });
  } catch (error) {
    logger.error('Error in warehouse route (deactivate):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate warehouse',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/warehouse/:id/toggle
 * Toggle warehouse status
 */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await toggleWarehouseStatus({ warehouse_id: id });

    res.json({
      success: true,
      data: result,
      message: 'Warehouse status toggled successfully'
    });
  } catch (error) {
    logger.error('Error in warehouse route (toggle):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle warehouse status',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/warehouse/:id
 * Delete warehouse
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteWarehouse({ warehouse_id: id });

    res.json({
      success: true,
      data: result,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    logger.error('Error in warehouse route (delete):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete warehouse',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 