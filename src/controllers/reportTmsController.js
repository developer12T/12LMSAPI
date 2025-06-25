const { exec } = require('../config/sequelize');
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
 * Get daily stock data
 */
const getDailyStockData = async (params) => {
  const {
    hcase = 'select_item_ds',
    p1 = '', p2 = '', p3 = ''
  } = params;

  return await exec('page_Daily_Stock', {
    hcase, p1, p2, p3
  });
};

/**
 * Get daily stock head data (สร้าง head)
 */
const getDailyStockHeadData = async (params = {}) => {
  const { p1 = '', p2 = '', p3 = '' } = params;

  return await exec('page_Daily_Stock', {
    hcase: 'insertdatadailystock', p1, p2, p3
  });
};

/**
 * Get daily stock line data (สร้าง line)
 */
const getDailyStockLineData = async (params = {}) => {
  const { p1 = '', p2 = '', p3 = '' } = params;

  return await exec('page_Daily_Stock', {
    hcase: 'insertdatas', p1, p2, p3
  });
};

module.exports = {
  getDailyStockData,
  getDailyStockHeadData,
  getDailyStockLineData
}; 