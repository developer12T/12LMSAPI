const express = require('express');
const router = express.Router();
const { setupLogger } = require('../../utils/logger');
const { 
  processImportProductPlan,
  getProductDataBySelectPrd
} = require('../../controllers/importProductPlanController');

const logger = setupLogger();

/**
 * POST /api/import-product-plan
 * Import product plan data
 */
router.post('/', async (req, res) => {
  try {
    const { emp_id, productList } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!emp_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'emp_id is required'
      });
    }

    if (!productList || !Array.isArray(productList) || productList.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'productList is required and must be a non-empty array'
      });
    }

    // ตรวจสอบข้อมูลใน productList
    for (let i = 0; i < productList.length; i++) {
      const product = productList[i];
      if (!product.id || !product.name || !product.plan_date) {
        return res.status(400).json({
          success: false,
          error: 'Invalid product data',
          message: `Product at index ${i} must have id, name, and plan_date`
        });
      }
      
      // ตรวจสอบ format ของ plan_date สำหรับ nvarchar(8)
      if (typeof product.plan_date !== 'string' || product.plan_date.trim() === '' || product.plan_date.length > 8) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plan_date format',
          message: `Product at index ${i} has invalid plan_date. Please provide a string with maximum 8 characters (e.g., "18072025").`
        });
      }
    }

    logger.info('Processing import product plan request:', {
      emp_id,
      productCount: productList.length
    });

    // ประมวลผลข้อมูล
    const result = await processImportProductPlan({
      emp_id,
      productList
    });

    logger.info('Import product plan completed successfully:', {
      emp_id,
      processedCount: result.productList.length
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Product plan data imported successfully'
    });

  } catch (error) {
    logger.error('Error in import product plan route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import product plan data',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/import-product-plan/select-prd
 * Get product data by calling page_Import_Prd_plan with SELECT_PRD
 */
router.get('/select-prd', async (req, res) => {
  try {
    const { product_id } = req.query;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!product_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'product_id is required'
      });
    }

    logger.info('Processing select product request:', {
      product_id
    });

    // เรียก function เพื่อดึงข้อมูล
    const result = await getProductDataBySelectPrd({
      product_id
    });

    logger.info('Select product completed successfully:', {
      product_id,
      resultCount: Array.isArray(result) ? result.length : 'N/A'
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Product data retrieved successfully'
    });

  } catch (error) {
    logger.error('Error in select product route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve product data',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 