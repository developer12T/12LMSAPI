const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../middleware/ldapAuth');
const { setupLogger } = require('../../../utils/logger');
const {
  getNoBillData,
  getWharehouse
} = require('../../../controllers/reportOmsController');
const { createRouteHandler } = require('../../../utils/routeHandler');

router.get('/', createRouteHandler(getNoBillData, {
    requiredParams: ['warehouse', 'dateStart', 'dateEnd'],
    stringParams: ['hcase', 'warehouse', 'dateStart', 'dateEnd'],
    extractMetadata: (params) => ({
      hcase: params.hcase || 'getdata_nobill',
      warehouse: params.warehouse,
      dateStart: params.dateStart,
      dateEnd: params.dateEnd
    })
  }));
  
  router.get('/option-wh', createRouteHandler(getWharehouse, {
    extractMetadata: (params) => ({
      hcase: params.hcase || 'show_wh',
      p1: '',
      p2: '',
      p3: ''
    })
  }));

  module.exports = router;