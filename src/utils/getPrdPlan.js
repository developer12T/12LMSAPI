const { exec } = require('../config/sequelize');
const { setupLogger } = require('./logger');

const logger = setupLogger();

/**
 * Convert plan_date from "13072025" format to "13-jul" format
 * @param {string} planDate - Plan date in format "DDMMYYYY"
 * @returns {string} Formatted date in "DD-MMM" format
 */
const formatPlanDate = (planDate) => {
  try {
    if (!planDate || typeof planDate !== 'string') {
      return '';
    }

    const trimmedDate = planDate.trim();
    
    // ตรวจสอบว่าเป็นรูปแบบ DDMMYYYY (8 ตัวอักษร)
    if (trimmedDate.length !== 8) {
      logger.warn('formatPlanDate: Invalid date format, expected DDMMYYYY:', { planDate });
      return '';
    }

    // แยกวัน เดือน ปี
    const day = trimmedDate.substring(0, 2);
    const month = trimmedDate.substring(2, 4);
    const year = trimmedDate.substring(4, 8);

    // ตรวจสอบความถูกต้องของวัน เดือน
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);

    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
      logger.warn('formatPlanDate: Invalid day or month:', { planDate, day, month });
      return '';
    }

    // แปลงเดือนเป็นตัวอักษรภาษาอังกฤษ
    const monthNames = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ];

    const monthName = monthNames[monthNum - 1];
    
    // สร้างรูปแบบ "DD-MMM"
    const formattedDate = `${day}-${monthName}`;

    logger.info('formatPlanDate: Successfully formatted date:', { 
      original: planDate, 
      formatted: formattedDate 
    });

    return formattedDate;
  } catch (error) {
    logger.error('formatPlanDate: Error formatting date:', {
      planDate,
      error: error.message
    });
    return '';
  }
};

/**
 * Get product data by calling page_Import_Prd_plan with SELECT_PRD
 * Function สำหรับใช้ภายใน
 * @param {string} product_id - Product ID to search for
 * @returns {Promise<Array>} Product data from stored procedure
 */
const getPrdPlan = async (product_id) => {
  if (!product_id) {
    logger.warn('getPrdPlan: product_id is empty or undefined');
    return [];
  }

  logger.info('getPrdPlan: Executing page_Import_Prd_plan with SELECT_PRD:', { product_id });

  try {
    const result = await exec('page_Import_Prd_plan', {
      hcase: 'SELECT_PRD',
      p1: product_id,
      p2: '', p3: '', p4: '', p5: '', p6: '', p7: '', p8: '', p9: '', p10: ''
    });

    logger.info('getPrdPlan: Product data retrieved successfully:', { 
      product_id,
      resultType: typeof result, 
      isArray: Array.isArray(result), 
      length: Array.isArray(result) ? result.length : 'N/A' 
    });

    return result || [];
  } catch (error) {
    logger.error('getPrdPlan: Error retrieving product data:', {
      error: error.message,
      stack: error.stack,
      product_id
    });
    throw error;
  }
};

/**
 * Get multiple products data by calling page_Import_Prd_plan with SELECT_PRD (single call)
 * Function สำหรับใช้ภายในเพื่อดึงข้อมูลหลาย products ในครั้งเดียว
 * @param {Array<string>} product_ids - Array of Product IDs to search for
 * @returns {Promise<Array>} Product data from stored procedure
 */
const getPrdPlanMultiple = async (product_ids) => {
  if (!Array.isArray(product_ids) || product_ids.length === 0) {
    logger.warn('getPrdPlanMultiple: product_ids is empty or not an array');
    return [];
  }

  // รวม product IDs เป็น string คั่นด้วย comma
  const productIdsString = product_ids.join(',');
  
  // ตรวจสอบความยาวของ string
  const stringLength = productIdsString.length;
  const maxSafeLength = 8000; // ความยาวที่ปลอดภัยสำหรับ nvarchar(max)
  
  if (stringLength > maxSafeLength) {
    logger.warn('getPrdPlanMultiple: String length exceeds safe limit:', {
      stringLength: stringLength,
      maxSafeLength: maxSafeLength,
      productCount: product_ids.length
    });
  }
  
  logger.info('getPrdPlanMultiple: Executing page_Import_Prd_plan with SELECT_PRD:', { 
    productIds: productIdsString,
    productCount: product_ids.length,
    stringLength: stringLength,
    maxSafeLength: maxSafeLength
  });

  try {
    const result = await exec('page_Import_Prd_plan', {
      hcase: 'SELECT_PRD',
      p1: productIdsString,
      p2: '', p3: '', p4: '', p5: '', p6: '', p7: '', p8: '', p9: '', p10: ''
    });

    logger.info('getPrdPlanMultiple: Product data retrieved successfully:', { 
      productIds: productIdsString,
      resultType: typeof result, 
      isArray: Array.isArray(result), 
      length: Array.isArray(result) ? result.length : 'N/A',
      stringLength: stringLength
    });

    return result || [];
  } catch (error) {
    logger.error('getPrdPlanMultiple: Error retrieving product data:', {
      error: error.message,
      stack: error.stack,
      productIds: productIdsString,
      stringLength: stringLength
    });
    throw error;
  }
};

/**
 * Get product data by calling page_Import_Prd_plan with SELECT_PRD (with error handling)
 * Function สำหรับใช้ภายในที่มี error handling
 * @param {string} product_id - Product ID to search for
 * @returns {Promise<Array>} Product data from stored procedure or empty array on error
 */
const getPrdPlanSafe = async (product_id) => {
  try {
    return await getPrdPlan(product_id);
  } catch (error) {
    logger.error('getPrdPlanSafe: Error occurred, returning empty array:', {
      product_id,
      error: error.message
    });
    return [];
  }
};

/**
 * Get multiple products data by calling page_Import_Prd_plan for each product
 * Function สำหรับใช้ภายในเพื่อดึงข้อมูลหลาย products
 * @param {Array<string>} product_ids - Array of Product IDs to search for
 * @returns {Promise<Object>} Object with product_id as key and data as value
 */
const getMultiplePrdPlan = async (product_ids) => {
  if (!Array.isArray(product_ids) || product_ids.length === 0) {
    logger.warn('getMultiplePrdPlan: product_ids is empty or not an array');
    return {};
  }

  logger.info('getMultiplePrdPlan: Processing multiple products:', { 
    productCount: product_ids.length 
  });

  const results = {};

  for (const product_id of product_ids) {
    try {
      const data = await getPrdPlan(product_id);
      results[product_id] = data;
      
      logger.info('getMultiplePrdPlan: Successfully processed product:', { 
        product_id, 
        dataLength: Array.isArray(data) ? data.length : 'N/A' 
      });
    } catch (error) {
      logger.error('getMultiplePrdPlan: Error processing product:', {
        product_id,
        error: error.message
      });
      results[product_id] = [];
    }
  }

  logger.info('getMultiplePrdPlan: Completed processing all products:', {
    totalProducts: product_ids.length,
    successfulProducts: Object.keys(results).length
  });

  return results;
};

/**
 * Get product data and enrich with additional information
 * Function สำหรับใช้ภายในเพื่อดึงข้อมูลและเพิ่มข้อมูลเสริม
 * @param {string} product_id - Product ID to search for
 * @param {Object} additionalData - Additional data to merge with result
 * @returns {Promise<Object>} Enriched product data
 */
const getPrdPlanWithEnrichment = async (product_id, additionalData = {}) => {
  try {
    const productData = await getPrdPlan(product_id);
    
    const enrichedData = {
      product_id,
      stored_proc_data: productData || [],
      additional_data: additionalData,
      retrieved_at: new Date().toISOString()
    };

    logger.info('getPrdPlanWithEnrichment: Successfully enriched product data:', {
      product_id,
      dataLength: Array.isArray(productData) ? productData.length : 'N/A'
    });

    return enrichedData;
  } catch (error) {
    logger.error('getPrdPlanWithEnrichment: Error enriching product data:', {
      product_id,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get product data with formatted plan dates
 * Function สำหรับใช้ภายในเพื่อดึงข้อมูลและแปลง plan_date
 * @param {string} product_id - Product ID to search for
 * @returns {Promise<Array>} Product data with formatted plan dates
 */
const getPrdPlanWithFormattedDates = async (product_id) => {
  try {
    const productData = await getPrdPlan(product_id);
    
    if (!Array.isArray(productData)) {
      return [];
    }

    // แปลง plan_date ในแต่ละ record
    const formattedData = productData.map(record => {
      if (record.plan_date) {
        return {
          ...record,
          plan_date: formatPlanDate(record.plan_date),
          original_plan_date: record.plan_date // เก็บค่าเดิมไว้
        };
      }
      return record;
    });

    logger.info('getPrdPlanWithFormattedDates: Successfully formatted plan dates:', {
      product_id,
      dataLength: formattedData.length,
      formattedCount: formattedData.filter(record => record.plan_date !== '').length
    });

    return formattedData;
  } catch (error) {
    logger.error('getPrdPlanWithFormattedDates: Error formatting plan dates:', {
      product_id,
      error: error.message
    });
    throw error;
  }
};

/**
 * Convert prd plan data array to object with plan_date as key and plat_count as value
 * Function สำหรับใช้ภายในเพื่อแปลง prd_plan_data array เป็น object
 * @param {Array} prdPlanData - Array of prd plan data
 * @returns {Object} Object with plan_date as key and plat_count as value
 */
const convertPrdPlanDataToObject = (prdPlanData) => {
  try {
    if (!Array.isArray(prdPlanData)) {
      logger.warn('convertPrdPlanDataToObject: prdPlanData is not an array');
      return {};
    }

    // แปลง array เป็น object โดยใช้ plan_date เป็น key และ plat_count เป็น value
    const planDataObject = prdPlanData.reduce((obj, record) => {
      if (record.plan_date && record.plan_date.trim() !== '') {
        obj[record.plan_date] = record.plat_count || '0';
      }
      return obj;
    }, {});

    logger.info('convertPrdPlanDataToObject: Successfully converted prd plan data to object:', {
      totalRecords: prdPlanData.length,
      uniquePlanDates: Object.keys(planDataObject).length,
      planDataObject: planDataObject
    });

    return planDataObject;
  } catch (error) {
    logger.error('convertPrdPlanDataToObject: Error converting prd plan data to object:', {
      error: error.message
    });
    return {};
  }
};

/**
 * Get plan dates list from product data
 * Function สำหรับใช้ภายในเพื่อดึงเฉพาะ plan_date ออกมาเป็น list
 * @param {Array} productData - Product data array
 * @returns {Array} List of plan dates
 */
const extractPlanDatesList = (productData) => {
  try {
    if (!Array.isArray(productData)) {
      logger.warn('extractPlanDatesList: productData is not an array');
      return [];
    }

    // ดึง plan_date จากแต่ละ record
    const planDatesList = productData
      .filter(record => record.plan_date && record.plan_date.trim() !== '')
      .map(record => record.plan_date);

    logger.info('extractPlanDatesList: Successfully extracted plan dates:', {
      totalRecords: productData.length,
      planDatesCount: planDatesList.length,
      planDatesList: planDatesList
    });

    return planDatesList;
  } catch (error) {
    logger.error('extractPlanDatesList: Error extracting plan dates:', {
      error: error.message
    });
    return [];
  }
};

/**
 * Get formatted plan dates list from product data
 * Function สำหรับใช้ภายในเพื่อดึง plan_date และแปลงเป็นรูปแบบ "DD-MMM"
 * @param {Array} productData - Product data array
 * @returns {Array} List of formatted plan dates
 */
const extractFormattedPlanDatesList = (productData) => {
  try {
    if (!Array.isArray(productData)) {
      logger.warn('extractFormattedPlanDatesList: productData is not an array');
      return [];
    }

    // ดึงและแปลง plan_date จากแต่ละ record
    const formattedPlanDatesList = productData
      .filter(record => record.plan_date && record.plan_date.trim() !== '')
      .map(record => formatPlanDate(record.plan_date))
      .filter(formattedDate => formattedDate !== ''); // กรองวันที่ที่แปลงไม่ได้

    logger.info('extractFormattedPlanDatesList: Successfully extracted formatted plan dates:', {
      totalRecords: productData.length,
      formattedPlanDatesCount: formattedPlanDatesList.length,
      formattedPlanDatesList: formattedPlanDatesList
    });

    return formattedPlanDatesList;
  } catch (error) {
    logger.error('extractFormattedPlanDatesList: Error extracting formatted plan dates:', {
      error: error.message
    });
    return [];
  }
};

/**
 * Group plan dates by date
 * Function สำหรับใช้ภายในเพื่อ group plan dates ตามวันที่
 * @param {Array} planDatesList - List of plan dates
 * @returns {Object} Grouped plan dates with count
 */
const groupPlanDates = (planDatesList) => {
  try {
    if (!Array.isArray(planDatesList)) {
      logger.warn('groupPlanDates: planDatesList is not an array');
      return {};
    }

    // Group plan dates และนับจำนวน
    const groupedPlanDates = planDatesList.reduce((groups, date) => {
      if (date && date.trim() !== '') {
        groups[date] = (groups[date] || 0) + 1;
      }
      return groups;
    }, {});

    logger.info('groupPlanDates: Successfully grouped plan dates:', {
      totalDates: planDatesList.length,
      uniqueDates: Object.keys(groupedPlanDates).length,
      groupedPlanDates: groupedPlanDates
    });

    return groupedPlanDates;
  } catch (error) {
    logger.error('groupPlanDates: Error grouping plan dates:', {
      error: error.message
    });
    return {};
  }
};

/**
 * Group formatted plan dates by date
 * Function สำหรับใช้ภายในเพื่อ group formatted plan dates ตามวันที่
 * @param {Array} formattedPlanDatesList - List of formatted plan dates
 * @returns {Object} Grouped formatted plan dates with count
 */
const groupFormattedPlanDates = (formattedPlanDatesList) => {
  try {
    if (!Array.isArray(formattedPlanDatesList)) {
      logger.warn('groupFormattedPlanDates: formattedPlanDatesList is not an array');
      return {};
    }

    // Group formatted plan dates และนับจำนวน
    const groupedFormattedPlanDates = formattedPlanDatesList.reduce((groups, date) => {
      if (date && date.trim() !== '') {
        groups[date] = (groups[date] || 0) + 1;
      }
      return groups;
    }, {});

    logger.info('groupFormattedPlanDates: Successfully grouped formatted plan dates:', {
      totalDates: formattedPlanDatesList.length,
      uniqueDates: Object.keys(groupedFormattedPlanDates).length,
      groupedFormattedPlanDates: groupedFormattedPlanDates
    });

    return groupedFormattedPlanDates;
  } catch (error) {
    logger.error('groupFormattedPlanDates: Error grouping formatted plan dates:', {
      error: error.message
    });
    return {};
  }
};

/**
 * Get unique plan dates (remove duplicates)
 * Function สำหรับใช้ภายในเพื่อดึง unique plan dates โดยตัดตัวซ้ำออก
 * @param {Array} planDatesList - List of plan dates
 * @returns {Array} Unique plan dates list
 */
const getUniquePlanDates = (planDatesList) => {
  try {
    if (!Array.isArray(planDatesList)) {
      logger.warn('getUniquePlanDates: planDatesList is not an array');
      return [];
    }

    // ใช้ Set เพื่อตัดตัวซ้ำออก
    const uniquePlanDates = [...new Set(planDatesList.filter(date => date && date.trim() !== ''))];

    logger.info('getUniquePlanDates: Successfully extracted unique plan dates:', {
      totalDates: planDatesList.length,
      uniqueDates: uniquePlanDates.length,
      uniquePlanDates: uniquePlanDates
    });

    return uniquePlanDates;
  } catch (error) {
    logger.error('getUniquePlanDates: Error extracting unique plan dates:', {
      error: error.message
    });
    return [];
  }
};

/**
 * Get unique formatted plan dates (remove duplicates)
 * Function สำหรับใช้ภายในเพื่อดึง unique formatted plan dates โดยตัดตัวซ้ำออก
 * @param {Array} formattedPlanDatesList - List of formatted plan dates
 * @returns {Array} Unique formatted plan dates list
 */
const getUniqueFormattedPlanDates = (formattedPlanDatesList) => {
  try {
    if (!Array.isArray(formattedPlanDatesList)) {
      logger.warn('getUniqueFormattedPlanDates: formattedPlanDatesList is not an array');
      return [];
    }

    // ใช้ Set เพื่อตัดตัวซ้ำออก
    const uniqueFormattedPlanDates = [...new Set(formattedPlanDatesList.filter(date => date && date.trim() !== ''))];

    logger.info('getUniqueFormattedPlanDates: Successfully extracted unique formatted plan dates:', {
      totalDates: formattedPlanDatesList.length,
      uniqueDates: uniqueFormattedPlanDates.length,
      uniqueFormattedPlanDates: uniqueFormattedPlanDates
    });

    return uniqueFormattedPlanDates;
  } catch (error) {
    logger.error('getUniqueFormattedPlanDates: Error extracting unique formatted plan dates:', {
      error: error.message
    });
    return [];
  }
};

/**
 * Get multiple products data with formatted plan dates (single call)
 * Function สำหรับใช้ภายในเพื่อดึงข้อมูลหลาย products และแปลง plan_date ในครั้งเดียว
 * @param {Array<string>} product_ids - Array of Product IDs to search for
 * @returns {Promise<Array>} Product data with formatted plan dates
 */
const getPrdPlanMultipleWithFormattedDates = async (product_ids) => {
  try {
    const productData = await getPrdPlanMultiple(product_ids);
    
    if (!Array.isArray(productData)) {
      return [];
    }

    // แปลง plan_date ในแต่ละ record
    const formattedData = productData.map(record => {
      if (record.plan_date) {
        return {
          ...record,
          plan_date: formatPlanDate(record.plan_date),
          original_plan_date: record.plan_date // เก็บค่าเดิมไว้
        };
      }
      return record;
    });

    logger.info('getPrdPlanMultipleWithFormattedDates: Successfully formatted plan dates:', {
      productIds: product_ids.join(','),
      dataLength: formattedData.length,
      formattedCount: formattedData.filter(record => record.plan_date !== '').length
    });

    return formattedData;
  } catch (error) {
    logger.error('getPrdPlanMultipleWithFormattedDates: Error formatting plan dates:', {
      productIds: product_ids.join(','),
      error: error.message
    });
    throw error;
  }
};

/**
 * Calculate optimal batch size based on string length
 * @param {Array<string>} product_ids - Array of Product IDs
 * @param {number} maxSafeLength - Maximum safe string length (default: 8000)
 * @returns {number} Optimal batch size
 */
const calculateOptimalBatchSize = (product_ids, maxSafeLength = 8000) => {
  if (!Array.isArray(product_ids) || product_ids.length === 0) {
    return 10; // default size
  }

  // คำนวณความยาวเฉลี่ยของ product ID + comma
  const avgProductIdLength = product_ids.reduce((sum, id) => sum + id.length, 0) / product_ids.length;
  const avgLengthWithComma = avgProductIdLength + 1; // +1 for comma

  // คำนวณจำนวน items ที่ปลอดภัย
  const safeItemCount = Math.floor(maxSafeLength / avgLengthWithComma);
  
  // ใช้ค่าที่น้อยกว่ากันระหว่าง safeItemCount และ 10
  const optimalSize = Math.min(safeItemCount, 10);
  
  logger.info('calculateOptimalBatchSize: Calculated optimal batch size:', {
    totalProducts: product_ids.length,
    avgProductIdLength: avgProductIdLength.toFixed(2),
    avgLengthWithComma: avgLengthWithComma.toFixed(2),
    maxSafeLength: maxSafeLength,
    safeItemCount: safeItemCount,
    optimalSize: optimalSize
  });

  return Math.max(optimalSize, 1); // อย่างน้อยต้องมี 1 item
};

/**
 * Get multiple products data with formatted plan dates (batch processing)
 * Function สำหรับใช้ภายในเพื่อดึงข้อมูลหลาย products แบบแบ่งชุด
 * @param {Array<string>} product_ids - Array of Product IDs to search for
 * @param {number} batchSize - Size of each batch (default: auto-calculated)
 * @returns {Promise<Array>} Product data with formatted plan dates
 */
const getPrdPlanMultipleWithFormattedDatesBatch = async (product_ids, batchSize = null) => {
  try {
    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      logger.warn('getPrdPlanMultipleWithFormattedDatesBatch: product_ids is empty or not an array');
      return [];
    }

    // คำนวณ batch size ที่เหมาะสมถ้าไม่ได้ระบุ
    const actualBatchSize = batchSize || calculateOptimalBatchSize(product_ids);
    
    logger.info('getPrdPlanMultipleWithFormattedDatesBatch: Starting batch processing:', {
      totalProducts: product_ids.length,
      batchSize: actualBatchSize,
      totalBatches: Math.ceil(product_ids.length / actualBatchSize)
    });

    const allFormattedData = [];
    const totalBatches = Math.ceil(product_ids.length / actualBatchSize);

    // แบ่ง product_ids เป็นชุดๆ
    for (let i = 0; i < product_ids.length; i += actualBatchSize) {
      const batch = product_ids.slice(i, i + actualBatchSize);
      const batchNumber = Math.floor(i / actualBatchSize) + 1;
      
      logger.info(`getPrdPlanMultipleWithFormattedDatesBatch: Processing batch ${batchNumber}/${totalBatches}:`, {
        batchNumber: batchNumber,
        batchSize: batch.length,
        productIds: batch.join(',')
      });

      try {
        // เรียก getPrdPlanMultipleWithFormattedDates สำหรับชุดนี้
        const batchData = await getPrdPlanMultipleWithFormattedDates(batch);
        
        // เพิ่มข้อมูลจากชุดนี้เข้าไปในผลลัพธ์ทั้งหมด
        allFormattedData.push(...batchData);
        
        logger.info(`getPrdPlanMultipleWithFormattedDatesBatch: Completed batch ${batchNumber}/${totalBatches}:`, {
          batchNumber: batchNumber,
          batchDataLength: batchData.length,
          totalDataLength: allFormattedData.length
        });

      } catch (batchError) {
        logger.error(`getPrdPlanMultipleWithFormattedDatesBatch: Error in batch ${batchNumber}/${totalBatches}:`, {
          batchNumber: batchNumber,
          productIds: batch.join(','),
          error: batchError.message
        });
        
        // ถ้าเกิด error ในชุดนี้ ให้ข้ามไปชุดถัดไป
        // ไม่ throw error เพื่อให้ประมวลผลชุดอื่นต่อได้
      }
    }

    logger.info('getPrdPlanMultipleWithFormattedDatesBatch: Completed all batches:', {
      totalProducts: product_ids.length,
      totalBatches: totalBatches,
      totalDataLength: allFormattedData.length
    });

    return allFormattedData;
  } catch (error) {
    logger.error('getPrdPlanMultipleWithFormattedDatesBatch: Error in batch processing:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Get all unique date fields from product data
 * Function สำหรับใช้ภายในเพื่อดึง unique date fields ทั้งหมดจากข้อมูล
 * @param {Array} productData - Product data array
 * @returns {Array} List of unique date fields
 */
const getAllUniqueDateFields = (productData) => {
  try {
    if (!Array.isArray(productData)) {
      logger.warn('getAllUniqueDateFields: productData is not an array');
      return [];
    }

    const dateFields = new Set();

    // วนลูปผ่านทุก record เพื่อดึง date fields
    productData.forEach(record => {
      Object.keys(record).forEach(key => {
        // ตรวจสอบว่าเป็น date field หรือไม่ (รูปแบบ "DD-MMM")
        if (key.match(/^\d{1,2}-[a-z]{3}$/i)) {
          dateFields.add(key);
        }
      });
    });

    const uniqueDateFields = Array.from(dateFields).sort();

    logger.info('getAllUniqueDateFields: Successfully extracted unique date fields:', {
      totalRecords: productData.length,
      uniqueDateFieldsCount: uniqueDateFields.length,
      uniqueDateFields: uniqueDateFields
    });

    return uniqueDateFields;
  } catch (error) {
    logger.error('getAllUniqueDateFields: Error extracting unique date fields:', {
      error: error.message
    });
    return [];
  }
};

/**
 * Add default date fields to all products
 * Function สำหรับใช้ภายในเพื่อเพิ่ม default date fields ให้กับทุก product
 * @param {Array} products - Array of products
 * @param {Array} dateFields - Array of date fields to add (optional, will auto-detect if not provided)
 * @returns {Array} Products with default date fields added
 */
const addDefaultDateFieldsToProducts = (products, dateFields = null) => {
  try {
    if (!Array.isArray(products)) {
      logger.warn('addDefaultDateFieldsToProducts: products is not an array');
      return [];
    }

    // ถ้าไม่ได้ระบุ dateFields ให้ดึงจากข้อมูลที่มีอยู่
    let allDateFields = dateFields;
    if (!allDateFields || allDateFields.length === 0) {
      // สร้าง array เปล่าเพื่อรวบรวม date fields จากทุก product
      const tempProductData = [];
      products.forEach(product => {
        // ตรวจสอบว่ามี prd_plan_data หรือไม่
        if (product.prd_plan_data && Array.isArray(product.prd_plan_data)) {
          tempProductData.push(...product.prd_plan_data);
        }
        // ตรวจสอบ date fields ที่มีอยู่แล้วใน product
        Object.keys(product).forEach(key => {
          if (key.match(/^\d{1,2}-[a-z]{3}$/i)) {
            tempProductData.push({ [key]: '0' });
          }
        });
      });
      allDateFields = getAllUniqueDateFields(tempProductData);
    }

    logger.info('addDefaultDateFieldsToProducts: Processing products with date fields:', {
      totalProducts: products.length,
      dateFieldsCount: allDateFields.length,
      dateFields: allDateFields
    });

    // เพิ่ม default date fields ให้กับทุก product
    const enrichedProducts = products.map(product => {
      const enrichedProduct = { ...product };

      // เพิ่ม default date fields ที่มีค่า "0"
      allDateFields.forEach(dateField => {
        if (!(dateField in enrichedProduct)) {
          enrichedProduct[dateField] = "0";
        }
      });

      return enrichedProduct;
    });

    logger.info('addDefaultDateFieldsToProducts: Successfully added default date fields:', {
      totalProducts: products.length,
      enrichedProducts: enrichedProducts.length,
      dateFieldsAdded: allDateFields.length
    });

    return enrichedProducts;
  } catch (error) {
    logger.error('addDefaultDateFieldsToProducts: Error adding default date fields:', {
      error: error.message
    });
    return products; // return original products if error occurs
  }
};

/**
 * Get products with default date fields from stored procedure data
 * Function สำหรับใช้ภายในเพื่อดึงข้อมูล products และเพิ่ม default date fields
 * @param {Array<string>} product_ids - Array of Product IDs to search for
 * @returns {Promise<Array>} Products with default date fields
 */
const getProductsWithDefaultDateFields = async (product_ids) => {
  try {
    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      logger.warn('getProductsWithDefaultDateFields: product_ids is empty or not an array');
      return [];
    }

    // ดึงข้อมูลจาก stored procedure
    const prdPlanData = await getPrdPlanMultipleWithFormattedDatesBatch(product_ids);
    
    // ดึง unique date fields จากข้อมูล
    const uniqueDateFields = getAllUniqueDateFields(prdPlanData);

    logger.info('getProductsWithDefaultDateFields: Retrieved data and date fields:', {
      productIds: product_ids.join(','),
      prdPlanDataLength: prdPlanData.length,
      uniqueDateFieldsCount: uniqueDateFields.length,
      uniqueDateFields: uniqueDateFields
    });

    // สร้าง products array จากข้อมูลที่มีอยู่
    const products = [];
    const processedItemCodes = new Set();

    // วนลูปผ่านข้อมูลจาก stored procedure เพื่อสร้าง products
    prdPlanData.forEach(record => {
      const itemCode = record.product_id || record.item_code;
      if (itemCode && !processedItemCodes.has(itemCode)) {
        processedItemCodes.add(itemCode);
        
        // สร้าง product object พื้นฐาน
        const product = {
          item_code: itemCode,
          item_name: record.item_name || '',
          blfplus: record.blfplus || null,
          bl12t: record.bl12t || null,
          wh_111: record.wh_111 || null,
          wh_109: record.wh_109 || null,
          wh_106: record.wh_106 || null,
          wh_105: record.wh_105 || null,
          wh_104: record.wh_104 || null,
          wh_103: record.wh_103 || null,
          wh_102: record.wh_102 || null,
          wh_101: record.wh_101 || null
        };

        // เพิ่ม date fields ที่มีข้อมูล
        uniqueDateFields.forEach(dateField => {
          product[dateField] = "0"; // default value
        });

        products.push(product);
      }
    });

    // เพิ่ม products ที่ไม่มีข้อมูลใน stored procedure แต่มีใน product_ids
    product_ids.forEach(productId => {
      if (!processedItemCodes.has(productId)) {
        const product = {
          item_code: productId,
          item_name: '',
          blfplus: null,
          bl12t: null,
          wh_111: null,
          wh_109: null,
          wh_106: null,
          wh_105: null,
          wh_104: null,
          wh_103: null,
          wh_102: null,
          wh_101: null
        };

        // เพิ่ม default date fields
        uniqueDateFields.forEach(dateField => {
          product[dateField] = "0";
        });

        products.push(product);
      }
    });

    logger.info('getProductsWithDefaultDateFields: Successfully created products with default date fields:', {
      totalProducts: products.length,
      uniqueDateFieldsCount: uniqueDateFields.length,
      processedItemCodes: processedItemCodes.size
    });

    return products;
  } catch (error) {
    logger.error('getProductsWithDefaultDateFields: Error creating products with default date fields:', {
      productIds: product_ids.join(','),
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  getPrdPlan,
  getPrdPlanSafe,
  getMultiplePrdPlan,
  getPrdPlanMultiple,
  getPrdPlanWithEnrichment,
  getPrdPlanWithFormattedDates,
  getPrdPlanMultipleWithFormattedDates,
  getPrdPlanMultipleWithFormattedDatesBatch,
  calculateOptimalBatchSize,
  extractPlanDatesList,
  extractFormattedPlanDatesList,
  groupPlanDates,
  groupFormattedPlanDates,
  getUniquePlanDates,
  getUniqueFormattedPlanDates,
  convertPrdPlanDataToObject,
  formatPlanDate,
  getAllUniqueDateFields,
  addDefaultDateFieldsToProducts,
  getProductsWithDefaultDateFields
}; 