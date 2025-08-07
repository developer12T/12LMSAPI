const { exec } = require('../config/sequelize');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

/**
 * Get backlog data
 * @param {Object} params - Parameters object
 * @param {string} params.who - User identifier
 * @returns {Promise<Object>} Backlog data
 */
const getBacklogData = async (params) => {
  const { who = '' } = params;

  logger.info('Executing page_Backlog for backlog data', { who });

  try {
    const result = await exec('page_Backlog', {
      hcase: 'show_datamain',
      p1: who,
      p2: '', p3: '', p4: '', p5: '', p6: '', p7: '', p8: '', p9: '', p10: ''
    });

    logger.info('Backlog data result:', { 
      resultType: typeof result, 
      isArray: Array.isArray(result), 
      length: Array.isArray(result) ? result.length : 'N/A',
      who: who
    });

    return {
      success: true,
      data: result || [],
      who: who,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('Error in getBacklogData:', {
      error: error.message,
      stack: error.stack,
      params: { who }
    });
    
    return {
      success: false,
      error: error.message,
      data: [],
      who: who,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get backlog detail data (raw data only)
 * @param {Object} params - Parameters object
 * @param {string} params.who - User identifier
 * @param {string} params.provinceCode - Province code
 * @param {string} params.date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Backlog detail data
 */
const getBacklogDetail = async (params) => {
  const { who = '', provinceCode = '', date = '' } = params;

  logger.info('Executing page_Backlog for backlog detail data', { who, provinceCode, date });

  try {
    const result = await exec('page_Backlog', {
      hcase: 'show_po_detail',
      p1: who,
      p2: provinceCode,
      p3: date,
      p4: '', p5: '', p6: '', p7: '', p8: '', p9: '', p10: ''
    });

    logger.info('Backlog detail data result:', { 
      resultType: typeof result, 
      isArray: Array.isArray(result), 
      length: Array.isArray(result) ? result.length : 'N/A',
      who: who,
      provinceCode: provinceCode,
      date: date
    });

    return {
      success: true,
      data: result || [],
      who: who,
      provinceCode: provinceCode,
      date: date,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('Error in getBacklogDetail:', {
      error: error.message,
      stack: error.stack,
      params: { who, provinceCode, date }
    });
    
    return {
      success: false,
      error: error.message,
      data: [],
      who: who,
      provinceCode: provinceCode,
      date: date,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get backlog data (reorganized data only)
 * @param {Object} params - Parameters object
 * @param {string} params.who - User identifier
 * @returns {Promise<Object>} Reorganized backlog data
 */
const getBacklogDataReorganized = async (params) => {
  const { who = '' } = params;

  logger.info('Executing page_Backlog for reorganized backlog data', { who });

  try {
    const result = await exec('page_Backlog', {
      hcase: 'show_datamain',
      p1: who,
      p2: '', p3: '', p4: '', p5: '', p6: '', p7: '', p8: '', p9: '', p10: ''
    });

    logger.info('Backlog data result for reorganization:', { 
      resultType: typeof result, 
      isArray: Array.isArray(result), 
      length: Array.isArray(result) ? result.length : 'N/A',
      who: who
    });

    // จัดข้อมูลใหม่ตามโครงสร้างที่ต้องการ
    const reorganizedData = reorganizeBacklogData(result || []);

    return {
      success: true,
      who: who,
      data: reorganizedData, 
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('Error in getBacklogDataReorganized:', {
      error: error.message,
      stack: error.stack,
      params: { who }
    });
    
    return {
      success: false,
      error: error.message,
      reorganizedData: {
        provinceGroups: [],
        dateRangeTable: [],
        dateRange: {
          minDate: null,
          maxDate: null,
          allDates: []
        }
      },
      who: who,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Reorganize backlog data by province and customer
 * @param {Array} data - Raw backlog data
 * @returns {Object} Reorganized data with province groups and date range table
 */
const reorganizeBacklogData = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      provinceGroups: [],
      dateRangeTable: []
    };
  }

  // หาวันที่เก่าสุดและใหม่สุด
  const allDates = data
    .map(item => item.date_create)
    .filter(date => date)
    .sort();
  
  const minDate = allDates[0];
  const maxDate = allDates[allDates.length - 1];

  // สร้างรายการวันที่ทั้งหมด
  const dateRange = generateDateRange(minDate, maxDate);

  // จัดกลุ่มตามจังหวัด
  const provinceGroups = {};
  
  data.forEach(item => {
    const provinceKey = `${item.code_province || 'null'}_${item.name_province || 'null'}`;
    
    if (!provinceGroups[provinceKey]) {
      provinceGroups[provinceKey] = {
        code_province: item.code_province,
        name_province: item.name_province,
        listCustomer: {}
      };
    }

    // จัดกลุ่มตามลูกค้า
    const customerKey = `${item.cus_code || 'unknown'}_${item.cus_name || 'unknown'}`;
    
    if (!provinceGroups[provinceKey].listCustomer[customerKey]) {
      provinceGroups[provinceKey].listCustomer[customerKey] = {
        cus_code: item.cus_code,
        cus_name: item.cus_name,
        listDate: []
      };
    }

    // เพิ่มข้อมูลวันที่
    provinceGroups[provinceKey].listCustomer[customerKey].listDate.push({
      date_create: item.date_create,
      po: item.po
    });
  });

  // แปลงเป็น array และจัดเรียงข้อมูล
  const reorganizedProvinceGroups = Object.values(provinceGroups).map(province => ({
    code_province: province.code_province || '00',
    name_province: province.name_province || 'อื่นๆ',
    listCustomer: Object.values(province.listCustomer).map(customer => ({
      cus_code: customer.cus_code,
      cus_name: customer.cus_name,
      listDate: customer.listDate.sort((a, b) => new Date(a.date_create) - new Date(b.date_create))
    }))
  }));

  // สร้างตารางข้อมูลตามช่วงวันที่
  const dateRangeTable = createDateRangeTable(reorganizedProvinceGroups, dateRange);

  return {
    // provinceGroups: reorganizedProvinceGroups,
    dateRangeTable: dateRangeTable,
    dateRange: {
      minDate: minDate,
      maxDate: maxDate,
      allDates: dateRange
    }
  };
};

/**
 * Generate date range between min and max dates
 * @param {string} minDate - Minimum date
 * @param {string} maxDate - Maximum date
 * @returns {Array} Array of dates
 */
const generateDateRange = (minDate, maxDate) => {
  if (!minDate || !maxDate) return [];
  
  const dates = [];
  const currentDate = new Date(minDate);
  const endDate = new Date(maxDate);
  
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

/**
 * Create date range table with customer data
 * @param {Array} provinceGroups - Reorganized province groups
 * @param {Array} dateRange - Array of dates
 * @returns {Array} Date range table
 */
const createDateRangeTable = (provinceGroups, dateRange) => {
  const table = [];
  
  provinceGroups.forEach(province => {
    province.listCustomer.forEach(customer => {
      const customerRow = {
        code_province: province.code_province,
        name_province: province.name_province,
        cus_code: customer.cus_code,
        cus_name: customer.cus_name,
        dateData: {}
      };
      
      // สร้าง map ของข้อมูลวันที่
      const dateMap = {};
      customer.listDate.forEach(dateItem => {
        dateMap[dateItem.date_create] = dateItem.po;
      });
      
      // เพิ่มข้อมูลสำหรับแต่ละวัน
      dateRange.forEach(date => {
        customerRow.dateData[date] = dateMap[date] || '-';
      });
      
      table.push(customerRow);
    });
  });
  
  return table;
};

module.exports = {
  getBacklogData,
  getBacklogDetail,
  getBacklogDataReorganized
}; 