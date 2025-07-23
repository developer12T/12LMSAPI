const { exec } = require('../config/sequelize');
const { setupLogger } = require('../utils/logger');
const { 
  getPrdPlan, 
  getPrdPlanWithFormattedDates, 
  getPrdPlanMultipleWithFormattedDates, 
  getPrdPlanMultipleWithFormattedDatesBatch,
  extractPlanDatesList,
  extractFormattedPlanDatesList,
  groupPlanDates,
  groupFormattedPlanDates,
  getUniquePlanDates,
  getUniqueFormattedPlanDates,
  convertPrdPlanDataToObject,
  getAllUniqueDateFields,
  addDefaultDateFieldsToProducts,
  getProductsWithDefaultDateFields
} = require('../utils/getPrdPlan');

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

/**
 * Get planning all data
 */
const getPlanningAllData = async (params) => {
  const {
    hcase = 'show_data_pna',
    p1 = '', p2 = '', p3 = '', p4 = '', p5 = ''
  } = params;

  logger.info('Executing page_Planning_all for planning data', { hcase });

  try {
    const result = await exec('page_Planning_all', {
      hcase,
      p1, p2, p3, p4, p5
    });

    logger.info('Planning all data result:', { 
      resultType: typeof result, 
      isArray: Array.isArray(result), 
      length: Array.isArray(result) ? result.length : 'N/A' 
    });

    // รวบรวม item_codes ทั้งหมด
    const itemCodes = result
      .map(item => item.item_code ? item.item_code.trim() : '')
      .filter(itemCode => itemCode !== '');

    logger.info('Collected item codes for batch processing:', { 
      totalItems: result.length,
      validItemCodes: itemCodes.length 
    });

    let allPrdPlanData = [];

    if (itemCodes.length > 0) {
      try {
        // เรียก getPrdPlanMultipleWithFormattedDatesBatch เพื่อดึงข้อมูลแบบแบ่งชุด
        // ใช้ batch size ที่คำนวณอัตโนมัติเพื่อป้องกันปัญหา nvarchar(max) รับข้อมูลไม่ไหว
        allPrdPlanData = await getPrdPlanMultipleWithFormattedDatesBatch(itemCodes);
        
        logger.info('Successfully retrieved all prd plan data in batches:', { 
          itemCodesCount: itemCodes.length,
          prdPlanDataLength: Array.isArray(allPrdPlanData) ? allPrdPlanData.length : 'N/A',
          estimatedStringLength: itemCodes.length * 15 // ประมาณความยาวของ string ที่จะส่ง
        });

      } catch (prdError) {
        logger.error('Error calling getPrdPlanMultipleWithFormattedDatesBatch:', {
          itemCodes: itemCodes.join(','),
          error: prdError.message
        });
        allPrdPlanData = [];
      }
    }

    // เอาข้อมูลที่ได้จาก getPrdPlan ใส่เข้าไปในแต่ละ object
    const enrichedResult = result.map(item => {
      const itemCode = item.item_code ? item.item_code.trim() : '';
      
      if (!itemCode) {
        logger.warn('Skipping item with empty item_code', { item });
        return {
          ...item,
          prd_plan_data: {}
        };
      }

      // หาข้อมูลที่ตรงกับ item_code นี้
      const matchingPrdData = allPrdPlanData.filter(prdItem => 
        prdItem.product_id === itemCode || prdItem.item_code === itemCode
      );

      logger.info('Matched prd plan data for item:', { 
        itemCode, 
        matchedCount: matchingPrdData.length 
      });

      // แปลง prd_plan_data array เป็น object
      const prdPlanDataObject = convertPrdPlanDataToObject(matchingPrdData);

      return {
        ...item,
        ...prdPlanDataObject // กระจาย object เข้าไปใน item
      };
    });

    // ดึง unique date fields จากข้อมูลทั้งหมดเพื่อเพิ่ม default fields
    const allUniqueDateFields = getAllUniqueDateFields(allPrdPlanData);
    
    // เพิ่ม default date fields ให้กับทุก product ที่ไม่มีข้อมูล
    const finalResult = addDefaultDateFieldsToProducts(enrichedResult, allUniqueDateFields);

    logger.info('Added default date fields to all products:', {
      totalProducts: enrichedResult.length,
      finalProducts: finalResult.length,
      uniqueDateFields: allUniqueDateFields,
      dateFieldsCount: allUniqueDateFields.length
    });

    // ดึง plan_date ออกมาเป็น list แยกต่างหาก
    const planDatesList = extractPlanDatesList(allPrdPlanData);
    const formattedPlanDatesList = extractFormattedPlanDatesList(allPrdPlanData);

    // Get unique plan dates (remove duplicates)
    const uniquePlanDatesList = getUniquePlanDates(planDatesList);
    const uniqueFormattedPlanDatesList = getUniqueFormattedPlanDates(formattedPlanDatesList);

    // Group plan dates
    const groupedPlanDates = groupPlanDates(planDatesList);
    const groupedFormattedPlanDates = groupFormattedPlanDates(formattedPlanDatesList);

    logger.info('Planning all data enrichment completed', { 
      totalItems: result.length,
      enrichedItems: finalResult.length,
      planDatesCount: planDatesList.length,
      formattedPlanDatesCount: formattedPlanDatesList.length,
      uniquePlanDatesCount: uniquePlanDatesList.length,
      uniqueFormattedPlanDatesCount: uniqueFormattedPlanDatesList.length,
      groupedPlanDatesCount: Object.keys(groupedPlanDates).length,
      groupedFormattedPlanDatesCount: Object.keys(groupedFormattedPlanDates).length
    });

    return {
      data: finalResult,
      planDatesList: planDatesList,
      formattedPlanDatesList: formattedPlanDatesList,
      uniquePlanDatesList: uniquePlanDatesList,
      uniqueFormattedPlanDatesList: uniqueFormattedPlanDatesList,
      groupedPlanDates: groupedPlanDates,
      groupedFormattedPlanDates: groupedFormattedPlanDates
    };
  } catch (error) {
    logger.error('Error in getPlanningAllData:', {
      error: error.message,
      stack: error.stack,
      params: { hcase, p1, p2, p3, p4, p5 }
    });
    throw error;
  }
};

/**
 * Get planning all data with show_pna_dc case
 */
const getPlanningAllDataShowPnaDc = async (params) => {
  const {
    hcase = 'show_pna_dc',
    p1 = '',
    p2 = '',
    p3 = '',
    p4 = '',
    p5 = ''
  } = params;

  logger.info('Executing page_Planning_all with show_pna_dc case', { 
    hcase, p1, p2, p3, p4, p5 
  });

  try {
    const result = await exec('page_Planning_all', {
      hcase,
      p1,
      p2,
      p3,
      p4,
      p5
    });

    logger.info('Planning all data (show_pna_dc) result:', { 
      resultType: typeof result, 
      isArray: Array.isArray(result), 
      length: Array.isArray(result) ? result.length : 'N/A' 
    });

    // Add balance calculation to each item
    if (Array.isArray(result)) {
      const enrichedResult = result.map(item => {
        // Ensure numeric values for calculation
        // const tco = parseFloat(item.tco) || 0;
       
        const oco = parseFloat(item.oco) || 0;
        const pco = parseFloat(item.pco) || 0;
        const cco = parseFloat(item.cco) || 0;
        const stock = parseFloat(item.stock) || 0;
        const tco = oco + pco + cco

        // Calculate balance: tco - stock
        const balance = parseFloat(stock) - parseFloat(tco) ;

        // Verify tco calculation: tco = oco + pco + cco
        // const calculatedTco = oco + pco + cco;
        // const tcoMatches = Math.abs(tco - calculatedTco) < 0.01; // Allow for floating point precision

        logger.info('Processing item with balance calculation:', {
          item_no: item.item_no,
          tco: tco,
          oco: oco,
          pco: pco,
          cco: cco,
          stock: stock,
          balance: balance,
          // calculatedTco: calculatedTco,
          // tcoMatches: tcoMatches
        });

        return {
          ...item,
          tco: tco,
          oco: oco,
          balance: balance,
          // calculated_tco: calculatedTco,
          // tco_verification: tcoMatches
        };
      });

      logger.info('Successfully added balance calculations:', {
        totalItems: result.length,
        enrichedItems: enrichedResult.length
      });

      return enrichedResult;
    }

    return result;
  } catch (error) {
    logger.error('Error in getPlanningAllDataShowPnaDc:', {
      error: error.message,
      stack: error.stack,
      params: { hcase, p1, p2, p3, p4, p5 }
    });
    throw error;
  }
};

/**
 * Get product import plan data and enrich with stored procedure data
 */
const getProductImportPlanData = async (params) => {
  const { data = [] } = params;

  logger.info('Processing product import plan data', { 
    itemCount: data.length 
  });

  try {
    const enrichedData = [];

    // วนลูปผ่านแต่ละ item ในข้อมูล
    for (const item of data) {
      const itemCode = item.item_code ? item.item_code.trim() : '';
      
      if (!itemCode) {
        logger.warn('Skipping item with empty item_code', { item });
        enrichedData.push(item);
        continue;
      }

      logger.info('Processing item:', { itemCode });

      try {
        // เรียก stored procedure page_Import_Prd_plan
        const storedProcResult = await exec('page_Import_Prd_plan', {
          hcase: 'SELECT_PRD',
          p1: itemCode,
          p2: '', p3: '', p4: '', p5: '', p6: '', p7: '', p8: '', p9: '', p10: ''
        });

        // รวมข้อมูลเดิมกับข้อมูลจาก stored procedure
        const enrichedItem = {
          ...item,
          stored_proc_data: storedProcResult || []
        };

        enrichedData.push(enrichedItem);

        logger.info('Successfully enriched item data', { 
          itemCode, 
          storedProcDataLength: Array.isArray(storedProcResult) ? storedProcResult.length : 'N/A' 
        });

      } catch (procError) {
        logger.error('Error calling stored procedure for item:', {
          itemCode,
          error: procError.message
        });

        // ถ้าเกิด error ให้เก็บข้อมูลเดิมไว้
        enrichedData.push({
          ...item,
          stored_proc_data: [],
          error: procError.message
        });
      }
    }

    logger.info('Product import plan data processing completed', { 
      totalItems: data.length,
      processedItems: enrichedData.length 
    });

    return enrichedData;

  } catch (error) {
    logger.error('Error in getProductImportPlanData:', {
      error: error.message,
      stack: error.stack,
      params: { dataLength: data.length }
    });
    throw error;
  }
};

module.exports = {
  getDailyStockData,
  getDailyStockHeadData,
  getDailyStockLineData,
  getNoBillData,
  getWharehouse,
  getTransportCostDataOption,
  getTransportCostShowData,
  getPlanningAllData,
  getPlanningAllDataShowPnaDc,
  getProductImportPlanData
}; 