const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

// สร้าง path สำหรับ menu database file
const dbPath = path.join(__dirname, '../../data/menus.db');

// สร้าง database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error('Error opening menu database:', err.message);
    } else {
        logger.info('Connected to Menu SQLite database');
        initializeMenuDatabase();
    }
});

// สร้างตาราง menus ถ้ายังไม่มี
function initializeMenuDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS menus (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            system TEXT NOT NULL,
            category TEXT NOT NULL,
            item_name TEXT NOT NULL,
            route_path TEXT NOT NULL,
            icon TEXT DEFAULT '',
            status INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.run(createTableQuery, (err) => {
        if (err) {
            logger.error('Error creating menus table:', err.message);
        } else {
            logger.info('Menus table ready');
            // เพิ่มข้อมูลเริ่มต้น
            insertInitialMenus();
        }
    });
}

// เพิ่มข้อมูลเมนูเริ่มต้น
function insertInitialMenus() {
    const initialMenus = [
        // OMS System
        { system: 'OMS', category: 'รายงาน', item_name: '%เติมสินค้าเข้า DC', route_path: '/tms/report/percent-fill-to-dc', icon: 'mdi:file-document', sort_order: 1 },
        { system: 'OMS', category: 'รายงาน', item_name: 'รายการที่ไม่ได้วางบิล', route_path: '/tms/report/not-bill', icon: 'mdi:file-document', sort_order: 2 },
        { system: 'OMS', category: 'รายงาน', item_name: 'วางแผนรวม', route_path: '/tms/report/plan-total', icon: 'mdi:file-document', sort_order: 3 },
        { system: 'OMS', category: 'รายงาน', item_name: 'ค่าขนส่ง(shipment)', route_path: '/tms/report/shipment-cost', icon: 'mdi:file-document', sort_order: 4 },
        { system: 'OMS', category: 'จัดการ', item_name: 'ออเดอร์ค้างส่ง', route_path: '/tms/manage/backlog', icon: 'mdi:cog', sort_order: 1 },
        { system: 'OMS', category: 'จัดการ', item_name: 'กำหนดปริมาตรและน้ำหนักรถบรรทุก', route_path: '/tms/manage/weight-volume', icon: 'mdi:cog', sort_order: 2 },
        { system: 'OMS', category: 'จัดการ', item_name: 'จัดการค่าขนส่ง', route_path: '/tms/manage/shipcost-management', icon: 'mdi:cog', sort_order: 3 },
        
        // WMS System
        { system: 'WMS', category: 'Management', item_name: 'จัดการศูนย์กระจายสินค้า', route_path: '/manage/warehouse', icon: 'mdi:warehouse', sort_order: 1 },
        
        // TMS System
        { system: 'TMS', category: 'Reports', item_name: 'รายงานขนส่ง', route_path: '/tms/report/transport', icon: 'mdi:file-chart', sort_order: 1 },
        { system: 'TMS', category: 'Management', item_name: 'จัดการขนส่ง', route_path: '/tms/manage/transport', icon: 'mdi:cog', sort_order: 1 },
        
        // PMS System
        { system: 'PMS', category: 'Reports', item_name: 'รายงานแผน', route_path: '/pms/report/plan', icon: 'mdi:trending-up', sort_order: 1 },
        { system: 'PMS', category: 'Management', item_name: 'จัดการแผน', route_path: '/pms/manage/plan', icon: 'mdi:package-variant', sort_order: 1 }
    ];

    // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
    db.get('SELECT COUNT(*) as count FROM menus', (err, row) => {
        if (err) {
            logger.error('Error checking menu count:', err.message);
        } else if (row.count === 0) {
            // เพิ่มข้อมูลเริ่มต้น
            const insertQuery = `
                INSERT INTO menus (system, category, item_name, route_path, icon, sort_order)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            initialMenus.forEach(menu => {
                db.run(insertQuery, [
                    menu.system,
                    menu.category,
                    menu.item_name,
                    menu.route_path,
                    menu.icon,
                    menu.sort_order
                ], (err) => {
                    if (err) {
                        logger.error('Error inserting initial menu:', err.message);
                    }
                });
            });
            logger.info('Initial menus inserted successfully');
        }
    });
}

// ฟังก์ชันสำหรับดึงข้อมูลเมนูทั้งหมด
function getAllMenus() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM menus ORDER BY system, category, sort_order, item_name';
        
        db.all(query, [], (err, rows) => {
            if (err) {
                logger.error('Error getting all menus:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// ฟังก์ชันสำหรับดึงข้อมูลเมนูที่เปิดใช้งาน
function getActiveMenus() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM menus WHERE status = 1 ORDER BY system, category, sort_order, item_name';
        
        db.all(query, [], (err, rows) => {
            if (err) {
                logger.error('Error getting active menus:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// ฟังก์ชันสำหรับดึงข้อมูลเมนูตาม ID
function getMenuById(menuId) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM menus WHERE id = ?';
        
        db.get(query, [menuId], (err, row) => {
            if (err) {
                logger.error('Error getting menu by ID:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// ฟังก์ชันสำหรับดึงข้อมูลเมนูตามระบบ
function getMenusBySystem(system) {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM menus WHERE system = ? ORDER BY category, sort_order, item_name';
        
        db.all(query, [system], (err, rows) => {
            if (err) {
                logger.error('Error getting menus by system:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// ฟังก์ชันสำหรับเพิ่มเมนูใหม่
function addMenu(menuData) {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO menus (system, category, item_name, route_path, icon, status, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.run(query, [
            menuData.system,
            menuData.category,
            menuData.item_name,
            menuData.route_path,
            menuData.icon || '',
            menuData.status || 1,
            menuData.sort_order || 0
        ], function(err) {
            if (err) {
                logger.error('Error adding menu:', err.message);
                reject(err);
            } else {
                logger.info(`Menu added successfully with ID: ${this.lastID}`);
                resolve({ id: this.lastID, ...menuData });
            }
        });
    });
}

// ฟังก์ชันสำหรับแก้ไขเมนู
function editMenu(menuData) {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE menus 
            SET system = ?, category = ?, item_name = ?, route_path = ?, 
                icon = ?, status = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        db.run(query, [
            menuData.system,
            menuData.category,
            menuData.item_name,
            menuData.route_path,
            menuData.icon || '',
            menuData.status || 1,
            menuData.sort_order || 0,
            menuData.menu_id
        ], function(err) {
            if (err) {
                logger.error('Error editing menu:', err.message);
                reject(err);
            } else {
                logger.info(`Menu ${menuData.menu_id} updated successfully`);
                resolve({ id: menuData.menu_id, ...menuData });
            }
        });
    });
}

// ฟังก์ชันสำหรับเปิดใช้งานเมนู
function activateMenu(menuId) {
    return new Promise((resolve, reject) => {
        const query = 'UPDATE menus SET status = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        
        db.run(query, [menuId], function(err) {
            if (err) {
                logger.error('Error activating menu:', err.message);
                reject(err);
            } else {
                logger.info(`Menu ${menuId} activated successfully`);
                resolve({ id: menuId, status: 1 });
            }
        });
    });
}

// ฟังก์ชันสำหรับปิดใช้งานเมนู
function deactivateMenu(menuId) {
    return new Promise((resolve, reject) => {
        const query = 'UPDATE menus SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        
        db.run(query, [menuId], function(err) {
            if (err) {
                logger.error('Error deactivating menu:', err.message);
                reject(err);
            } else {
                logger.info(`Menu ${menuId} deactivated successfully`);
                resolve({ id: menuId, status: 0 });
            }
        });
    });
}

// ฟังก์ชันสำหรับสลับสถานะเมนู
function toggleMenuStatus(menuId) {
    return new Promise((resolve, reject) => {
        const query = 'UPDATE menus SET status = CASE WHEN status = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        
        db.run(query, [menuId], function(err) {
            if (err) {
                logger.error('Error toggling menu status:', err.message);
                reject(err);
            } else {
                logger.info(`Menu ${menuId} status toggled successfully`);
                resolve({ id: menuId });
            }
        });
    });
}

// ฟังก์ชันสำหรับลบเมนู
function deleteMenu(menuId) {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM menus WHERE id = ?';
        
        db.run(query, [menuId], function(err) {
            if (err) {
                logger.error('Error deleting menu:', err.message);
                reject(err);
            } else {
                logger.info(`Menu ${menuId} deleted successfully`);
                resolve({ id: menuId });
            }
        });
    });
}

// ฟังก์ชันสำหรับอัปเดตลำดับการเรียง
function updateMenuSortOrder(menuId, sortOrder) {
    return new Promise((resolve, reject) => {
        const query = 'UPDATE menus SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        
        db.run(query, [sortOrder, menuId], function(err) {
            if (err) {
                logger.error('Error updating menu sort order:', err.message);
                reject(err);
            } else {
                logger.info(`Menu ${menuId} sort order updated to ${sortOrder}`);
                resolve({ id: menuId, sort_order: sortOrder });
            }
        });
    });
}

// ฟังก์ชันสำหรับดึงโครงสร้างเมนู (สำหรับ frontend)
function getMenuStructure() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                system,
                category,
                item_name,
                route_path,
                icon,
                sort_order
            FROM menus 
            WHERE status = 1 
            ORDER BY system, category, sort_order, item_name
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                logger.error('Error getting menu structure:', err.message);
                reject(err);
            } else {
                // จัดรูปแบบข้อมูลสำหรับ frontend
                const menuStructure = {};
                
                rows.forEach(item => {
                    const system = item.system || 'Unknown';
                    const category = item.category || 'Uncategorized';
                    
                    if (!menuStructure[system]) {
                        menuStructure[system] = {
                            icon: 'mdi:menu',
                            label: system,
                            items: {}
                        };
                    }
                    
                    if (!menuStructure[system].items[category]) {
                        menuStructure[system].items[category] = {
                            icon: 'mdi:folder',
                            children: []
                        };
                    }
                    
                    if (item.item_name) {
                        menuStructure[system].items[category].children.push(item.item_name);
                    }
                });
                
                resolve(menuStructure);
            }
        });
    });
}

module.exports = {
    db,
    getAllMenus,
    getActiveMenus,
    getMenuById,
    getMenusBySystem,
    addMenu,
    editMenu,
    activateMenu,
    deactivateMenu,
    toggleMenuStatus,
    deleteMenu,
    updateMenuSortOrder,
    getMenuStructure
}; 