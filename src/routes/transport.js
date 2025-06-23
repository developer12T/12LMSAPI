const express = require('express');
const router = express.Router();
const { executeStoredProcedure } = require('../config/database');
const { authMiddleware } = require('../middleware/ldapAuth');
const { getCacheKey, getCachedData } = require('../utils/cache');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

// Constants for pagination and response
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

// Thai timezone configuration
const THAI_TIMEZONE = 'Asia/Bangkok';

/**
 * Get current time in Thai timezone
 * @returns {string} ISO string in Thai timezone
 */
const getThaiTime = () => {
  return new Date().toLocaleString('en-US', {
    timeZone: THAI_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6.000Z');
};

/**
 * Format date to Thai timezone
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date in Thai timezone
 */
const formatThaiTime = (date) => {
  if (!date) return getThaiTime();
  
  const dateObj = new Date(date);
  return dateObj.toLocaleString('en-US', {
    timeZone: THAI_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6.000Z');
};

const validatePagination = (page, pageSize) => {
  const validatedPage = Math.max(1, parseInt(page) || 1);
  const validatedPageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(pageSize) || DEFAULT_PAGE_SIZE)
  );
  return { page: validatedPage, pageSize: validatedPageSize };
};

/**
 * Format error response
 * @param {Error|string} error - Error object or message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted error response
 */
const formatErrorResponse = (error, statusCode = 500) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorName = typeof error === 'string' ? 'ValidationError' : error.name;
  
  return {
    status: {
      code: statusCode,
      message: statusCode === 500 ? "Internal Server Error" : errorMessage,
      timestamp: getThaiTime(),
      timezone: THAI_TIMEZONE
    },
    error: {
      type: errorName,
      code: error.code || 'UNKNOWN_ERROR',
      message: process.env.NODE_ENV === 'development' ? errorMessage : 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' && typeof error !== 'string' ? error.stack : undefined
    }
  };
};

/**
 * Create standard success response
 * @param {Array} data - Data array
 * @param {Object} metadata - Metadata object
 * @returns {Object} Formatted success response
 */
const createSuccessResponse = (data, metadata = {}) => {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = metadata;
  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    status: {
      code: 200,
      message: "Success",
      timestamp: getThaiTime(),
      timezone: THAI_TIMEZONE
    },
    data: data,
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_records: total,
      per_page: pageSize,
      has_next: page < totalPages,
      has_previous: page > 1
    }
  };
};

// ============================================================================
// BACKLOG ENDPOINTS
// ============================================================================

// GET /api/transport/backlog - Get backlog data with query parameters
router.get('/backlog', async (req, res) => {
  try {
    const {
      hcase = 'show_databl',
      wh,        // รับค่า wh จาก query parameter
      status,    // รับค่า status จาก query parameter
      p3 = '',
      p4 = '',
      p5 = '',
      p6 = '',
      p7 = '',
      p8 = '',
      p9 = '',
      p10 = '',
      page = 1,
      per_page = DEFAULT_PAGE_SIZE
    } = req.query;

    // Validate required parameters
    if (!wh) {
      return res.status(400).json(formatErrorResponse('wh parameter is required', 400));
    }
    if (!status) {
      return res.status(400).json(formatErrorResponse('status parameter is required', 400));
    }

    // Validate pagination parameters
    const { page: validPage, pageSize: validPerPage } = validatePagination(page, per_page);

    const cacheKey = getCacheKey('transport_backlog_get', {
      hcase, wh, status, p3, p4, p5, p6, p7, p8, p9, p10, page: validPage, per_page: validPerPage
    });
    
    const data = await getCachedData(
      cacheKey,
      async () => {
        logger.info('Executing page_Backlog stored procedure for backlog data:', {
          hcase, wh, status, p3, p4, p5, p6, p7, p8, p9, p10
        });
        
        const result = await executeStoredProcedure('page_Backlog', {
          hcase: hcase,      // @hcase = 'show_databl'
          p1: wh,            // @p1 = warehouse
          p2: status,        // @p2 = status
          p3: p3 || '',      // @p3 = ''
          p4: p4 || '',      // @p4 = ''
          p5: p5 || '',      // @p5 = ''
          p6: p6 || '',      // @p6 = ''
          p7: p7 || '',      // @p7 = ''
          p8: p8 || '',      // @p8 = ''
          p9: p9 || '',      // @p9 = ''
          p10: p10 || ''     // @p10 = ''
        });

        if (!Array.isArray(result)) {
          logger.warn('Unexpected response format from page_Backlog:', result);
          return [];
        }

        return result;
      }
    );

    const metadata = {
      page: validPage,
      pageSize: validPerPage,
      query_parameters: {
        hcase, wh, status, p3, p4, p5, p6, p7, p8, p9, p10
      }
    };

    res.json(createSuccessResponse(data, metadata));
  } catch (error) {
    logger.error('Error in backlog GET route:', error);
    res.status(500).json(formatErrorResponse(error));
  }
})

// POST /api/transport/backlog - Get backlog data with body parameters
router.post('/backlog', async (req, res) => {
  try {
    const {
      hcase = 'show_databl',
      wh,        // รับค่า wh จาก request body
      status,    // รับค่า status จาก request body
      p3 = '',
      p4 = '',
      p5 = '',
      p6 = '',
      p7 = '',
      p8 = '',
      p9 = '',
      p10 = '',
      page = 1,
      per_page = DEFAULT_PAGE_SIZE
    } = req.body;

    // Validate required parameters
    if (!wh) {
      return res.status(400).json(formatErrorResponse('wh parameter is required', 400));
    }
    if (!status) {
      return res.status(400).json(formatErrorResponse('status parameter is required', 400));
    }

    // Validate pagination parameters
    const { page: validPage, pageSize: validPerPage } = validatePagination(page, per_page);

    const cacheKey = getCacheKey('transport_backlog_post', {
      hcase, wh, status, p3, p4, p5, p6, p7, p8, p9, p10, page: validPage, per_page: validPerPage
    });
    
    const data = await getCachedData(
      cacheKey,
      async () => {
        logger.info('Executing page_Backlog stored procedure via POST:', {
          hcase, wh, status, p3, p4, p5, p6, p7, p8, p9, p10
        });
        
        const result = await executeStoredProcedure('page_Backlog', {
          hcase: hcase,      // @hcase = 'show_databl'
          p1: wh,            // @p1 = warehouse
          p2: status,        // @p2 = status
          p3: p3 || '',      // @p3 = ''
          p4: p4 || '',      // @p4 = ''
          p5: p5 || '',      // @p5 = ''
          p6: p6 || '',      // @p6 = ''
          p7: p7 || '',      // @p7 = ''
          p8: p8 || '',      // @p8 = ''
          p9: p9 || '',      // @p9 = ''
          p10: p10 || ''     // @p10 = ''
        });

        if (!Array.isArray(result)) {
          logger.warn('Unexpected response format from page_Backlog:', result);
          return [];
        }

        return result;
      }
    );

    const metadata = {
      page: validPage,
      pageSize: validPerPage,
      query_parameters: {
        hcase, wh, status, p3, p4, p5, p6, p7, p8, p9, p10
      }
    };

    res.json(createSuccessResponse(data, metadata));
  } catch (error) {
    logger.error('Error in backlog POST route:', error);
    res.status(500).json(formatErrorResponse(error));
  }
});

// ============================================================================
// WAREHOUSE ENDPOINTS
// ============================================================================

// GET /api/transport/warehouses - Get warehouse data
router.get('/warehouses', async (req, res) => {
  try {
    const {
      hcase = 'show_wh',
      p1 = '',
      p2 = '',
      p3 = '',
      p4 = '',
      p5 = '',
      p6 = '',
      p7 = '',
      p8 = '',
      p9 = '',
      p10 = '',
      page = 1,
      per_page = DEFAULT_PAGE_SIZE
    } = req.query;

    // Validate pagination parameters
    const { page: validPage, pageSize: validPerPage } = validatePagination(page, per_page);

    const cacheKey = getCacheKey('transport_warehouses', {
      hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, page: validPage, per_page: validPerPage
    });
    
    const data = await getCachedData(
      cacheKey,
      async () => {
        logger.info('Executing page_Backlog stored procedure for warehouses:', {
          hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
        });
        
        const result = await executeStoredProcedure('page_Backlog', {
          hcase,
          p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
        });

        if (!Array.isArray(result)) {
          logger.warn('Unexpected response format from page_Backlog for warehouses:', result);
          return [];
        }

        return result;
      }
    );

    const metadata = {
      page: validPage,
      pageSize: validPerPage,
      query_parameters: {
        hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
      }
    };

    res.json(createSuccessResponse(data, metadata));
  } catch (error) {
    logger.error('Error in warehouses route:', error);
    res.status(500).json(formatErrorResponse(error));
  }
});

// POST /api/transport/warehouses - Get warehouse data with body parameters
router.post('/warehouses', async (req, res) => {
  try {
    const {
      hcase = 'show_wh',
      p1 = '',
      p2 = '',
      p3 = '',
      p4 = '',
      p5 = '',
      p6 = '',
      p7 = '',
      p8 = '',
      p9 = '',
      p10 = '',
      page = 1,
      per_page = DEFAULT_PAGE_SIZE
    } = req.body;

    // Validate pagination parameters
    const { page: validPage, pageSize: validPerPage } = validatePagination(page, per_page);

    const cacheKey = getCacheKey('transport_warehouses_post', {
      hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, page: validPage, per_page: validPerPage
    });
    
    const data = await getCachedData(
      cacheKey,
      async () => {
        logger.info('Executing page_Backlog stored procedure for warehouses via POST:', {
          hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
        });
        
        const result = await executeStoredProcedure('page_Backlog', {
          hcase,
          p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
        });

        if (!Array.isArray(result)) {
          logger.warn('Unexpected response format from page_Backlog for warehouses:', result);
          return [];
        }

        return result;
      }
    );

    const metadata = {
      page: validPage,
      pageSize: validPerPage,
      query_parameters: {
        hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
      }
    };

    res.json(createSuccessResponse(data, metadata));
  } catch (error) {
    logger.error('Error in warehouses POST route:', error);
    res.status(500).json(formatErrorResponse(error));
  }
});

// ============================================================================
// GENERAL TRANSPORT ENDPOINTS
// ============================================================================

// GET /api/transport - Get general transport data
router.get('/', async (req, res) => {
  try {
    const {
      hcase = 'show_wh',
      p1 = '',
      p2 = '',
      p3 = '',
      p4 = '',
      p5 = '',
      p6 = '',
      p7 = '',
      p8 = '',
      p9 = '',
      p10 = '',
      page = 1,
      per_page = DEFAULT_PAGE_SIZE
    } = req.query;

    // Validate pagination parameters
    const { page: validPage, pageSize: validPerPage } = validatePagination(page, per_page);

    const cacheKey = getCacheKey('transport_general', {
      hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, page: validPage, per_page: validPerPage
    });
    
    const data = await getCachedData(
      cacheKey,
      async () => {
        logger.info('Fetching general transport data from database with parameters:', {
          hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, page: validPage, per_page: validPerPage
        });
        
        const result = await executeStoredProcedure('page_Backlog', {
          hcase,
          p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
        });

        if (!Array.isArray(result)) {
          logger.warn('Unexpected response format from page_Backlog:', result);
          return [];
        }

        return result;
      }
    );

    const metadata = {
      page: validPage,
      pageSize: validPerPage,
      query_parameters: {
        hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
      }
    };

    res.json(createSuccessResponse(data, metadata));
  } catch (error) {
    logger.error('Error in general transport route:', error);
    res.status(500).json(formatErrorResponse(error));
  }
});

// POST /api/transport - Get general transport data with body parameters
router.post('/', async (req, res) => {
  try {
    const {
      hcase = 'show_wh',
      p1 = '',
      p2 = '',
      p3 = '',
      p4 = '',
      p5 = '',
      p6 = '',
      p7 = '',
      p8 = '',
      p9 = '',
      p10 = '',
      page = 1,
      per_page = DEFAULT_PAGE_SIZE
    } = req.body;

    // Validate pagination parameters
    const { page: validPage, pageSize: validPerPage } = validatePagination(page, per_page);

    const cacheKey = getCacheKey('transport_general_post', {
      hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, page: validPage, per_page: validPerPage
    });
    
    const data = await getCachedData(
      cacheKey,
      async () => {
        logger.info('Fetching general transport data via POST with parameters:', {
          hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, page: validPage, per_page: validPerPage
        });
        
        const result = await executeStoredProcedure('page_Backlog', {
          hcase,
          p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
        });

        if (!Array.isArray(result)) {
          logger.warn('Unexpected response format from page_Backlog:', result);
          return [];
        }

        return result;
      }
    );

    const metadata = {
      page: validPage,
      pageSize: validPerPage,
      query_parameters: {
        hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
      }
    };

    res.json(createSuccessResponse(data, metadata));
  } catch (error) {
    logger.error('Error in general transport POST route:', error);
    res.status(500).json(formatErrorResponse(error));
  }
});

module.exports = router; 