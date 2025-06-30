const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/ldapAuth');
const { getCacheKey, getCachedData } = require('../utils/cache');
const { setupLogger } = require('../utils/logger');
const {
  getBacklogData,
  getWarehouseData,
  getPODetailsData,
  getGeneralTransportData,
  getReasonsData,
  updateBacklog,
  getGenBackOrderData,
  getTransportCostWarehouseData,
  getTransportCostRouteData,
  getTransportCostData,
  getTransportCostTableData,
  getTransportCostShipmentData,
  getTransportCostShipmentEdit
} = require('../controllers/transportController');
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
// BACKLOG ENDPOINTS
// ============================================================================

// GET /api/transport/backlog - Get backlog data with query parameters
router.get('/backlog', createRouteHandler(getBacklogData, {
  requiredParams: ['wh', 'status'],
  stringParams: ['hcase', 'wh', 'status', 'reason', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'],
  extractMetadata: (params) => ({
    hcase: params.hcase,
    wh: params.wh,
    status: params.status,
    reason: params.reason,
    p4: params.p4,
    p5: params.p5,
    p6: params.p6,
    p7: params.p7,
    p8: params.p8,
    p9: params.p9,
    p10: params.p10
  })
}));

// POST /api/transport/backlog - Get backlog data with body parameters
router.post('/backlog', createRouteHandler(getBacklogData, {
  requiredParams: ['wh', 'status'],
  stringParams: ['hcase', 'wh', 'status', 'reason', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'],
  extractMetadata: (params) => ({
    hcase: params.hcase,
    wh: params.wh,
    status: params.status,
    reason: params.reason,
    p4: params.p4,
    p5: params.p5,
    p6: params.p6,
    p7: params.p7,
    p8: params.p8,
    p9: params.p9,
    p10: params.p10
  })
}));

// POST /api/transport/backlog/update - Update backlog data
router.post('/backlog/update', createRouteHandler(updateBacklog, {
  requiredParams: ['po_no', 'usermodify'],
  stringParams: ['reason', 'other', 'postpone', 'po_no', 'usermodify'],
  extractMetadata: (params) => ({
    po_no: params.po_no,
    usermodify: params.usermodify
  })
}));

// GET /api/transport/gen-back-order - Get Gen_back_order data with query parameters
router.get('/gen-back-order', createRouteHandler(getGenBackOrderData, {
  stringParams: [],
  extractMetadata: (params) => ({
    hcase: 'getdata_bl',
    p1: '',
    p2: ''
  })
}));

// POST /api/transport/gen-back-order - Get Gen_back_order data with body parameters
router.post('/gen-back-order', createRouteHandler(getGenBackOrderData, {
  stringParams: [],
  extractMetadata: (params) => ({
    hcase: 'getdata_bl',
    p1: '',
    p2: ''
  })
}));

// ============================================================================
// REASONS ENDPOINTS
// ============================================================================

// GET /api/transport/reasons - Get reasons data
router.get('/reasons', createRouteHandler(getReasonsData));

// ============================================================================
// PO DETAILS ENDPOINTS
// ============================================================================

// GET /api/transport/po-details - Get PO details with query parameters
router.get('/po-details', createRouteHandler(getPODetailsData, {
  requiredParams: ['po_no'],
  stringParams: ['po_no'],
  extractMetadata: (params) => ({
    po_no: params.po_no
  })
}));

// POST /api/transport/po-details - Get PO details with body parameters
router.post('/po-details', createRouteHandler(getPODetailsData, {
  requiredParams: ['po_no'],
  stringParams: ['po_no'],
  extractMetadata: (params) => ({
    po_no: params.po_no
  })
}));

// ============================================================================
// WAREHOUSE ENDPOINTS
// ============================================================================

// GET /api/transport/warehouses - Get warehouse data
router.get('/warehouses', createRouteHandler(getWarehouseData, {
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

// POST /api/transport/warehouses - Get warehouse data with body parameters
router.post('/warehouses', createRouteHandler(getWarehouseData, {
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

// ============================================================================
// GENERAL TRANSPORT ENDPOINTS
// ============================================================================

// GET /api/transport - Get general transport data
router.get('/', createRouteHandler(getGeneralTransportData, {
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

// POST /api/transport - Get general transport data with body parameters
router.post('/', createRouteHandler(getGeneralTransportData, {
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

// ============================================================================
// TRANSPORT COST ENDPOINTS
// ============================================================================

// Step 1: Get warehouse list for transport cost
// GET /api/transport/cost/warehouses - Get warehouse data for transport cost
router.get('/cost/warehouses', createRouteHandler(getTransportCostWarehouseData));

// Step 2: Get route list based on selected warehouse
// GET /api/transport/cost/routes - Get route data for transport cost
router.get('/cost/routes', createRouteHandler(getTransportCostRouteData, {
  requiredParams: ['who_no'],
  stringParams: ['who_no'],
  extractMetadata: (params) => ({
    who_no: params.who_no
  })
}));

// Step 2: Get route list based on selected warehouse (POST method)
// POST /api/transport/cost/routes - Get route data for transport cost with body parameters
router.post('/cost/routes', createRouteHandler(getTransportCostRouteData, {
  requiredParams: ['who_no'],
  stringParams: ['who_no'],
  extractMetadata: (params) => ({
    who_no: params.who_no
  })
}));

// Step 3: Get transport cost data based on selected warehouse and route
// GET /api/transport/cost/data - Get transport cost data
router.get('/cost/data', createRouteHandler(getTransportCostData, {
  stringParams: ['who_no', 'begin_no', 'end_no', 'route_no', 'p5', 'p6', 'p7'],
  extractMetadata: (params) => ({
    who_no: params.who_no || '',
    begin_no: params.begin_no || '',
    end_no: params.end_no || '',
    route_no: params.route_no || '',
    p5: params.p5 || '',
    p6: params.p6 || '',
    p7: params.p7 || ''
  })
}));

// Step 3: Get transport cost data based on selected warehouse and route (POST method)
// POST /api/transport/cost/data - Get transport cost data with body parameters
router.post('/cost/data', createRouteHandler(getTransportCostData, {
  stringParams: ['who_no', 'begin_no', 'end_no', 'route_no', 'p5', 'p6', 'p7'],
  extractMetadata: (params) => ({
    who_no: params.who_no || '',
    begin_no: params.begin_no || '',
    end_no: params.end_no || '',
    route_no: params.route_no || '',
    p5: params.p5 || '',
    p6: params.p6 || '',
    p7: params.p7 || ''
  })
}));

// ============================================================================
// TRANSPORT COST TABLE ENDPOINTS (แยกต่างหากสำหรับแสดงผลตาราง)
// ============================================================================

// GET /api/transport/cost-table - Get transport cost table data
router.get('/cost-table', createRouteHandler(getTransportCostTableData, {
  stringParams: ['who_no', 'begin_no', 'end_no', 'route_no', 'p5', 'p6', 'p7'],
  extractMetadata: (params) => ({
    who_no: params.who_no || '',
    begin_no: params.begin_no || '',
    end_no: params.end_no || '',
    route_no: params.route_no || '',
    p5: params.p5 || '',
    p6: params.p6 || '',
    p7: params.p7 || ''
  })
}));

// POST /api/transport/cost-table - Get transport cost table data with body parameters
router.post('/cost-table', createRouteHandler(getTransportCostTableData, {
  stringParams: ['who_no', 'begin_no', 'end_no', 'route_no', 'p5', 'p6', 'p7'],
  extractMetadata: (params) => ({
    who_no: params.who_no || '',
    begin_no: params.begin_no || '',
    end_no: params.end_no || '',
    route_no: params.route_no || '',
    p5: params.p5 || '',
    p6: params.p6 || '',
    p7: params.p7 || ''
  })
}));

// GET /api/transport/cost-table/:id - Get transport cost shipment data by ID
router.get('/cost-table/:id', createRouteHandler(getTransportCostShipmentData, {
  stringParams: ['who_no', 'begin_no', 'end_no', 'route_no', 'shipment_no', 'cal_id1', 'cal_id2', 'cal_id3', 'p6', 'p7'],
  extractMetadata: (params) => ({
    id: params.id,
    who_no: params.who_no || '',
    begin_no: params.begin_no || '',
    end_no: params.end_no || '',
    route_no: params.route_no || '',
    shipment_no: params.shipment_no || '',
    cal_id1: params.cal_id1 || '0',
    cal_id2: params.cal_id2 || '0',
    cal_id3: params.cal_id3 || '0',
    p6: params.p6 || '',
    p7: params.p7 || ''
  })
}));

// POST /api/transport/cost-table/:id - Get transport cost shipment data by ID with body parameters
router.post('/cost-table/:id', createRouteHandler(getTransportCostShipmentData, {
  stringParams: ['who_no', 'begin_no', 'end_no', 'route_no', 'shipment_no', 'cal_id1', 'cal_id2', 'cal_id3', 'p6', 'p7'],
  extractMetadata: (params) => ({
    id: params.id,
    who_no: params.who_no || '',
    begin_no: params.begin_no || '',
    end_no: params.end_no || '',
    route_no: params.route_no || '',
    shipment_no: params.shipment_no || '',
    cal_id1: params.cal_id1 || '0',
    cal_id2: params.cal_id2 || '0',
    cal_id3: params.cal_id3 || '0',
    p6: params.p6 || '',
    p7: params.p7 || ''
  })
}));

// GET /api/transport/cost-edit - Get transport cost shipment edit data
router.get('/cost-edit', createRouteHandler(getTransportCostShipmentEdit, {
  stringParams: ['who_no', 'begin_no', 'end_no', 'route_no', 'shipment_no', 'cal_id1', 'cal_id2', 'cal_id3', 'type_no', 'helpper'],
  extractMetadata: (params) => ({
    who_no: params.who_no || '',
    begin_no: params.begin_no || '',
    end_no: params.end_no || '',
    route_no: params.route_no || '',
    shipment_no: params.shipment_no || '',
    cal_id1: params.cal_id1 || '0',
    cal_id2: params.cal_id2 || '0',
    cal_id3: params.cal_id3 || '0',
    type_no: params.type_no || '1',
    helpper: params.helpper || '0'
  })
}));

module.exports = router; 