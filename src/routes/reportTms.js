const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/ldapAuth');
const { setupLogger } = require('../utils/logger');
const {
  getDailyStockData,
  getDailyStockHeadData,
  getDailyStockLineData,
  getNoBillData,
  getNoBillSummaryData,
  getTransportCostDataOption,
  getTransportCostShowData,
  getWharehouse,
  getPlanningAllData,
  getPlanningAllDataShowPnaDc,
  getProductImportPlanData
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

// ============================================================================
// NO BILL ENDPOINTS
// ============================================================================

// GET /api/report-tms/nobill - Get no bill data with query parameters
router.get('/nobill', createRouteHandler(getNoBillData, {
  requiredParams: ['warehouse', 'dateStart', 'dateEnd'],
  stringParams: ['hcase', 'warehouse', 'dateStart', 'dateEnd'],
  extractMetadata: (params) => ({
    hcase: params.hcase || 'getdata_nobill',
    warehouse: params.warehouse,
    dateStart: params.dateStart,
    dateEnd: params.dateEnd
  })
}));

router.get('/nobill-wh', createRouteHandler(getWharehouse, {
  extractMetadata: (params) => ({
    hcase: params.hcase || 'show_wh',
    p1: '',
    p2: '',
    p3: ''
  })
}));

// POST /api/report-tms/nobill - Get no bill data with body parameters
router.post('/nobill', createRouteHandler(getNoBillData, {
  requiredParams: ['warehouse', 'dateStart', 'dateEnd'],
  stringParams: ['hcase', 'warehouse', 'dateStart', 'dateEnd'],
  extractMetadata: (params) => ({
    hcase: params.hcase || 'getdata_nobill',
    warehouse: params.warehouse,
    dateStart: params.dateStart,
    dateEnd: params.dateEnd
  })
}));

// GET /api/report-tms/nobill/summary - Get no bill summary data with query parameters
router.get('/nobill/summary', createRouteHandler(getNoBillSummaryData, {
  requiredParams: ['warehouse', 'dateStart', 'dateEnd'],
  stringParams: ['hcase', 'warehouse', 'dateStart', 'dateEnd'],
  extractMetadata: (params) => ({
    hcase: params.hcase || 'getsummary_nobill',
    warehouse: params.warehouse,
    dateStart: params.dateStart,
    dateEnd: params.dateEnd
  })
}));

// POST /api/report-tms/nobill/summary - Get no bill summary data with body parameters
router.post('/nobill/summary', createRouteHandler(getNoBillSummaryData, {
  requiredParams: ['warehouse', 'dateStart', 'dateEnd'],
  stringParams: ['hcase', 'warehouse', 'dateStart', 'dateEnd'],
  extractMetadata: (params) => ({
    hcase: params.hcase || 'getsummary_nobill',
    warehouse: params.warehouse,
    dateStart: params.dateStart,
    dateEnd: params.dateEnd
  })
}));

// ============================================================================
// TRANSPORT COST ENDPOINTS
// ============================================================================

// GET /api/report-tms/transport-cost - Get transport cost data with query parameters
router.get('/transport-cost', createRouteHandler(getTransportCostDataOption, {
  stringParams: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'],
  extractMetadata: (params) => ({
    p1: params.p1 || '',
    p2: params.p2 || '',
    p3: params.p3 || '',
    p4: params.p4 || '',
    p5: params.p5 || '',
    p6: params.p6 || '',
    p7: params.p7 || '',
    p8: params.p8 || ''
  })
}));

// POST /api/report-tms/transport-cost - Get transport cost data with body parameters
router.post('/transport-cost', createRouteHandler(getTransportCostDataOption, {
  stringParams: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'],
  extractMetadata: (params) => ({
    p1: params.p1 || '',
    p2: params.p2 || '',
    p3: params.p3 || '',
    p4: params.p4 || '',
    p5: params.p5 || '',
    p6: params.p6 || '',
    p7: params.p7 || '',
    p8: params.p8 || ''
  })
}));

// GET /api/report-tms/transport-cost/show-data - Get transport cost show data with query parameters
router.get('/transport-cost/show-data', createRouteHandler(getTransportCostShowData, {
  stringParams: ['shipmentId', 'channelId', 'truckId', 'p4', 'p5', 'p6', 'p7'],
  extractMetadata: (params) => ({
    shipmentId: params.shipmentId || '',
    channelId: params.channelId || '',
    truckId: params.truckId || '',
    p4: params.p4 || '',
    p5: params.p5 || '',
    p6: params.p6 || '',
    p7: params.p7 || ''
  })
}));

// POST /api/report-tms/transport-cost/show-data - Get transport cost show data with body parameters
router.post('/transport-cost/show-data', createRouteHandler(getTransportCostShowData, {
  stringParams: ['shipmentId', 'channelId', 'truckId', 'p4', 'p5', 'p6', 'p7'],
  extractMetadata: (params) => ({
    shipmentId: params.shipmentId || '',
    channelId: params.channelId || '',
    truckId: params.truckId || '',
    p4: params.p4 || '',
    p5: params.p5 || '',
    p6: params.p6 || '',
    p7: params.p7 || ''
  })
}));

// ============================================================================
// PLANNING ALL ENDPOINTS
// ============================================================================

// GET /api/report-tms/planning-all - Get planning all data with query parameters
router.get('/planning-all', createRouteHandler(getPlanningAllData, {
  stringParams: ['hcase', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
  extractMetadata: (params) => ({
    hcase: params.hcase || 'show_data_pna',
    p1: params.p1 || '',
    p2: params.p2 || '',
    p3: params.p3 || '',
    p4: params.p4 || '',
    p5: params.p5 || '',
    p6: params.p6 || ''
  })
}));

// POST /api/report-tms/planning-all - Get planning all data with body parameters
router.post('/planning-all', createRouteHandler(getPlanningAllData, {
  stringParams: ['hcase', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
  extractMetadata: (params) => ({
    hcase: params.hcase || 'show_data_pna',
    p1: params.p1 || '',
    p2: params.p2 || '',
    p3: params.p3 || '',
    p4: params.p4 || '',
    p5: params.p5 || '',
    p6: params.p6 || ''
  })
}));

// GET /api/report-tms/planning-all/show-pna-dc - Get planning all data with query parameters for show_pna_dc
router.get('/planning-all/show-pna-dc', createRouteHandler(getPlanningAllDataShowPnaDc, {
  stringParams: ['hcase', 'p1', 'p2', 'p3', 'p4', 'p5'],
  extractMetadata: (params) => ({
    hcase: params.hcase || 'show_pna_dc',
    p1: params.p1 || '105',
    p2: params.p2 || '',
    p3: params.p3 || '',
    p4: params.p4 || '',
    p5: params.p5 || ''
  })
}));

// POST /api/report-tms/planning-all/show-pna-dc - Get planning all data with body parameters for show_pna_dc
router.post('/planning-all/show-pna-dc', createRouteHandler(getPlanningAllDataShowPnaDc, {
  stringParams: ['hcase', 'p1', 'p2', 'p3', 'p4', 'p5'],
  extractMetadata: (params) => ({
    hcase: params.hcase || 'show_pna_dc',
    p1: params.p1 || '105',
    p2: params.p2 || '',
    p3: params.p3 || '',
    p4: params.p4 || '',
    p5: params.p5 || ''
  })
}));

// ============================================================================
// PRODUCT IMPORT PLAN ENDPOINTS
// ============================================================================

// POST /api/report-tms/product-import-plan - Get product import plan data with stored procedure enrichment
router.post('/product-import-plan', createRouteHandler(getProductImportPlanData, {
  requiredParams: ['data'],
  extractMetadata: (params) => ({
    dataLength: Array.isArray(params.data) ? params.data.length : 0
  })
}));

module.exports = router; 