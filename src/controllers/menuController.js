const menuDb = require('../config/menuDb');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

/**
 * Get all menu data
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Menu data
 */
const getAllMenus = async (params) => {
  logger.info('Getting all menus from SQLite database');
  return await menuDb.getAllMenus();
};

/**
 * Get active menu data
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Active menu data
 */
const getActiveMenus = async (params) => {
  logger.info('Getting active menus from SQLite database');
  return await menuDb.getActiveMenus();
};

/**
 * Get menu by ID
 * @param {Object} params - Request parameters
 * @param {string} params.menu_id - Menu ID
 * @returns {Promise<Array>} Menu data
 */
const getMenuById = async (params) => {
  const { menu_id } = params;

  if (!menu_id) {
    throw new Error('menu_id parameter is required');
  }

  logger.info('Getting menu by ID from SQLite database', { menu_id });
  
  return await menuDb.getMenuById(menu_id);
};

/**
 * Get menus by system
 * @param {Object} params - Request parameters
 * @param {string} params.system - System name (OMS, WMS, TMS, PMS)
 * @returns {Promise<Array>} Menu data for specific system
 */
const getMenusBySystem = async (params) => {
  const { system } = params;

  if (!system) {
    throw new Error('system parameter is required');
  }

  logger.info('Getting menus by system from SQLite database', { system });
  
  return await menuDb.getMenusBySystem(system);
};

/**
 * Add new menu
 * @param {Object} params - Request parameters
 * @param {string} params.system - System name
 * @param {string} params.category - Category name
 * @param {string} params.item_name - Menu item name
 * @param {string} params.route_path - Route path
 * @param {string} params.icon - Icon name
 * @param {string} params.status - Status (1 for active, 0 for inactive)
 * @param {string} params.sort_order - Sort order
 * @returns {Promise<Object>} Result of the add operation
 */
const addMenu = async (params) => {
  const { 
    system, 
    category, 
    item_name, 
    route_path, 
    icon = '', 
    status = '1', 
    sort_order = '0' 
  } = params;

  if (!system || !category || !item_name || !route_path) {
    throw new Error('system, category, item_name, and route_path are required');
  }

  logger.info('Adding new menu to SQLite database', { 
    system, 
    category, 
    item_name, 
    route_path 
  });
  
  return await menuDb.addMenu({
    system,
    category,
    item_name,
    route_path,
    icon,
    status: parseInt(status),
    sort_order: parseInt(sort_order)
  });
};

/**
 * Edit menu
 * @param {Object} params - Request parameters
 * @param {string} params.menu_id - Menu ID
 * @param {string} params.system - System name
 * @param {string} params.category - Category name
 * @param {string} params.item_name - Menu item name
 * @param {string} params.route_path - Route path
 * @param {string} params.icon - Icon name
 * @param {string} params.status - Status (1 for active, 0 for inactive)
 * @param {string} params.sort_order - Sort order
 * @returns {Promise<Object>} Result of the edit operation
 */
const editMenu = async (params) => {
  const { 
    menu_id,
    system, 
    category, 
    item_name, 
    route_path, 
    icon = '', 
    status = '1', 
    sort_order = '0' 
  } = params;

  if (!menu_id || !system || !category || !item_name || !route_path) {
    throw new Error('menu_id, system, category, item_name, and route_path are required');
  }

  logger.info('Editing menu in SQLite database', { 
    menu_id,
    system, 
    category, 
    item_name, 
    route_path 
  });
  
  return await menuDb.editMenu({
    menu_id: parseInt(menu_id),
    system,
    category,
    item_name,
    route_path,
    icon,
    status: parseInt(status),
    sort_order: parseInt(sort_order)
  });
};

/**
 * Activate menu
 * @param {Object} params - Request parameters
 * @param {string} params.menu_id - Menu ID
 * @returns {Promise<Object>} Result of the activation operation
 */
const activateMenu = async (params) => {
  const { menu_id } = params;

  if (!menu_id) {
    throw new Error('menu_id parameter is required');
  }

  logger.info('Activating menu in SQLite database', { menu_id });
  
  return await menuDb.activateMenu(parseInt(menu_id));
};

/**
 * Deactivate menu
 * @param {Object} params - Request parameters
 * @param {string} params.menu_id - Menu ID
 * @returns {Promise<Object>} Result of the deactivation operation
 */
const deactivateMenu = async (params) => {
  const { menu_id } = params;

  if (!menu_id) {
    throw new Error('menu_id parameter is required');
  }

  logger.info('Deactivating menu in SQLite database', { menu_id });
  
  return await menuDb.deactivateMenu(parseInt(menu_id));
};

/**
 * Toggle menu status
 * @param {Object} params - Request parameters
 * @param {string} params.menu_id - Menu ID
 * @returns {Promise<Object>} Result of the toggle operation
 */
const toggleMenuStatus = async (params) => {
  const { menu_id } = params;

  if (!menu_id) {
    throw new Error('menu_id parameter is required');
  }

  logger.info('Toggling menu status in SQLite database', { menu_id });
  
  return await menuDb.toggleMenuStatus(parseInt(menu_id));
};

/**
 * Delete menu
 * @param {Object} params - Request parameters
 * @param {string} params.menu_id - Menu ID
 * @returns {Promise<Object>} Result of the delete operation
 */
const deleteMenu = async (params) => {
  const { menu_id } = params;

  if (!menu_id) {
    throw new Error('menu_id parameter is required');
  }

  logger.info('Deleting menu from SQLite database', { menu_id });
  
  return await menuDb.deleteMenu(parseInt(menu_id));
};

/**
 * Update menu sort order
 * @param {Object} params - Request parameters
 * @param {string} params.menu_id - Menu ID
 * @param {string} params.sort_order - New sort order
 * @returns {Promise<Object>} Result of the sort order update
 */
const updateMenuSortOrder = async (params) => {
  const { menu_id, sort_order } = params;

  if (!menu_id || sort_order === undefined) {
    throw new Error('menu_id and sort_order are required');
  }

  logger.info('Updating menu sort order in SQLite database', { 
    menu_id, 
    sort_order 
  });
  
  return await menuDb.updateMenuSortOrder(parseInt(menu_id), parseInt(sort_order));
};

/**
 * Get menu structure (formatted for frontend)
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} Formatted menu structure
 */
const getMenuStructure = async (params) => {
  logger.info('Getting menu structure from SQLite database');
  
  return await menuDb.getMenuStructure();
};

module.exports = {
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
}; 