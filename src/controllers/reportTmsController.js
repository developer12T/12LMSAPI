const { executeStoredProcedure } = require('../config/database');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

/**
 * Clean string fields by trimming trailing spaces
 * @param {Object} record - Database record
 * @returns {Object} Cleaned record
 */
const cleanStringFields = (record) => {
  const cleaned = { ...record };
  
  // Iterate through all fields and trim string values
  Object.keys(cleaned).forEach(key => {
    if (typeof cleaned[key] === 'string') {
      cleaned[key] = cleaned[key].trim();
    }
  });
  
  return cleaned;
};

/**
 * Get daily stock data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Daily stock data
 */
const getDailyStockData = async (params) => {
  const {
    hcase = 'select_item_ds',
    p1 = '', p2 = '', p3 = ''
  } = params;

  logger.info('Executing page_Daily_Stock for daily stock data (No Cache)', { hcase });
  const result = await executeStoredProcedure('page_Daily_Stock', {
    hcase, p1, p2, p3
  });

  if (!Array.isArray(result)) {
    logger.warn('Unexpected response format from page_Daily_Stock:', result);
    return [];
  }

  // Clean string fields by trimming trailing spaces
  const cleanedResult = result.map(record => cleanStringFields(record));
  
  return cleanedResult;
};

/**
 * Get daily stock head data (สร้าง head)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Daily stock head data
 */
const getDailyStockHeadData = async (params = {}) => {
  const { p1 = '', p2 = '', p3 = '' } = params;

  logger.info('Executing page_Daily_Stock for head data (insertdatadailystock)', { hcase: 'insertdatadailystock' });
  const result = await executeStoredProcedure('page_Daily_Stock', {
    hcase: 'insertdatadailystock', p1, p2, p3
  });

  if (!Array.isArray(result)) {
    logger.warn('Unexpected response format from page_Daily_Stock head data:', result);
    return [];
  }

  // Clean string fields by trimming trailing spaces
  const cleanedResult = result.map(record => cleanStringFields(record));
  
  return cleanedResult;
};

/**
 * Get daily stock line data (สร้าง line)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Daily stock line data
 */
const getDailyStockLineData = async (params = {}) => {
  const { p1 = '', p2 = '', p3 = '' } = params;

  logger.info('Executing page_Daily_Stock for line data (insertdatas)', { hcase: 'insertdatas' });
  const result = await executeStoredProcedure('page_Daily_Stock', {
    hcase: 'insertdatas', p1, p2, p3
  });

  if (!Array.isArray(result)) {
    logger.warn('Unexpected response format from page_Daily_Stock line data:', result);
    return [];
  }

  // Clean string fields by trimming trailing spaces
  const cleanedResult = result.map(record => cleanStringFields(record));
  
  return cleanedResult;
};

module.exports = {
  getDailyStockData,
  getDailyStockHeadData,
  getDailyStockLineData
}; 