const { exec } = require('../config/sequelize');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

/**
 * Get active warehouses
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Active warehouse data
 */
const getActiveWarehouses = async (params) => {
  logger.info('Executing page_Manage_Warehouse for active warehouses', { hcase: 'show_wh' });
  return await exec('page_Manage_Warehouse', {
    hcase: 'show_wh',
    p1: '', p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Get all warehouses (including inactive)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} All warehouse data
 */
const getAllWarehouses = async (params) => {
  logger.info('Executing page_Manage_Warehouse for all warehouses', { hcase: 'show_all' });
  return await exec('page_Manage_Warehouse', {
    hcase: 'show_all',
    p1: '', p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Get warehouse by ID
 * @param {Object} params - Request parameters
 * @param {string} params.warehouse_id - Warehouse ID
 * @returns {Promise<Array>} Warehouse data
 */
const getWarehouseById = async (params) => {
  const { warehouse_id } = params;

  if (!warehouse_id) {
    throw new Error('warehouse_id parameter is required');
  }

  logger.info('Executing page_Manage_Warehouse to get warehouse by ID', { 
    hcase: 'get_wh', 
    warehouse_id 
  });
  
  return await exec('page_Manage_Warehouse', {
    hcase: 'get_wh',
    p1: warehouse_id,
    p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Add new warehouse
 * @param {Object} params - Request parameters
 * @param {string} params.warehouse_id - Warehouse ID
 * @param {string} params.warehouse_name - Warehouse name
 * @param {string} params.status - Status (1 for active, 0 for inactive)
 * @returns {Promise<Object>} Result of the add operation
 */
const addWarehouse = async (params) => {
  const { warehouse_id, warehouse_name, status = '1' } = params;

  if (!warehouse_id || !warehouse_name) {
    throw new Error('warehouse_id and warehouse_name are required');
  }

  logger.info('Executing page_Manage_Warehouse to add warehouse', { 
    hcase: 'add_wh', 
    warehouse_id, 
    warehouse_name, 
    status 
  });
  
  return await exec('page_Manage_Warehouse', {
    hcase: 'add_wh',
    p1: warehouse_id,
    p2: warehouse_name,
    p3: status,
    p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Edit warehouse
 * @param {Object} params - Request parameters
 * @param {string} params.warehouse_id - Warehouse ID
 * @param {string} params.warehouse_name - New warehouse name
 * @param {string} params.status - Status (1 for active, 0 for inactive)
 * @returns {Promise<Object>} Result of the edit operation
 */
const editWarehouse = async (params) => {
  const { warehouse_id, warehouse_name, status = '1' } = params;

  if (!warehouse_id || !warehouse_name) {
    throw new Error('warehouse_id and warehouse_name are required');
  }

  logger.info('Executing page_Manage_Warehouse to edit warehouse', { 
    hcase: 'edit_wh', 
    warehouse_id, 
    warehouse_name, 
    status 
  });
  
  return await exec('page_Manage_Warehouse', {
    hcase: 'edit_wh',
    p1: warehouse_id,
    p2: warehouse_name,
    p3: status,
    p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Activate warehouse
 * @param {Object} params - Request parameters
 * @param {string} params.warehouse_id - Warehouse ID
 * @returns {Promise<Object>} Result of the activation operation
 */
const activateWarehouse = async (params) => {
  const { warehouse_id } = params;

  if (!warehouse_id) {
    throw new Error('warehouse_id parameter is required');
  }

  logger.info('Executing page_Manage_Warehouse to activate warehouse', { 
    hcase: 'active_wh', 
    warehouse_id 
  });
  
  return await exec('page_Manage_Warehouse', {
    hcase: 'active_wh',
    p1: warehouse_id,
    p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Deactivate warehouse
 * @param {Object} params - Request parameters
 * @param {string} params.warehouse_id - Warehouse ID
 * @returns {Promise<Object>} Result of the deactivation operation
 */
const deactivateWarehouse = async (params) => {
  const { warehouse_id } = params;

  if (!warehouse_id) {
    throw new Error('warehouse_id parameter is required');
  }

  logger.info('Executing page_Manage_Warehouse to deactivate warehouse', { 
    hcase: 'inactive_wh', 
    warehouse_id 
  });
  
  return await exec('page_Manage_Warehouse', {
    hcase: 'inactive_wh',
    p1: warehouse_id,
    p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Toggle warehouse status
 * @param {Object} params - Request parameters
 * @param {string} params.warehouse_id - Warehouse ID
 * @returns {Promise<Object>} Result of the toggle operation
 */
const toggleWarehouseStatus = async (params) => {
  const { warehouse_id } = params;

  if (!warehouse_id) {
    throw new Error('warehouse_id parameter is required');
  }

  logger.info('Executing page_Manage_Warehouse to toggle warehouse status', { 
    hcase: 'toggle_status', 
    warehouse_id 
  });
  
  return await exec('page_Manage_Warehouse', {
    hcase: 'toggle_status',
    p1: warehouse_id,
    p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Delete warehouse
 * @param {Object} params - Request parameters
 * @param {string} params.warehouse_id - Warehouse ID
 * @returns {Promise<Object>} Result of the delete operation
 */
const deleteWarehouse = async (params) => {
  const { warehouse_id } = params;

  if (!warehouse_id) {
    throw new Error('warehouse_id parameter is required');
  }

  logger.info('Executing page_Manage_Warehouse to delete warehouse', { 
    hcase: 'delete_wh', 
    warehouse_id 
  });
  
  return await exec('page_Manage_Warehouse', {
    hcase: 'delete_wh',
    p1: warehouse_id,
    p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

module.exports = {
  getActiveWarehouses,
  getAllWarehouses,
  getWarehouseById,
  addWarehouse,
  editWarehouse,
  activateWarehouse,
  deactivateWarehouse,
  toggleWarehouseStatus,
  deleteWarehouse
}; 