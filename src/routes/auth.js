const express = require('express');
const router = express.Router();
const { authenticateLDAP, changeLDAPPasswordExtended, changeLDAPPasswordModify, changeExpiredPassword } = require('../middleware/ldapAuth');
const { authMiddleware } = require('../middleware/ldapAuth');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    const { user, token } = await authenticateLDAP(username, password);
    
    res.json({
      message: 'Login successful',
      user: {
        employeeID: user.employeeID,
        username: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        fullNameThai: user.fullNameThai,
        email: user.mail,
        position: user.position,
        department: user.department,
        company: user.company,
        status: user.status,
        imgUrl: user.imgUrl
      },
      token
    });
  } catch (error) {
    logger.error('Login failed:', error);
    
    // ตรวจสอบว่าเป็นรหัสผ่านหมดอายุหรือไม่
    if (error.message === 'PASSWORD_EXPIRED') {
      return res.status(401).json({
        error: 'PASSWORD_EXPIRED',
        message: 'รหัสผ่านหมดอายุ กรุณาเปลี่ยนรหัสผ่านใหม่',
        code: 'PASSWORD_EXPIRED'
      });
    }
    
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
});

// Change password route (requires authentication)
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const username = req.user.username;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters long'
      });
    }

    // ใช้ LDAP Modify method
    const result = await changeLDAPPasswordModify(username, currentPassword, newPassword);
    logger.info('เปลี่ยนรหัสผ่านสำเร็จด้วย LDAP Modify');
    
    res.json({
      message: 'Password changed successfully',
      success: true
    });
  } catch (error) {
    logger.error('Password change failed:', error);
    res.status(400).json({
      error: 'Password change failed',
      message: error.message
    });
  }
});

// Change expired password route (no authentication required)
router.post('/change-expired-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Username, current password and new password are required'
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters long'
      });
    }

    try {
      // const result = await changeExpiredPasswordRaw(username, currentPassword, newPassword);
      // logger.info('เปลี่ยนรหัสผ่านสำเร็จด้วย Raw LDAP');
      
      // res.json({
      //   message: 'Password changed successfully. Please login again.',
      //   success: true
      // });
      // ลองใช้วิธีแรก: Service Account reset
      const result = await changeExpiredPassword(username, currentPassword, newPassword);
      logger.info('เปลี่ยนรหัสผ่านหมดอายุสำเร็จด้วย Service Account');
      
      res.json({
        message: 'Password changed successfully. Please login again.',
        success: true
      });
    } catch (firstError) {
      logger.warn('วิธีแรกล้มเหลว กำลังลองวิธีทางเลือก:', firstError.message);
      
      // ถ้าเป็นปัญหา Change constructor ลองใช้ Simple Method
      if (firstError.message.includes('modification must be an Attribute') || 
          firstError.message.includes('เตรียมข้อมูลเปลี่ยนรหัสผ่าน')) {
        try {
          const result = await changeExpiredPasswordSimple(username, currentPassword, newPassword);
          logger.info('เปลี่ยนรหัสผ่านหมดอายุสำเร็จด้วย Simple Method');
          
          res.json({
            message: 'Password changed successfully. Please login again.',
            success: true
          });
          return;
        } catch (simpleError) {
          logger.warn('Simple method ล้มเหลว:', simpleError.message);
        }
      }
      
      // ถ้าเป็นปัญหาสิทธิ์ ลองใช้ Extended Operation
      if (firstError.message.includes('ไม่มีสิทธิ์') || firstError.message.includes('Access Rights')) {
        try {
          const result = await changeExpiredPasswordWithExtOp(username, currentPassword, newPassword);
          logger.info('เปลี่ยนรหัสผ่านหมดอายุสำเร็จด้วย Extended Operation');
          
          res.json({
            message: 'Password changed successfully. Please login again.',
            success: true
          });
          return;
        } catch (secondError) {
          logger.error('Extended Operation ล้มเหลว:', secondError.message);
        }
      }
      
      // ถ้าทุกวิธีล้มเหลว
      logger.error('ทุกวิธีล้มเหลว:', firstError.message);
      throw firstError;
    }
  } catch (error) {
    logger.error('Expired password change failed:', error);
    
    // ให้ข้อความที่เข้าใจง่ายแก่ผู้ใช้
    let errorMessage = 'Password change failed';
    
    if (error.message.includes('รหัสผ่านใหม่ไม่ตรงตามนโยบาย')) {
      errorMessage = 'รหัสผ่านใหม่ไม่ตรงตามนโยบายความปลอดภัย (ต้องมีตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ)';
    } else if (error.message.includes('รหัสผ่านใหม่ไม่ตรงตามข้อกำหนด')) {
      errorMessage = 'รหัสผ่านใหม่ไม่ตรงตามข้อกำหนด (อาจซ้ำกับรหัสผ่านเก่า หรือความยาวไม่เพียงพอ)';
    } else if (error.message.includes('ไม่พบผู้ใช้')) {
      errorMessage = 'ไม่พบผู้ใช้ในระบบ';
    } else if (error.message.includes('รหัสผ่านยังไม่หมดอายุ')) {
      errorMessage = 'รหัสผ่านยังไม่หมดอายุ';
    } else if (error.message.includes('ไม่มีสิทธิ์')) {
      errorMessage = 'ระบบไม่มีสิทธิ์ในการเปลี่ยนรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ';
    } else if (error.message.includes('modification must be an Attribute')) {
      errorMessage = 'เกิดข้อผิดพลาดทางเทคนิค กรุณาติดต่อผู้ดูแลระบบ';
    } else if (error.message.includes('เตรียมข้อมูลเปลี่ยนรหัสผ่าน')) {
      errorMessage = 'เกิดข้อผิดพลาดในการเตรียมข้อมูล กรุณาลองใหม่อีกครั้ง';
    }
    
    res.status(400).json({
      error: errorMessage,
      details: error.message
    });
  }
});

// Optional: Add a route to verify token
router.get('/verify', (req, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user
  });
});

module.exports = router; 