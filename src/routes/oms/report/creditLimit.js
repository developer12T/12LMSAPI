const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../middleware/ldapAuth');
const { setupLogger } = require('../../../utils/logger');
const {
  getCreditLimitData
} = require('../../../controllers/reportOmsController');
const { createRouteHandler } = require('../../../utils/routeHandler');

router.get('/', createRouteHandler(getCreditLimitData, {
    extractMetadata: (params) => ({
      hcase: params.hcase || 'CreditLimit',
      warehouse: params.warehouse,
      p2: params.p2 || '',
      p3: params.p3 || ''
    })
  }));

module.exports = router; 