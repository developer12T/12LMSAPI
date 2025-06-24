const express = require('express');
const router = express.Router();
const { executeStoredProcedure } = require('../config/database');
const { authMiddleware } = require('../middleware/ldapAuth');
const { setupLogger } = require('../utils/logger');
const {
  getDailyStockData,
  getDailyStockHeadData,
  getDailyStockLineData
} = require('../controllers/reportTmsController');
const {
  formatErrorResponse,
  createSuccessResponse,
  validatePagination
} = require('../utils/responseFormatter');
const { createRouteHandler } = require('../utils/routeHandler');

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

// ============================================================================
// DAILY STOCK ENDPOINTS
// ============================================================================

// GET /api/report-tms/daily-stock - Get daily stock data with query parameters
router.get('/daily-stock', createRouteHandler(getDailyStockData, {
  stringParams: ['hcase', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'],
  extractMetadata: (params) => ({
    hcase: params.hcase,
    p1: params.p1,
    p2: params.p2,
    p3: params.p3,
    p4: params.p4,
    p5: params.p5,
    p6: params.p6,
    p7: params.p7,
    p8: params.p8,
    p9: params.p9,
    p10: params.p10
  })
}));

// POST /api/report-tms/daily-stock - Get daily stock data with body parameters
router.post('/daily-stock', createRouteHandler(getDailyStockData, {
  stringParams: ['hcase', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'],
  extractMetadata: (params) => ({
    hcase: params.hcase,
    p1: params.p1,
    p2: params.p2,
    p3: params.p3,
    p4: params.p4,
    p5: params.p5,
    p6: params.p6,
    p7: params.p7,
    p8: params.p8,
    p9: params.p9,
    p10: params.p10
  })
}));

// GET /api/report-tms/daily-stock/head - Get daily stock head data (สร้าง head)
router.get('/daily-stock/head', createRouteHandler(getDailyStockHeadData, {
  stringParams: ['p1', 'p2', 'p3'],
  extractMetadata: (params) => ({
    p1: params.p1,
    p2: params.p2,
    p3: params.p3
  })
}));

// POST /api/report-tms/daily-stock/head - Get daily stock head data with body parameters
router.post('/daily-stock/head', createRouteHandler(getDailyStockHeadData, {
  stringParams: ['p1', 'p2', 'p3'],
  extractMetadata: (params) => ({
    p1: params.p1,
    p2: params.p2,
    p3: params.p3
  })
}));

// GET /api/report-tms/daily-stock/line - Get daily stock line data (สร้าง line)
router.get('/daily-stock/line', createRouteHandler(getDailyStockLineData, {
  stringParams: ['p1', 'p2', 'p3'],
  extractMetadata: (params) => ({
    p1: params.p1,
    p2: params.p2,
    p3: params.p3
  })
}));

// POST /api/report-tms/daily-stock/line - Get daily stock line data with body parameters
router.post('/daily-stock/line', createRouteHandler(getDailyStockLineData, {
  stringParams: ['p1', 'p2', 'p3'],
  extractMetadata: (params) => ({
    p1: params.p1,
    p2: params.p2,
    p3: params.p3
  })
}));

module.exports = router; 