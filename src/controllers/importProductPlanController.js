const { exec } = require('../config/sequelize');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

/**
 * Get the latest series number from database
 * @returns {Promise<number>} Latest series number
 */
const getLatestSeriesNumber = async () => {
  try {
    logger.info('Getting latest series number from database');
    
    const result = await exec('page_Import_Prd_plan', {
      hcase: 'SELECT_LAST_SERIES',
      p1: '', p2: '', p3: '', p4: '', p5: '',
      p6: '', p7: '', p8: '', p9: '', p10: ''
    });

    // ถ้า result เป็น array และมีข้อมูล
    if (result && Array.isArray(result) && result.length > 0) {
      const lastSeriesNumber = result[0].LastSeriesNumber || 0;
      logger.info('Latest series number retrieved:', { lastSeriesNumber });
      return parseInt(lastSeriesNumber);
    }

    logger.info('No existing series number found, starting from 0');
    return 0;
  } catch (error) {
    logger.error('Error getting latest series number:', error);
    throw error;
  }
};

/**
 * Validate and format plan_date for nvarchar(8) storage
 * @param {string} dateString - Date string (e.g., "18072025")
 * @returns {string} Formatted date string for nvarchar(8)
 */
const formatPlanDateForStorage = (dateString) => {
  try {
    if (!dateString) return '';
    
    // ตรวจสอบว่าเป็น string และไม่เกิน 8 ตัวอักษร
    if (typeof dateString !== 'string' || dateString.length > 8) {
      throw new Error('Plan date must be a string with maximum 8 characters');
    }
    
    // ตัดช่องว่างและตรวจสอบว่าไม่ว่าง
    const trimmedDate = dateString.trim();
    if (trimmedDate === '') {
      throw new Error('Plan date cannot be empty');
    }
    
    return trimmedDate;
  } catch (error) {
    logger.error('Error formatting plan date:', { dateString, error: error.message });
    throw new Error(`Invalid plan date format: ${dateString}`);
  }
};

/**
 * Insert product plan data
 * @param {Object} productData - Product data to insert
 * @param {string} productData.product_id - Product ID
 * @param {string} productData.product_name - Product name
 * @param {string} productData.plan_date - Plan date
 * @param {string} productData.create_date - Create date
 * @param {string} productData.series_number - Series number
 * @param {string} productData.empId - Employee ID
 * @param {string} productData.empName - Employee name
 * @returns {Promise<Object>} Insert result
 */
const insertProductPlan = async (productData) => {
  try {
    // Format plan_date for nvarchar(8) storage
    const formattedPlanDate = formatPlanDateForStorage(productData.plan_date);
    
    logger.info('Inserting product plan data:', {
      product_id: productData.product_id,
      product_name: productData.product_name,
      plan_date: productData.plan_date,
      formatted_plan_date: formattedPlanDate,
      series_number: productData.series_number,
      empId: productData.empId
    });

    const result = await exec('page_Import_Prd_plan', {
      hcase: 'INSERT',
      p1: productData.product_id || '',
      p2: productData.product_name || '',
      p3: formattedPlanDate,
      p4: productData.create_date || '',
      p5: '', // update_date จะถูก set โดย stored procedure
      p6: productData.series_number || '',
      p7: productData.empId || '',
      p8: productData.empName || '',
      p9: productData.plan_value, // Reserved
      p10: '' // Reserved
    });

    logger.info('Product plan data inserted successfully');
    return result;
  } catch (error) {
    logger.error('Error inserting product plan data:', error);
    throw error;
  }
};

/**
 * Process import product plan data
 * @param {Object} requestData - Request data
 * @param {string} requestData.emp_id - Employee ID
 * @param {Array} requestData.productList - List of products
 * @returns {Promise<Object>} Processed data with series numbers
 */
const processImportProductPlan = async (requestData) => {
  try {
    const { emp_id, productList } = requestData;

    if (!emp_id) {
      throw new Error('emp_id is required');
    }

    if (!productList || !Array.isArray(productList) || productList.length === 0) {
      throw new Error('productList is required and must be a non-empty array');
    }

    logger.info('Processing import product plan data:', {
      emp_id,
      productCount: productList.length
    });

    // ดึง series number ล่าสุด
    const latestSeriesNumber = await getLatestSeriesNumber();
    
    // สร้าง create_date ในรูปแบบ timestamp
    const createDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // ประมวลผลข้อมูลแต่ละ product
    const processedProductList = [];
    const newSeriesNumber = latestSeriesNumber + 1;

    for (const product of productList) {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!product.id || !product.name || !product.plan_date) {
        throw new Error('Each product must have id, name, and plan_date');
      }

      // สร้างข้อมูลที่ประมวลผลแล้ว
      const processedProduct = {
        id: product.id,
        name: product.name,
        plan_date: product.plan_date,
        plan_value: product.plan_value,
        create_date: createDate,
        series_number: newSeriesNumber
      };

      // เพิ่มข้อมูลลงในฐานข้อมูล
      await insertProductPlan({
        product_id: product.id,
        product_name: product.name,
        plan_date: product.plan_date,
        plan_value: product.plan_value,
        create_date: createDate,
        series_number: newSeriesNumber.toString(),
        empId: emp_id,
        empName: emp_id // ใช้ emp_id เป็น empName ถ้าไม่มี empName
      });

      processedProductList.push(processedProduct);
    }

    logger.info('Import product plan processing completed:', {
      emp_id,
      processedCount: processedProductList.length,
      seriesNumber: newSeriesNumber
    });

    return {
      emp_id,
      productList: processedProductList
    };

  } catch (error) {
    logger.error('Error processing import product plan:', error);
    throw error;
  }
};

/**
 * Get product data by calling page_Import_Prd_plan with SELECT_PRD
 * @param {Object} params - Parameters for the stored procedure
 * @param {string} params.product_id - Product ID to search for
 * @returns {Promise<Array>} Product data from stored procedure
 */
const getProductDataBySelectPrd = async (params) => {
  const { product_id = '' } = params;

  logger.info('Executing page_Import_Prd_plan with SELECT_PRD:', { product_id });

  try {
    const result = await exec('page_Import_Prd_plan', {
      hcase: 'SELECT_PRD',
      p1: product_id,
      p2: '', p3: '', p4: '', p5: '', p6: '', p7: '', p8: '', p9: '', p10: ''
    });

    logger.info('Product data retrieved successfully:', { 
      product_id,
      resultType: typeof result, 
      isArray: Array.isArray(result), 
      length: Array.isArray(result) ? result.length : 'N/A' 
    });

    return result;
  } catch (error) {
    logger.error('Error in getProductDataBySelectPrd:', {
      error: error.message,
      stack: error.stack,
      params: { product_id }
    });
    throw error;
  }
};

module.exports = {
  processImportProductPlan,
  getLatestSeriesNumber,
  insertProductPlan,
  getProductDataBySelectPrd
}; 