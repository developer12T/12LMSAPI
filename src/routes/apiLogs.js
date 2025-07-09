const express = require('express');
const router = express.Router();
const apiLogger = require('../middleware/apiLogger');

// Get all API logs with pagination
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        
        const logs = await apiLogger.getLogs(limit, offset);
        
        res.json({
            success: true,
            data: logs,
            pagination: {
                limit,
                offset,
                total: logs.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve API logs',
            message: error.message
        });
    }
});

// Get API logs by date range
router.get('/by-date', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'startDate and endDate are required'
            });
        }
        
        const logs = await apiLogger.getLogsByDate(startDate, endDate);
        
        res.json({
            success: true,
            data: logs,
            filters: {
                startDate,
                endDate
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve API logs by date',
            message: error.message
        });
    }
});

// Get API logs by employee ID
router.get('/by-employee/:employeeID', async (req, res) => {
    try {
        const { employeeID } = req.params;
        
        const logs = await apiLogger.getLogsByEmployee(employeeID);
        
        res.json({
            success: true,
            data: logs,
            filters: {
                employeeID
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve API logs by employee',
            message: error.message
        });
    }
});

// Get API statistics
router.get('/statistics', async (req, res) => {
    try {
        const stats = await apiLogger.getStatistics();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve API statistics',
            message: error.message
        });
    }
});

// Get recent API calls (last 24 hours)
router.get('/recent', async (req, res) => {
    try {
        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const logs = await apiLogger.getLogsByDate(startDate, endDate);
        
        res.json({
            success: true,
            data: logs,
            filters: {
                period: 'last 24 hours',
                startDate,
                endDate
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve recent API logs',
            message: error.message
        });
    }
});

// Get slow API calls (response time > threshold)
router.get('/slow-calls', async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 1000; // Default 1 second
        const limit = parseInt(req.query.limit) || 50;
        
        const logs = await apiLogger.getLogs(1000, 0); // Get more logs to filter
        const slowCalls = logs
            .filter(log => log.duration > threshold)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
        
        res.json({
            success: true,
            data: slowCalls,
            filters: {
                threshold,
                limit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve slow API calls',
            message: error.message
        });
    }
});

// Get API calls by status code
router.get('/by-status/:statusCode', async (req, res) => {
    try {
        const { statusCode } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        
        const logs = await apiLogger.getLogs(1000, 0);
        const filteredLogs = logs
            .filter(log => log.statusCode.toString() === statusCode)
            .slice(0, limit);
        
        res.json({
            success: true,
            data: filteredLogs,
            filters: {
                statusCode,
                limit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve API logs by status code',
            message: error.message
        });
    }
});

module.exports = router; 