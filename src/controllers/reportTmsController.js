const { exec } = require('../config/sequelize');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

/**
 * Format number to 2 decimal places
 * @param {number|string} value - Value to format
 * @returns {string} Formatted number with 2 decimal places
 */
const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return '0.00';
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return '0.00';
  }
  
  return num.toFixed(2);
};

/**
 * Format specific numeric fields to 2 decimal places
 * @param {Object|Array} obj - Object or Array to format
 * @returns {Object|Array} Formatted object or array
 */
const formatNumericFields = (obj) => {
  if (!obj) {
    return obj;
  }

  // ถ้าเป็น array ให้ map แต่ละ item
  if (Array.isArray(obj)) {
    return obj.map(item => formatNumericFields(item));
  }

  // ถ้าไม่ใช่ object ให้ return ค่าเดิม
  if (typeof obj !== 'object') {
    return obj;
  }

  const formatted = {};
  for (const [key, value] of Object.entries(obj)) {
    // ตรวจสอบเฉพาะฟิลด์ที่ต้องการแปลง
    const numericFields = [
      'FG_AMOUNT', 'FORCOST', 'Cost_transport', 'SP_Cost', 'Total_cost',
      'COST', 'BPERCTN', 'helper_cost', 'ISPERCEN', 'EXTRA', 'palletcost'
    ];
    
    if (numericFields.includes(key) && (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value))))) {
      formatted[key] = formatNumber(value);
    } else if (Array.isArray(value)) {
      formatted[key] = value.map(item => formatNumericFields(item));
    } else if (typeof value === 'object' && value !== null) {
      formatted[key] = formatNumericFields(value);
    } else {
      formatted[key] = value;
    }
  }
  return formatted;
};

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

/**
 * Get no bill data
 */
const getNoBillData = async (params) => {
  const {
    hcase = 'getdata_nobill',
    warehouse = '',
    dateStart = '',
    dateEnd = ''
  } = params;

  logger.info('Executing page_nobill for no bill data', { hcase, warehouse, dateStart, dateEnd });

  try {
    const result = await exec('page_nobill', {
      hcase,
      p1: warehouse,
      p2: dateStart,
      p3: dateEnd
    });

    logger.info('No bill data result:', { 
      resultType: typeof result, 
      isArray: Array.isArray(result), 
      length: Array.isArray(result) ? result.length : 'N/A' 
    });

    return result;
  } catch (error) {
    logger.error('Error in getNoBillData:', {
      error: error.message,
      stack: error.stack,
      params: { hcase, warehouse, dateStart, dateEnd }
    });
    throw error;
  }
};

const getWharehouse = async (params) => {
  const {
    hcase = 'show_wh',
    p1 = '',
    p2 = '',
    p3 = ''
  } = params;

  logger.info('Executing page_nobill for no bill data', { hcase, p1, p2, p3 });

  return await exec('page_nobill', {
    hcase,
    p1: '',
    p2: '',
    p3: ''
  });
};

/**
 * Get no bill summary data
 */
const getNoBillSummaryData = async (params) => {
  const {
    hcase = 'getsummary_nobill',
    warehouse = '',
    dateStart = '',
    dateEnd = ''
  } = params;

  logger.info('Executing page_nobill for summary data', { hcase, warehouse, dateStart, dateEnd });

  return await exec('page_nobill', {
    hcase,
    p1: warehouse,
    p2: dateStart,
    p3: dateEnd
  });
};

/**
 * Get transport cost data (รวม 2 stored procedures)
 */
const getTransportCostDataOption = async (params) => {
  const {
    p1 = '', p2 = '', p3 = '', p4 = '', p5 = '', p6 = '', p7 = ''
  } = params;

  logger.info('Executing page_Rpt_TransCost for transport cost data', { p1, p2, p3, p4, p5, p6, p7 });

  try {
    // เรียก stored procedure แรก: ROUDCOS_PAY
    const roudcosPayData = await exec('page_Rpt_TransCost', {
      hcase: 'ROUDCOS_PAY',
      p1, p2, p3, p4, p5, p6, p7
    });

    // เรียก stored procedure ที่สอง: Code_truck
    const codeTruckData = await exec('page_Rpt_TransCost', {
      hcase: 'Code_truck',
      p1, p2, p3, p4, p5, p6, p7
    });

    // ส่งกลับข้อมูลแยกกัน
    return {
      roudcos_pay: roudcosPayData || [],
      code_truck: codeTruckData || []
    };
  } catch (error) {
    logger.error('Error executing transport cost stored procedures:', error);
    throw error;
  }
};

/**
 * Get transport cost show data
 */
const getTransportCostShowData = async (params) => {
  const {
    shipmentId = '', channelId = '', truckId = '', p4 = '', p5 = '', p6 = '', p7 = ''
  } = params;

  logger.info('Executing page_Rpt_TransCost for show data', { 
    shipmentId, channelId, truckId, p4, p5, p6, p7 
  });

  try {
    // เรียก stored procedure หลัก: show_data
    const showData = await exec('page_Rpt_TransCost', {
      hcase: 'show_data',
      p1: shipmentId,
      p2: channelId,
      p3: truckId,
      p4, p5, p6, p7
    });

    // เรียก stored procedure: show_truck
    const showTruckData = await exec('page_Rpt_TransCost', {
      hcase: 'show_truck',
      p1: shipmentId,
      p2: channelId,
      p3: truckId,
      p4, p5, p6, p7
    });

    // เรียก stored procedure: calpallet
    const calPalletData = await exec('page_Rpt_TransCost', {
      hcase: 'calpallet',
      p1: shipmentId,
      p2: channelId,
      p3: truckId,
      p4, p5, p6, p7
    });

    // จัดรูปแบบตัวเลขให้เป็นทศนิยม 2 จุด
    const formattedShowData = formatNumericFields(showData || []);
    const formattedShowTruckData = formatNumericFields(showTruckData || []);
    const formattedCalPalletData = formatNumericFields(calPalletData || []);

    // ส่งกลับข้อมูลแยกกัน
    return {
      show_data: formattedShowData,
      summaryDataObj: {
        show_truck: formattedShowTruckData,
        calpallet: formattedCalPalletData
      }
    };
  } catch (error) {
    logger.error('Error executing transport cost show data stored procedures:', error);
    throw error;
  }
};

module.exports = {
  getDailyStockData,
  getDailyStockHeadData,
  getDailyStockLineData,
  getNoBillData,
  getNoBillSummaryData,
  getWharehouse,
  getTransportCostDataOption,
  getTransportCostShowData
}; 