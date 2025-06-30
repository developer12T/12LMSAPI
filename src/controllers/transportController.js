const { exec } = require('../config/sequelize');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

/**
 * Get backlog data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Backlog data
 */
const getBacklogData = async (params) => {
  const {
    hcase = 'show_databl',
    wh,
    status,
    reason = '',
    p4 = '', p5 = '', p6 = '', p7 = '', p8 = '', p9 = '', p10 = ''
  } = params;

  const p1 = wh || '';
  const p2 = status || '';
  const p3 = reason || '';

  logger.info('Executing page_Backlog for backlog data (No Cache)', { hcase });
  return await exec('page_Backlog', {
    hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
  });
};

/**
 * Get warehouse data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Warehouse data
 */
const getWarehouseData = async (params) => {
  const { hcase = 'show_wh' } = params;

  logger.info('Executing page_Backlog for warehouses (No Cache)', { hcase });
  return await exec('page_Backlog', {
    hcase, p1: '', p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Get PO details data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} PO details data
 */
const getPODetailsData = async (params) => {
  const { po_no } = params;

  if (!po_no) throw new Error('po_no parameter is required');

  logger.info('Executing page_Backlog for PO details (No Cache)', { po_no });
  return await exec('page_Backlog', {
    hcase: 'show_po_detail',
    p1: po_no,
    p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Get general transport data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} General transport data
 */
const getGeneralTransportData = async (params) => {
  const {
    hcase = 'show_wh',
    p1 = '', p2 = '', p3 = '', p4 = '', p5 = '',
    p6 = '', p7 = '', p8 = '', p9 = '', p10 = ''
  } = params;

  logger.info('Fetching general transport data (No Cache)', { hcase });
  return await exec('page_Backlog', {
    hcase, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10
  });
};

/**
 * Get reasons data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Reasons data
 */
const getReasonsData = async (params) => {
  logger.info('Executing page_Backlog for reasons (No Cache)');
  return await exec('page_Backlog', {
    hcase: 'show_reason',
    p1: '', p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Update backlog data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Object>} Result of the update operation
 */
const updateBacklog = async (params) => {
  const {
    reason,
    other,
    postpone,
    po_no,
    usermodify
  } = params;

  if (!po_no) {
    throw new Error('po_no is required to update backlog');
  }

  logger.info('Executing page_Backlog to update backlog', { po_no, usermodify });
  return await exec('page_Backlog', {
    hcase: 'update_backlog',
    p1: reason || '',
    p2: other || '',
    p3: postpone || '',
    p4: usermodify || '',
    p5: po_no,
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Get Gen_back_order data (No Caching)
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Gen_back_order data
 */
const getGenBackOrderData = async (params) => { 
  const {
    hcase = 'getdata_bl',
    p1 = '', p2 = ''
  } = params;

  logger.info('Executing Gen_back_order for data (No Cache)', { hcase });
  return await exec('page_Backlog', {
    hcase, p1, p2, p3: '', p4: '', p5: '',
    p6: '', p7: '', p8: '', p9: '', p10: ''
  });
};

/**
 * Get warehouse data for transport cost (No Caching)
 * This should be called first to get list of warehouses
 * @param {Object} params - Request parameters
 * @returns {Promise<Array>} Warehouse data with who_no and wh fields
 */
const getTransportCostWarehouseData = async (params) => {
  logger.info('Executing page_TransCost for warehouse list (Step 1)', { hcase: 'show_wh' });
  return await exec('page_TransCost', {
    hcase: 'show_wh',
    p1: '', p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: ''
  });
};

/**
 * Get route data for transport cost based on selected warehouse (No Caching)
 * This should be called after selecting a warehouse (Step 2)
 * @param {Object} params - Request parameters
 * @param {string} params.who_no - Warehouse number (required)
 * @returns {Promise<Array>} Route data for the selected warehouse
 */
const getTransportCostRouteData = async (params) => {
  const { who_no } = params;

  if (!who_no) {
    throw new Error('who_no parameter is required to get routes for transport cost');
  }

  logger.info('Executing page_TransCost for route list (Step 2)', { 
    hcase: 'show_route', 
    who_no 
  });
  
  return await exec('page_TransCost', {
    hcase: 'show_route',
    p1: who_no,
    p2: '', p3: '', p4: '', p5: '',
    p6: '', p7: ''
  });
};

/**
 * Get transport cost data (No Caching)
 * This should be called after selecting warehouse and route (Step 3)
 * @param {Object} params - Request parameters
 * @param {string} params.who_no - Warehouse number (WHO_NO)
 * @param {string} params.begin_no - Begin number (BEGIN_NO)
 * @param {string} params.end_no - End number (END_NO)
 * @param {string} params.route_no - Route number (ROUTE_NO)
 * @returns {Promise<Array>} Transport cost data
 */
const getTransportCostData = async (params) => {
  const {
    who_no = '',
    begin_no = '',
    end_no = '',
    route_no = '',
    p5 = '', p6 = '', p7 = ''
  } = params;

  logger.info('Executing page_TransCost for transport cost data (Step 3)', { 
    who_no, begin_no, end_no, route_no 
  });
  
  return await exec('page_TransCost', {
    hcase: 'show_data',
    p1: who_no,
    p2: begin_no,
    p3: end_no,
    p4: route_no,
    p5, p6, p7
  });
};

/**
 * Get transport cost table data (No Caching)
 * Separate API for displaying table data
 * @param {Object} params - Request parameters
 * @param {string} params.who_no - Warehouse number (WHO_NO)
 * @param {string} params.begin_no - Begin number (BEGIN_NO)
 * @param {string} params.end_no - End number (END_NO)
 * @param {string} params.route_no - Route number (ROUTE_NO)
 * @returns {Promise<Array>} Transport cost table data
 */
const getTransportCostTableData = async (params) => {
  const {
    who_no = '',
    begin_no = '',
    end_no = '',
    route_no = '',
    p5 = '', p6 = '', p7 = ''
  } = params;

  logger.info('Executing page_TransCost for transport cost table data', { 
    who_no, begin_no, end_no, route_no 
  });
  
  return await exec('page_TransCost', {
    hcase: 'show_data',
    p1: who_no,
    p2: begin_no,
    p3: end_no,
    p4: route_no,
    p5, p6, p7
  });
};

/**
 * Get transport cost shipment data (No Caching)
 * API for getting shipment cost calculation data and detail data
 * @param {Object} params - Request parameters
 * @param {string} params.id - Shipment ID
 * @param {string} params.who_no - Warehouse number (WHO_NO)
 * @param {string} params.begin_no - Begin number (BEGIN_NO)
 * @param {string} params.end_no - End number (END_NO)
 * @param {string} params.route_no - Route number (ROUTE_NO)
 * @param {string} params.shipment_no - Shipment number (SHIPMENT_NO)
 * @param {string} params.cal_id1 - Calculation ID 1
 * @param {string} params.cal_id2 - Calculation ID 2
 * @param {string} params.cal_id3 - Calculation ID 3
 * @returns {Promise<Array>} Shipment cost calculation data or detail data as list
 */
const getTransportCostShipmentData = async (params) => {
  const {
    id,
    who_no = '',
    begin_no = '',
    end_no = '',
    route_no = '',
    shipment_no = '',
    cal_id1 = '0',
    cal_id2 = '0',
    cal_id3 = '0',
    p6 = '', p7 = ''
  } = params;

  // Determine which stored procedure to use based on parameters
  let hcase = 'show_shipment';
  let p1, p2, p3, p4, p5;

  // If we have begin_no, end_no, route_no, and cal_id parameters, use show_shipment
  if (begin_no && end_no && route_no && (cal_id1 !== '0' || cal_id2 !== '0' || cal_id3 !== '0')) {
    hcase = 'show_shipment';
    p1 = who_no;
    p2 = begin_no;
    p3 = end_no;
    p4 = route_no;
    p5 = shipment_no;
  } else {
    // Otherwise, use show_detail (only who_no and shipment_no)
    hcase = 'show_detail';
    p1 = who_no;
    p2 = shipment_no;
    p3 = '';
    p4 = '';
    p5 = '';
  }

  logger.info('Executing page_TransCost for transport cost data', { 
    hcase, id, who_no, shipment_no, begin_no, end_no, route_no 
  });
  
  const result = await exec('page_TransCost', {
    hcase,
    p1, p2, p3, p4, p5, p6, p7
  });

  // Process the result for show_shipment (cost calculation)
  if (hcase === 'show_shipment' && result && result.length > 0) {
    // Process each item in the result array
    const processedData = result.map(shipmentData => {
      let cost, cost_ctn, cal3 = null;
      
      if (shipmentData.COST === '0' || shipmentData.COST === 0) {
        cost = parseFloat(cal_id1) + parseFloat(cal_id2) + parseFloat(cal_id3);
        cost_ctn = cost / (parseFloat(shipmentData.URPLQA) + parseFloat(shipmentData.URPRQA));
      } else {
        cost = parseFloat(shipmentData.COST);
        cost_ctn = cost / (parseFloat(shipmentData.URPLQA) + parseFloat(shipmentData.URPRQA));
        if (shipmentData.pallet_cost !== '0' && shipmentData.pallet_cost !== 0) {
          cal3 = shipmentData.pallet_cost;
        }
      }

      return {
        ...shipmentData,
        calculated_cost: cost,
        calculated_cost_ctn: cost_ctn,
        cal3: cal3,
        hcase: hcase
      };
    });

    return processedData;
  }

  // For show_detail, return the result as is (already an array)
  return result.map(item => ({
    ...item,
    hcase: hcase
  }));
};

/**
 * Get transport cost shipment edit data (No Caching)
 * API for getting shipment edit data including cost types, rates, and details
 * @param {Object} params - Request parameters
 * @param {string} params.who_no - Warehouse number (WHO_NO)
 * @param {string} params.begin_no - Begin number (BEGIN_NO)
 * @param {string} params.end_no - End number (END_NO)
 * @param {string} params.route_no - Route number (ROUTE_NO)
 * @param {string} params.shipment_no - Shipment number (SHIPMENT_NO)
 * @param {string} params.cal_id1 - Calculation ID 1 (CAL1)
 * @param {string} params.cal_id2 - Calculation ID 2 (CAL2)
 * @param {string} params.cal_id3 - Calculation ID 3 (CAL3)
 * @param {string} params.type_no - Type number (TYPE_NO)
 * @param {string} params.helpper - Helper value (HELPPER)
 * @returns {Promise<Object>} Shipment edit data with cost calculation
 */
const getTransportCostShipmentEdit = async (params) => {
  const {
    who_no = '',
    begin_no = '',
    end_no = '',
    route_no = '',
    shipment_no = '',
    cal_id1 = '0',
    cal_id2 = '0',
    cal_id3 = '0',
    type_no = '1',
    helpper = '0'
  } = params;

  logger.info('Executing page_TransCost for shipment edit data', { 
    who_no, begin_no, end_no, route_no, shipment_no, cal_id1, cal_id2, cal_id3, type_no 
  });

  // Get shipment data
  const shipmentResult = await exec('page_TransCost', {
    hcase: 'show_shipment',
    p1: who_no,
    p2: begin_no,
    p3: end_no,
    p4: route_no,
    p5: shipment_no,
    p6: '',
    p7: ''
  });

  // Get cost types
  const costTypesResult = await exec('page_TransCost', {
    hcase: 'costtype',
    p1: '', p2: '', p3: '', p4: '', p5: '', p6: '', p7: ''
  });

  // Get cost rates
  const costRatesResult = await exec('page_TransCost', {
    hcase: 'cost_rate',
    p1: '', p2: '', p3: '', p4: '', p5: '', p6: '', p7: ''
  });

  // Get detail data
  const detailResult = await exec('page_TransCost', {
    hcase: 'show_detail',
    p1: who_no,
    p2: shipment_no,
    p3: '', p4: '', p5: '', p6: '', p7: ''
  });

  // Process shipment data and calculate costs
  let shipmentData = null;
  let cost = 0;
  let cost_ctn = 0;
  let cal3 = null;

  if (shipmentResult && shipmentResult.length > 0) {
    shipmentData = shipmentResult[0];
    
    if (shipmentData.COST === '0' || shipmentData.COST === 0) {
      cost = parseFloat(cal_id1) + parseFloat(cal_id2) + parseFloat(cal_id3);
      cost_ctn = cost / (parseFloat(shipmentData.URPLQA) + parseFloat(shipmentData.URPRQA));
    } else {
      cost = parseFloat(shipmentData.COST);
      cost_ctn = cost / (parseFloat(shipmentData.URPLQA) + parseFloat(shipmentData.URPRQA));
      if (shipmentData.pallet_cost !== '0' && shipmentData.pallet_cost !== 0) {
        cal3 = shipmentData.pallet_cost;
      }
    }
  }

  return {
    shipment: {
      ...shipmentData,
      calculated_cost: cost,
      calculated_cost_ctn: cost_ctn,
      cal3: cal3
    },
    cost_types: costTypesResult || [],
    cost_rates: costRatesResult || [],
    details: detailResult || [],
    session: {
      WHO_NO: who_no,
      BEGIN_NO: begin_no,
      END_NO: end_no,
      ROUTE_NO: route_no,
      SHIPMENT_NO: shipment_no,
      CAL1: cal_id1,
      CAL2: cal_id2,
      CAL3: cal3,
      TYPE_NO: type_no,
      HELPPER: helpper
    }
  };
};

module.exports = {
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
}; 