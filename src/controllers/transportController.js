const { executeStoredProcedure } = require('../config/database');
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

  if (!wh) throw new Error('wh parameter is required');
  if (!status) throw new Error('status parameter is required');

  // 1. Fetch all reasons to create a lookup map.
  const reasonsList = await getReasonsData({});
  const reasonsMap = reasonsList.reduce((map, reason) => {
    map[String(reason.reason_id).trim()] = reason.reason_name;
    return map;
  }, {});

  logger.info('Executing page_Backlog for backlog data (No Cache)', { hcase, wh, status, reason });
  const backlogData = await executeStoredProcedure('page_Backlog', {
    hcase,
    p1: wh,
    p2: status,
    p3: reason,
    p4, p5, p6, p7, p8, p9, p10
  });

  if (!Array.isArray(backlogData)) {
    logger.warn('Unexpected response format from page_Backlog:', backlogData);
    return [];
  }

  // 2. Transform the data to include reason_name
  const transformedData = backlogData.map(record => {
    const newRecord = { ...record };
    if (newRecord.reason) {
      const reasonId = String(newRecord.reason).trim();
      newRecord.reason_id = reasonId;
      newRecord.reason_name = reasonsMap[reasonId] || null;
      delete newRecord.reason;
    } else {
      newRecord.reason_id = null;
      newRecord.reason_name = null;
    }
    return newRecord;
  });
  
  console.log(transformedData);
  
  return transformedData;
};

/**
 * Get warehouse data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Warehouse data
 */
const getWarehouseData = async (params) => {
  const {
    hcase = 'show_wh',
    p1 = '', p2 = '', p3 = '', p4 = '', p5 = '',
    p6 = '', p7 = '', p8 = '', p9 = '', p10 = ''
  } = params;

  logger.info('Executing page_Backlog for warehouses (No Cache)', { hcase });
  const result = await executeStoredProcedure('page_Backlog', {
    hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
  });

  if (!Array.isArray(result)) {
    logger.warn('Unexpected response format from page_Backlog for warehouses:', result);
    return [];
  }
  return result;
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
  const result = await executeStoredProcedure('page_Backlog', {
    hcase: 'show_po_detail',
    p1: po_no,
    p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });

  if (!Array.isArray(result)) {
    logger.warn('Unexpected response format from page_Backlog for PO details:', result);
    return [];
  }
  return result;
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
  const result = await executeStoredProcedure('page_Backlog', {
    hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
  });

  if (!Array.isArray(result)) {
    logger.warn('Unexpected response format from page_Backlog:', result);
    return [];
  }
  return result;
};

/**
 * Get reasons data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Reasons data
 */
const getReasonsData = async (params) => {
  logger.info('Executing page_Backlog for reasons (No Cache)');
  const result = await executeStoredProcedure('page_Backlog', {
    hcase: 'show_reason',
    p1: '', p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });

  if (!Array.isArray(result)) {
    logger.warn('Unexpected response format from page_Backlog for reasons:', result);
    return [];
  }
  return result;
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

  const result = await executeStoredProcedure('page_Backlog', {
    hcase: 'update_backlog',
    p1: reason || '',
    p2: other || '',
    p3: postpone || '',
    p4: usermodify || '',
    p5: po_no,
    p6: '',
    p7: '',
    p8: '',
    p9: '',
    p10: ''
  });

  return result;
};

module.exports = {
  getBacklogData,
  getWarehouseData,
  getPODetailsData,
  getGeneralTransportData,
  getReasonsData,
  updateBacklog
}; 