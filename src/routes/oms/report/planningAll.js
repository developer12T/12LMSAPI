const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../middleware/ldapAuth');
const { setupLogger } = require('../../../utils/logger');
const {
  getPlanningAllData,
  getPlanningAllDataShowPnaDc,
  getPlanningAllGenDataPnl
} = require('../../../controllers/reportOmsController');
const { createRouteHandler } = require('../../../utils/routeHandler');

// GET /api/report-tms/planning-all - Get planning all data with query parameters
router.get('/', createRouteHandler(getPlanningAllData, {
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
  router.get('/show-pna-dc', createRouteHandler(getPlanningAllDataShowPnaDc, {
    stringParams: ['hcase', 'p1', 'p2', 'p3', 'p4', 'p5'],
    extractMetadata: (params) => ({
      hcase: params.hcase || 'show_pna_dc',
      p1: params.p1 || '105',
      p2: params.p2 || '410',
      p3: params.p3 || '',
      p4: params.p4 || '',
      p5: params.p5 || ''
    })
  }));

  // POST /api/report-tms/planning-all/gen-data-pnl - Generate planning all data panel
  router.post('/gen-data-pnl', authMiddleware, createRouteHandler(getPlanningAllGenDataPnl, {
    stringParams: ['hcase', 'p1', 'p2', 'p3', 'p4', 'p5'],
    extractMetadata: (params) => ({
      hcase: params.hcase || 'gendatapnl',
      p1: params.p1 || '',
      p2: params.p2 || '',
      p3: params.p3 || '',
      p4: params.p4 || '',
      p5: params.p5 || ''
    })
  }));

  module.exports = router;