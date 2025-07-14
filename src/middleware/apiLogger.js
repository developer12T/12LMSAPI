const fs = require('fs').promises;
const path = require('path');

class ApiLogger {
    constructor() {
        this.logFilePath = path.join(__dirname, '../../data/api_logs.json');
        this.ensureLogFile();
    }

    async ensureLogFile() {
        try {
            await fs.access(this.logFilePath);
        } catch (error) {
            // Create directory if it doesn't exist
            const dir = path.dirname(this.logFilePath);
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (mkdirError) {
                console.error('Error creating directory:', mkdirError);
            }
            
            // Create empty log file
            await fs.writeFile(this.logFilePath, JSON.stringify([], null, 2));
        }
    }

    sanitizeBody(body) {
        if (!body || typeof body !== 'object') {
            return body || {};
        }

        // Create a copy to avoid modifying original
        const sanitized = { ...body };

        // Mask sensitive fields
        if (sanitized.password) {
            sanitized.password = '***MASKED***';
        }
        if (sanitized.token) {
            sanitized.token = '***MASKED***';
        }
        if (sanitized.apiKey) {
            sanitized.apiKey = '***MASKED***';
        }

        return sanitized;
    }

    processHeaders(req, body) {
        // ถ้าเป็น login request
        if (req.originalUrl === '/api/auth/login') {
            // ถ้ามี body data
            if (body && body.username && body.password) {
                return {
                    employeeID: req.get('employeeID') || '',
                    fullName: `username: ${body.username} password: ***MASKED***`,
                    fullNameThai: req.get('fullNameThai') || '',
                    department: req.get('department') || '',
                    position: req.get('position') || '',
                    clientIP: req.get('clientIP'),
                    deviceName: req.get('deviceName'),
                    operatingSystem: req.get('operatingSystem'),
                    websiteResolution: req.get('websiteResolution'),
                    displayResolution: req.get('displayResolution')
                };
            }
            // ถ้าไม่มี body data (log เก่า) ให้ใส่ placeholder
            return {
                employeeID: req.get('employeeID') || '',
                fullName: 'login_attempt',
                fullNameThai: req.get('fullNameThai') || '',
                department: req.get('department') || '',
                position: req.get('position') || '',
                clientIP: req.get('clientIP'),
                deviceName: req.get('deviceName'),
                operatingSystem: req.get('operatingSystem'),
                websiteResolution: req.get('websiteResolution'),
                displayResolution: req.get('displayResolution')
            };
        }

        // สำหรับ request อื่นๆ ใช้แบบเดิม
        return {
            employeeID: req.get('employeeID'),
            fullName: req.get('fullName'),
            fullNameThai: req.get('fullNameThai'),
            department: req.get('department'),
            position: req.get('position'),
            clientIP: req.get('clientIP'),
            deviceName: req.get('deviceName'),
            operatingSystem: req.get('operatingSystem'),
            websiteResolution: req.get('websiteResolution'),
            displayResolution: req.get('displayResolution')
        };
    }

    async logApiCall(req, res, next) {
        // Skip logging for API logs endpoints to prevent recursive logging
        if (req.originalUrl.startsWith('/api/logs') || req.originalUrl.startsWith('/logs')) {
            return next();
        }
        
        const startTime = Date.now();
        const apiLogger = this; // Store reference to this
        
        // Capture original send method
        const originalSend = res.send;
        
        // Override send method to capture response
        res.send = function(data) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            // Create log entry
            const logEntry = {
                timestamp: new Date().toISOString(),
                requestTime: new Date(startTime).toISOString(),
                responseTime: new Date(endTime).toISOString(),
                duration: responseTime,
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                userAgent: req.get('User-Agent'),
                ip: req.ip || req.connection.remoteAddress,
                headers: apiLogger.processHeaders(req, req.body),
                query: req.query,
                body: apiLogger.sanitizeBody(req.body),
                responseSize: data ? JSON.stringify(data).length : 0
            };

            // Save log entry asynchronously
            apiLogger.saveLogEntry(logEntry);
            
            // Call original send method
            return originalSend.call(this, data);
        };

        next();
    }

    async saveLogEntry(logEntry) {
        try {
            // Read existing logs
            const data = await fs.readFile(this.logFilePath, 'utf8');
            const logs = JSON.parse(data);
            
            // Add new log entry
            logs.push(logEntry);
            
            // Keep only last 10000 entries to prevent file from growing too large
            if (logs.length > 10000) {
                logs.splice(0, logs.length - 10000);
            }
            
            // Write back to file
            await fs.writeFile(this.logFilePath, JSON.stringify(logs, null, 2));
        } catch (error) {
            console.error('Error saving API log:', error);
        }
    }

    async getLogs(limit = 100, offset = 0) {
        try {
            const data = await fs.readFile(this.logFilePath, 'utf8');
            const logs = JSON.parse(data);
            
            // Return logs with pagination
            return logs.slice(offset, offset + limit);
        } catch (error) {
            console.error('Error reading API logs:', error);
            return [];
        }
    }

    async getLogsByDate(startDate, endDate) {
        try {
            const data = await fs.readFile(this.logFilePath, 'utf8');
            const logs = JSON.parse(data);
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            return logs.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate >= start && logDate <= end;
            });
        } catch (error) {
            console.error('Error reading API logs by date:', error);
            return [];
        }
    }

    async getLogsByEmployee(employeeID) {
        try {
            const data = await fs.readFile(this.logFilePath, 'utf8');
            const logs = JSON.parse(data);
            
            return logs.filter(log => 
                log.headers.employeeID === employeeID
            );
        } catch (error) {
            console.error('Error reading API logs by employee:', error);
            return [];
        }
    }

    async getStatistics() {
        try {
            const data = await fs.readFile(this.logFilePath, 'utf8');
            const logs = JSON.parse(data);
            
            const stats = {
                totalCalls: logs.length,
                averageResponseTime: 0,
                callsByMethod: {},
                callsByStatus: {},
                callsByEmployee: {},
                callsByDepartment: {}
            };
            
            if (logs.length > 0) {
                const totalResponseTime = logs.reduce((sum, log) => sum + log.duration, 0);
                stats.averageResponseTime = totalResponseTime / logs.length;
                
                // Group by method
                logs.forEach(log => {
                    stats.callsByMethod[log.method] = (stats.callsByMethod[log.method] || 0) + 1;
                    stats.callsByStatus[log.statusCode] = (stats.callsByStatus[log.statusCode] || 0) + 1;
                    
                    if (log.headers.employeeID) {
                        stats.callsByEmployee[log.headers.employeeID] = (stats.callsByEmployee[log.headers.employeeID] || 0) + 1;
                    }
                    
                    if (log.headers.department) {
                        stats.callsByDepartment[log.headers.department] = (stats.callsByDepartment[log.headers.department] || 0) + 1;
                    }
                });
            }
            
            return stats;
        } catch (error) {
            console.error('Error getting API statistics:', error);
            return {
                totalCalls: 0,
                averageResponseTime: 0,
                callsByMethod: {},
                callsByStatus: {},
                callsByEmployee: {},
                callsByDepartment: {}
            };
        }
    }
}

const apiLogger = new ApiLogger();

module.exports = apiLogger; 
