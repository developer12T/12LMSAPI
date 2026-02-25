const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../middleware/ldapAuth');
const { setupLogger } = require('../../../utils/logger');
const {
  getTransportCostDataOption,
  getTransportCostShowData
} = require('../../../controllers/reportOmsController');
const { createRouteHandler } = require('../../../utils/routeHandler');

router.get('/option', createRouteHandler(getTransportCostDataOption, {
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

  router.get('/', createRouteHandler(getTransportCostShowData, {
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

  module.exports = router;