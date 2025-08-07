const express = require('express');
const router = express.Router();
const { getBacklogData, getBacklogDetail, getBacklogDataReorganized } = require('../../../controllers/manageOmsController');
const { validateRequiredParams } = require('../../../middleware/validation');

/**
 * @route GET /api/oms/manage/backlog
 * @desc Get backlog data
 * @access Private
 */
router.get('/', validateRequiredParams(['who']), async (req, res) => {
  try {
    const { who } = req.query;
    const result = await getBacklogData({ who });
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }

  } catch (error) {
    console.error('Error in backlog route:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/oms/manage/backlog/reorganized
 * @desc Get backlog data (reorganized data)
 * @access Private
 */
router.get('/reorganized', validateRequiredParams(['who']), async (req, res) => {
  try {
    const { who } = req.query;
    const result = await getBacklogDataReorganized({ who });
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }

  } catch (error) {
    console.error('Error in backlog reorganized route:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/oms/manage/backlog/detail
 * @desc Get backlog detail data (raw data)
 * @access Private
 */
router.get('/detail', validateRequiredParams(['who', 'provinceCode', 'date']), async (req, res) => {
  try {
    const { who, provinceCode, date } = req.query;
    const result = await getBacklogDetail({ who, provinceCode, date });
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }

  } catch (error) {
    console.error('Error in backlog detail route:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 