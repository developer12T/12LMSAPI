const { exec } = require('../config/sequelize');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

/**
 * Get backlog data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Backlog data
 */
const getBacklogData = async (params) => {
  const {
    hcase = 'show_databl',
    wh,
    status,
    reason = '',
    p4 = '', p5 = '', p6 = '', p7 = '', p8 = '', p9 = '', p10 = ''
  } = params;

  const p1 = wh || '';
  const p2 = status || '';
  const p3 = reason || '';

  logger.info('Executing page_Backlog for backlog data (No Cache)', { hcase });
  return await exec('page_Backlog', {
    hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
  });
};

/**
 * Get warehouse data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Warehouse data
 */
const getWarehouseData = async (params) => {
  const { hcase = 'show_wh' } = params;

  logger.info('Executing page_Backlog for warehouses (No Cache)', { hcase });
  return await exec('page_Backlog', {
    hcase, p1: '', p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Get PO details data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} PO details data
 */
const getPODetailsData = async (params) => {
  const { po_no } = params;

  if (!po_no) throw new Error('po_no parameter is required');

  logger.info('Executing page_Backlog for PO details (No Cache)', { po_no });
  return await exec('page_Backlog', {
    hcase: 'show_po_detail',
    p1: po_no,
    p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Get general transport data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} General transport data
 */
const getGeneralTransportData = async (params) => {
  const {
    hcase = 'show_wh',
    p1 = '', p2 = '', p3 = '', p4 = '', p5 = '',
    p6 = '', p7 = '', p8 = '', p9 = '', p10 = ''
  } = params;

  logger.info('Fetching general transport data (No Cache)', { hcase });
  return await exec('page_Backlog', {
    hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
  });
};

/**
 * Get reasons data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Reasons data
 */
const getReasonsData = async (params) => {
  logger.info('Executing page_Backlog for reasons (No Cache)');
  return await exec('page_Backlog', {
    hcase: 'show_reason',
    p1: '', p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Update backlog data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} Result of the update operation
 */
const updateBacklog = async (params) => {
  const {
    reason,
    other,
    postpone,
    po_no,
    usermodify
  } = params;

  if (!po_no) {
    throw new Error('po_no is required to update backlog');
  }

  logger.info('Executing page_Backlog to update backlog', { po_no, usermodify });
  return await exec('page_Backlog', {
    hcase: 'update_backlog',
    p1: reason || '',
    p2: other || '',
    p3: postpone || '',
    p4: usermodify || '',
    p5: po_no,
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Get Gen_back_order data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Gen_back_order data
 */
const getGenBackOrderData = async (params) => {
  const {
    hcase = 'getdata_bl',
    p1 = '', p2 = ''
  } = params;

  logger.info('Executing Gen_back_order for data (No Cache)', { hcase });
  return await exec('page_Backlog', {
    hcase, p1, p2, p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

module.exports = {
  getBacklogData,
  getWarehouseData,
  getPODetailsData,
  getGeneralTransportData,
  getReasonsData,
  updateBacklog,
  getGenBackOrderData
}; 