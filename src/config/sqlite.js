const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

// สร้าง path สำหรับ database file
const dbPath = path.join(__dirname, '../../data/users.db');

// สร้าง database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error('Error opening database:', err.message);
    } else {
        logger.info('Connected to SQLite database');
        initializeDatabase();
    }
});

// สร้างตาราง users ถ้ายังไม่มี
function initializeDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeID TEXT UNIQUE NOT NULL,
            userName TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL DEFAULT 'User',
            isActive INTEGER DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.run(createTableQuery, (err) => {
        if (err) {
            logger.error('Error creating table:', err.message);
        } else {
            logger.info('Users table ready');
        }
    });
}

// ฟังก์ชันสำหรับเพิ่มหรืออัปเดตผู้ใช้
function upsertUser(employeeID, userName, role = 'User') {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT OR REPLACE INTO users (employeeID, userName, role, updatedAt)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        db.run(query, [employeeID, userName, role], function(err) {
            if (err) {
                logger.error('Error upserting user:', err.message);
                reject(err);
            } else {
                logger.info(`User ${employeeID} upserted successfully`);
                resolve(this);
            }
        });
    });
}

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ตาม employeeID
function getUserByEmployeeID(employeeID) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM users WHERE employeeID = ? AND isActive = 1';
        
        db.get(query, [employeeID], (err, row) => {
            if (err) {
                logger.error('Error getting user:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ตาม userName
function getUserByUserName(userName) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM users WHERE userName = ? AND isActive = 1';
        
        db.get(query, [userName], (err, row) => {
            if (err) {
                logger.error('Error getting user:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ทั้งหมด
function getAllUsers() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM users WHERE isActive = 1 ORDER BY employeeID';
        
        db.all(query, [], (err, rows) => {
            if (err) {
                logger.error('Error getting all users:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// ฟังก์ชันสำหรับอัปเดต role ของผู้ใช้
function updateUserRole(employeeID, role) {
    return new Promise((resolve, reject) => {
        const query = 'UPDATE users SET role = ?, updatedAt = CURRENT_TIMESTAMP WHERE employeeID = ?';
        
        db.run(query, [role, employeeID], function(err) {
            if (err) {
                logger.error('Error updating user role:', err.message);
                reject(err);
            } else {
                logger.info(`User ${employeeID} role updated to ${role}`);
                resolve(this);
            }
        });
    });
}

// ฟังก์ชันสำหรับปิดการใช้งานผู้ใช้
function deactivateUser(employeeID) {
    return new Promise((resolve, reject) => {
        const query = 'UPDATE users SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE employeeID = ?';
        
        db.run(query, [employeeID], function(err) {
            if (err) {
                logger.error('Error deactivating user:', err.message);
                reject(err);
            } else {
                logger.info(`User ${employeeID} deactivated`);
                resolve(this);
            }
        });
    });
}

// ฟังก์ชันสำหรับตรวจสอบสิทธิ์การเข้าถึง
function checkUserAccess(employeeID) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT role, isActive FROM users WHERE employeeID = ?';
        
        db.get(query, [employeeID], (err, row) => {
            if (err) {
                logger.error('Error checking user access:', err.message);
                reject(err);
            } else {
                if (row && row.isActive === 1) {
                    // ตรวจสอบ role NoUse
                    if (row.role === 'NoUse') {
                        resolve({
                            hasAccess: false,
                            role: row.role
                        });
                    } else {
                        resolve({
                            hasAccess: true,
                            role: row.role
                        });
                    }
                } else {
                    resolve({
                        hasAccess: false,
                        role: null
                    });
                }
            }
        });
    });
}

module.exports = {
    db,
    upsertUser,
    getUserByEmployeeID,
    getUserByUserName,
    getAllUsers,
    updateUserRole,
    deactivateUser,
    checkUserAccess
}; 