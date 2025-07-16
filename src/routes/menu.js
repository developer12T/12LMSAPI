const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/ldapAuth');
const { setupLogger } = require('../utils/logger');
const {
  getAllMenus,
  getActiveMenus,
  getMenuById,
  getMenusBySystem,
  addMenu,
  editMenu,
  activateMenu,
  deactivateMenu,
  toggleMenuStatus,
  deleteMenu,
  updateMenuSortOrder,
  getMenuStructure
} = require('../controllers/menuController');

const logger = setupLogger();

// Apply authentication middleware to all menu routes
router.use(authMiddleware);

/**
 * GET /api/menu
 * Get all menus
 */
router.get('/', async (req, res) => {
  try {
    logger.info('Fetching all menus from database');
    const data = await getAllMenus(req.query);

    res.json({
      success: true,
      data: data,
      message: 'All menus retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in menu route (all):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch all menus',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/menu/active
 * Get active menus
 */
router.get('/active', async (req, res) => {
  try {
    logger.info('Fetching active menus from database');
    const data = await getActiveMenus(req.query);

    res.json({
      success: true,
      data: data,
      message: 'Active menus retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in menu route (active):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active menus',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/menu/structure
 * Get menu structure (formatted for frontend)
 */
router.get('/structure', async (req, res) => {
  try {
    logger.info('Fetching menu structure from database');
    const data = await getMenuStructure(req.query);

    res.json({
      success: true,
      data: data,
      message: 'Menu structure retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in menu route (structure):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu structure',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/menu/system/:system
 * Get menus by system
 */
router.get('/system/:system', async (req, res) => {
  try {
    const { system } = req.params;
    
    const data = await getMenusBySystem({ system });

    res.json({
      success: true,
      data: data,
      message: `Menus for system ${system} retrieved successfully`
    });
  } catch (error) {
    logger.error('Error in menu route (by system):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menus by system',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/menu/:id
 * Get menu by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = await getMenuById({ menu_id: id });

    res.json({
      success: true,
      data: data,
      message: 'Menu retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in menu route (by ID):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/menu
 * Add new menu
 */
router.post('/', async (req, res) => {
  try {
    const { 
      system, 
      category, 
      item_name, 
      route_path, 
      icon = '', 
      status = '1', 
      sort_order = '0' 
    } = req.body;

    if (!system || !category || !item_name || !route_path) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'system, category, item_name, and route_path are required'
      });
    }

    const result = await addMenu({
      system,
      category,
      item_name,
      route_path,
      icon,
      status,
      sort_order
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Menu added successfully'
    });
  } catch (error) {
    logger.error('Error in menu route (add):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add menu',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/menu/:id
 * Edit menu
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      system, 
      category, 
      item_name, 
      route_path, 
      icon = '', 
      status = '1', 
      sort_order = '0' 
    } = req.body;

    if (!system || !category || !item_name || !route_path) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'system, category, item_name, and route_path are required'
      });
    }

    const result = await editMenu({
      menu_id: id,
      system,
      category,
      item_name,
      route_path,
      icon,
      status,
      sort_order
    });

    res.json({
      success: true,
      data: result,
      message: 'Menu updated successfully'
    });
  } catch (error) {
    logger.error('Error in menu route (edit):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update menu',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/menu/:id/activate
 * Activate menu
 */
router.patch('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await activateMenu({ menu_id: id });

    res.json({
      success: true,
      data: result,
      message: 'Menu activated successfully'
    });
  } catch (error) {
    logger.error('Error in menu route (activate):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate menu',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/menu/:id/deactivate
 * Deactivate menu
 */
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deactivateMenu({ menu_id: id });

    res.json({
      success: true,
      data: result,
      message: 'Menu deactivated successfully'
    });
  } catch (error) {
    logger.error('Error in menu route (deactivate):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate menu',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/menu/:id/toggle
 * Toggle menu status
 */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await toggleMenuStatus({ menu_id: id });

    res.json({
      success: true,
      data: result,
      message: 'Menu status toggled successfully'
    });
  } catch (error) {
    logger.error('Error in menu route (toggle):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle menu status',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/menu/:id/sort
 * Update menu sort order
 */
router.patch('/:id/sort', async (req, res) => {
  try {
    const { id } = req.params;
    const { sort_order } = req.body;

    if (sort_order === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'sort_order is required'
      });
    }

    const result = await updateMenuSortOrder({ 
      menu_id: id, 
      sort_order 
    });

    res.json({
      success: true,
      data: result,
      message: 'Menu sort order updated successfully'
    });
  } catch (error) {
    logger.error('Error in menu route (sort):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update menu sort order',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/menu/:id
 * Delete menu
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteMenu({ menu_id: id });

    res.json({
      success: true,
      data: result,
      message: 'Menu deleted successfully'
    });
  } catch (error) {
    logger.error('Error in menu route (delete):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete menu',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 