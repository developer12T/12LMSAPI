const express = require('express');
const router = express.Router();
const axios = require('axios');
const { setupLogger } = require('../utils/logger');
const {
    upsertUser,
    getAllUsers: getLocalUsers,
    checkUserAccess,
    deactivateUser
} = require('../config/sqlite');

const logger = setupLogger();

// GET endpoint to fetch users from external chat API and sync with local database
router.get('/', async (req, res) => {
    try {
        logger.info('Fetching users from external chat API');

        const response = await axios.get('http://apps.onetwotrading.co.th/12chat/api/users', {
            timeout: 10000, // 10 second timeout
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': '12LMSAPI/1.0.0'
            }
        });

        logger.info('Successfully fetched users from external API');

        // ตรวจสอบ response format และจัดการข้อมูล
        const externalData = response.data;

        if (externalData && externalData.success && externalData.data) {
            // ถ้า external API ส่งข้อมูลมาในรูปแบบที่ถูกต้อง
            const { data: externalUsers } = externalData.data;

            try {
                // ดึงข้อมูลผู้ใช้จาก SQLite database
                const localUsers = await getLocalUsers();
                const localUsersMap = new Map();

                // สร้าง map ของ local users
                localUsers.forEach(localUser => {
                    localUsersMap.set(localUser.employeeID, localUser);
                });

                // สร้าง set ของ external user IDs
                const externalUserIds = new Set(externalUsers.map(user => user.employeeID));

                // ตรวจสอบและลบผู้ใช้ที่ไม่มีใน external API
                for (const localUser of localUsers) {
                    if (!externalUserIds.has(localUser.employeeID)) {
                        await deactivateUser(localUser.employeeID);
                        logger.info(`User ${localUser.employeeID} deactivated (not found in external API)`);
                    }
                }

                // แปลงข้อมูลให้เป็นรูปแบบที่ต้องการ และ sync กับ SQLite
                const formattedUsers = [];

                for (const user of externalUsers) {
                    const localUser = localUsersMap.get(user.employeeID);

                    // ถ้าเป็นผู้ใช้ใหม่ ให้เพิ่มลงใน database
                    if (!localUser) {
                        await upsertUser(user.employeeID, user.userName, 'User');
                        logger.info(`New user ${user.employeeID} added to local database`);
                    }
                }

                // ดึงข้อมูลล่าสุดจาก database หลังจาก sync
                const updatedLocalUsers = await getLocalUsers();
                const updatedLocalUsersMap = new Map();
                updatedLocalUsers.forEach(localUser => {
                    updatedLocalUsersMap.set(localUser.employeeID, localUser);
                });

                // สร้าง response data
                for (const user of externalUsers) {
                    const currentUser = updatedLocalUsersMap.get(user.employeeID);

                    formattedUsers.push({
                        employeeID: user.employeeID,
                        userName: user.userName,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        fullName: user.fullName,
                        fullNameThai: user.fullNameThai,
                        mail: user.mail,
                        imgUrl: user.imgUrl,
                        positon: user.positon,
                        department: user.department,
                        company: user.company,
                        status: user.status,
                        role: currentUser ? currentUser.role : 'User',
                        hasAccess: currentUser ? currentUser.isActive === 1 : true
                    });
                }

                res.json({
                    success: true,
                    data: formattedUsers
                });

            } catch (dbError) {
                logger.error('Error processing local database:', dbError.message);
                // ถ้าเกิดข้อผิดพลาดกับ database ให้ส่งข้อมูลจาก external API อย่างเดียว
                const formattedUsers = externalUsers.map(user => ({
                    employeeID: user.employeeID,
                    userName: user.userName,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    fullNameThai: user.fullNameThai,
                    mail: user.mail,
                    imgUrl: user.imgUrl,
                    positon: user.positon,
                    department: user.department,
                    company: user.company,
                    status: user.status,
                    role: 'User',
                    hasAccess: false
                }));

                res.json({
                    success: true,
                    data: formattedUsers
                });
            }
        } else {
            // ถ้า response format ไม่ตรงกับที่คาดหวัง
            logger.warn('Unexpected response format from external API:', externalData);
            res.json({
                success: true,
                data: externalData.data || []
            });
        }

    } catch (error) {
        logger.error('Error fetching users from external API:', error.message);

        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            res.status(error.response.status).json({
                success: false,
                error: 'External API Error',
                message: error.response.data || 'External API returned an error',
                status: error.response.status
            });
        } else if (error.request) {
            // The request was made but no response was received
            res.status(503).json({
                success: false,
                error: 'Service Unavailable',
                message: 'External API is not responding',
                details: 'No response received from external service'
            });
        } else {
            // Something happened in setting up the request that triggered an Error
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Failed to make request to external API',
                details: error.message
            });
        }
    }
});

// PUT endpoint to update user role
router.put('/:employeeID/role', async (req, res) => {
    try {
        const { employeeID } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({
                success: false,
                error: 'Role is required'
            });
        }

        // ตรวจสอบว่า role ที่ส่งมาถูกต้อง
        const validRoles = ['User', 'Admin', 'Manager', 'Supervisor', 'NoUse'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role',
                message: 'Role must be one of: User, Admin, Manager, Supervisor, NoUse'
            });
        }

        // ตรวจสอบว่าผู้ใช้มีอยู่ใน database หรือไม่
        const { getUserByEmployeeID, updateUserRole } = require('../config/sqlite');
        const existingUser = await getUserByEmployeeID(employeeID);

        if (!existingUser) {
            // ถ้าไม่มีผู้ใช้ใน database ให้เพิ่มใหม่
            await upsertUser(employeeID, '', role);
            logger.info(`New user ${employeeID} created with role ${role}`);
        } else {
            // ถ้ามีแล้วให้อัปเดต role
            await updateUserRole(employeeID, role);
            logger.info(`User ${employeeID} role updated to ${role}`);
        }

        res.json({
            success: true,
            message: `User ${employeeID} role updated to ${role}`
        });

    } catch (error) {
        logger.error(`Error updating user role:`, error.message);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to update user role'
        });
    }
});

// GET endpoint to check user access
router.get('/:employeeID/access', async (req, res) => {
    try {
        const { employeeID } = req.params;

        const accessInfo = await checkUserAccess(employeeID);

        // ถ้าไม่มีข้อมูลใน database ให้ส่งข้อมูล default
        if (!accessInfo.hasAccess && !accessInfo.role) {
            res.json({
                success: true,
                data: {
                    employeeID,
                    hasAccess: false,
                    role: null,
                    message: 'User not found in local database. Please sync with external API first or set role manually.'
                }
            });
        } else {
            // ตรวจสอบ role NoUse
            let message = null;
            if (accessInfo.role === 'NoUse') {
                message = 'User has NoUse role - access denied';
            }
            
            res.json({
                success: true,
                data: {
                    employeeID,
                    hasAccess: accessInfo.hasAccess,
                    role: accessInfo.role,
                    message: message
                }
            });
        }

    } catch (error) {
        logger.error(`Error checking user access:`, error.message);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to check user access'
        });
    }
});

// POST endpoint to sync specific user from external API
router.post('/:employeeID/sync', async (req, res) => {
    try {
        const { employeeID } = req.params;

        logger.info(`Syncing user ${employeeID} from external API`);

        // ดึงข้อมูลจาก external API
        const response = await axios.get('http://apps.onetwotrading.co.th/12chat/api/users', {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': '12LMSAPI/1.0.0'
            }
        });

        const externalData = response.data;

        if (externalData && externalData.success && externalData.data) {
            const { data: externalUsers } = externalData.data;

            // ค้นหาผู้ใช้ใน external API
            const user = externalUsers.find(u => u.employeeID === employeeID);

            if (user) {
                // เพิ่มหรืออัปเดตผู้ใช้ใน local database
                await upsertUser(user.employeeID, user.userName, 'User');

                // ดึงข้อมูลล่าสุดจาก database
                const { getUserByEmployeeID } = require('../config/sqlite');
                const localUser = await getUserByEmployeeID(employeeID);

                res.json({
                    success: true,
                    message: `User ${employeeID} synced successfully`,
                    data: {
                        employeeID: user.employeeID,
                        userName: user.userName,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        fullName: user.fullName,
                        fullNameThai: user.fullNameThai,
                        mail: user.mail,
                        role: localUser ? localUser.role : 'User',
                        hasAccess: localUser ? localUser.isActive === 1 : true
                    }
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'User Not Found',
                    message: `User ${employeeID} not found in external API`
                });
            }
        } else {
            res.status(500).json({
                success: false,
                error: 'External API Error',
                message: 'Failed to fetch data from external API'
            });
        }

    } catch (error) {
        logger.error(`Error syncing user ${req.params.employeeID}:`, error.message);

        if (error.response) {
            res.status(error.response.status).json({
                success: false,
                error: 'External API Error',
                message: error.response.data || 'External API returned an error'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Internal Server Error',
                message: 'Failed to sync user'
            });
        }
    }
});

module.exports = router; 