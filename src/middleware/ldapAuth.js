const ldap = require('ldapjs');
const jwt = require('jsonwebtoken');
const { setupLogger } = require('../utils/logger');

const Attribute = ldap.Attribute;
const Change = ldap.Change;

const logger = setupLogger();

const LDAP_BASE_DN = process.env.LDAP_BASE_DN;
const LDAP_BIND_DN = process.env.LDAP_BIND_DN;
const LDAP_BIND_PASSWORD = process.env.LDAP_BIND_PASSWORD;

// เพิ่มฟังก์ชันสำหรับแปลงข้อมูล
function transformEntryFormat(entries) {
  return entries.map(entry => {
    // สร้าง object เก็บข้อมูลชั่วคราว
    const tempEntry = {};
    entry.forEach(attr => {
      if (attr.values && attr.values.length > 0) {
        // แปลงชื่อ key ตามที่ต้องการ
        switch(attr.type) {
          case 'employeeID':
            tempEntry.employeeID = attr.values[0];
            break;
          case 'sAMAccountName':
            tempEntry.userName = attr.values[0];
            break;
          case 'givenName':
            tempEntry.firstName = attr.values[0];
            break;
          case 'sn':
            tempEntry.lastName = attr.values[0];
            break;
          case 'displayName':
            tempEntry.fullName = attr.values[0];
            break;
          case 'description':
            tempEntry.fullNameThai = attr.values[0];
            break;
          case 'mail':
            tempEntry.mail = attr.values[0];
            break;  
          case 'dn':
            tempEntry.dn = attr.values[0];
            break;
          case 'title':
            tempEntry.title = attr.values[0];
            break;
          case 'department':
            tempEntry.department = attr.values[0];
            break;
          case 'company':
            tempEntry.company = attr.values[0];
            break;
          case 'distinguishedName':
            tempEntry.distinguishedName = extractOU(attr.values[0]) == 'User Resign' ? 0 : 1;
            break;
        }
      }
    });

    // สร้าง object ใหม่ตามลำดับที่ต้องการ
    return {
      employeeID: tempEntry.employeeID ?? null,
      userName: tempEntry.userName ?? null,
      firstName: tempEntry.firstName ?? null,
      lastName: tempEntry.lastName ?? null,
      fullName: tempEntry.fullName ?? null,
      fullNameThai: tempEntry.fullNameThai ?? null,
      mail: tempEntry.mail ?? null,
      imgUrl: `http://58.181.206.156:8080/12Trading/HR/assets/imgs/employee_picture/${tempEntry.employeeID}.jpg`,
      position: tempEntry.title ?? null,
      department: tempEntry.department ?? null,
      company: tempEntry.company ?? null,
      status: tempEntry.distinguishedName ?? 0,
    };
  });
}

// เพิ่มฟังก์ชันสำหรับกรองข้อมูล
function filterEntriesWithEmployeeID(entries) {
  return entries.filter(entry => {
    // ตรวจสอบว่ามี employeeID หรือไม่
    return entry.some(attr => attr.type === 'employeeID' && attr.values && attr.values.length > 0);
  });
}

// Function to extract OU from distinguishedName
function extractOU(dn) {
  const ouMatch = dn.match(/OU=([^,]+)/);
  return ouMatch ? ouMatch[1] : null;
}

async function authenticateLDAP(username, password) {
  return new Promise(async (resolve, reject) => {
    logger.info('เริ่มการตรวจสอบ LDAP สำหรับผู้ใช้:', username);
    
    // สร้างการเชื่อมต่อ LDAP
    const client = ldap.createClient({
      url: process.env.LDAP_URL,
      timeout: 5000,
      connectTimeout: 10000
    });
    
    // เพิ่ม event handlers สำหรับการดูข้อผิดพลาด
    client.on('error', (err) => {
      logger.error('LDAP client error:', err);
    }); 
    
    client.on('connectError', (err) => {
      logger.error('LDAP connection error:', err);
    });

    // ขั้นตอนที่ 2: เชื่อมต่อด้วย service account
    logger.info('กำลังทำการ Bind กับ:', LDAP_BIND_DN);
    client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (bindErr) => {
      if (bindErr) {
        logger.error('LDAP service bind error:', bindErr);
        client.unbind();
        reject(new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับบริการ LDAP: ' + bindErr.message));
        return;
      }
      
      logger.info('Bind สำเร็จ กำลังค้นหาผู้ใช้...');

      // ใช้ filter ที่รวมทุกเงื่อนไขเลย
      const userFilter = `(&(objectClass=user)(|(sAMAccountName=${username})(userPrincipalName=${username}@onetwotrading.co.th)(mail=${username}@onetwotrading.co.th)))`;
      
      const opts = {
        filter: userFilter,
        scope: 'sub',
        attributes: ['employeeID','sAMAccountName','givenName','sn','displayName','description','mail','userPrincipalName','title','department','company','distinguishedName']
      }; 

      client.search(LDAP_BASE_DN, opts, (searchErr, res) => {
        if (searchErr) {
          logger.error('LDAP search error:', searchErr);
          client.unbind();
          reject(new Error('เกิดข้อผิดพลาดในการค้นหาผู้ใช้: ' + searchErr.message));
          return;
        }

        let userDN = null;
        const entries = [];

        res.on('searchEntry', (entry) => {
          // แปลง DN object เป็น string
          const dnString = entry.objectName.toString();
          entries.push(entry.pojo.attributes);
          userDN = dnString;
        });

        res.on('error', (err) => {
          logger.error('Search error:', err);
        });

        res.on('end', () => {
          if (!userDN) {
            logger.warn('ไม่พบผู้ใช้ในระบบ');
            client.unbind();
            reject(new Error('ไม่พบผู้ใช้ในระบบ'));
            return;
          }

          // logger.info('พบผู้ใช้:', userDN);
 
          // ตรวจสอบรหัสผ่านด้วย DN ที่พบ
          verifyPassword(client, userDN, password, entries, resolve, reject);
        });
      });
    });
  });
}

// แยกฟังก์ชันตรวจสอบรหัสผ่านออกมา
function verifyPassword(client, userDN, password, entries, resolve, reject) {
  logger.info('กำลังตรวจสอบรหัสผ่านสำหรับ DN:', userDN);
   
  // ปิดการเชื่อมต่อเก่าก่อนทำการ bind ใหม่
  client.unbind((unbindErr) => {
    if (unbindErr) {
      logger.error('Error unbinding:', unbindErr);
    }
    
    // สร้างการเชื่อมต่อใหม่
    const newClient = ldap.createClient({
      url: process.env.LDAP_URL,
      timeout: 5000,
      connectTimeout: 10000
    });

    // ทำการ bind ด้วย DN ของผู้ใช้
    newClient.bind(userDN, password, (userBindErr) => {
      if (userBindErr) {
        logger.error('รหัสผ่านไม่ถูกต้อง:', userBindErr);
        
        newClient.unbind();
        reject(new Error('รหัสผ่านไม่ถูกต้อง'));
        return;
      }

      logger.info('รหัสผ่านถูกต้อง');
      
      // กรองและแปลงข้อมูล
      const filteredEntries = filterEntriesWithEmployeeID(entries);
      const transformedEntries = transformEntryFormat(filteredEntries);
      
      if (transformedEntries.length === 0) {
        newClient.unbind();
        reject(new Error('ไม่พบข้อมูลผู้ใช้ที่ถูกต้อง'));
        return;
      }

      const user = transformedEntries[0];
      
      // สร้าง JWT token
      const token = jwt.sign(
        { 
          username: user.userName,
          employeeID: user.employeeID,
          email: user.mail,
          fullName: user.fullName,
          department: user.department,
          company: user.company,
          status: user.status
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      newClient.unbind();
      resolve({ user, token });
    });
  });
}

// ฟังก์ชันเปลี่ยนรหัสผ่านด้วย LDAP Modify (สำหรับ Active Directory)
async function changePasswordWithExtendedOperation(username, newPassword) {
  return new Promise((resolve, reject) => {
    logger.info('เริ่มการเปลี่ยนรหัสผ่านด้วย LDAP Modify สำหรับผู้ใช้:', username);
    
    const client = ldap.createClient({
      url: process.env.LDAP_URL,
      timeout: 5000,
      connectTimeout: 10000
    });
    
    client.on('error', (err) => {
      logger.error('LDAP client error:', err);
    });
    
    client.on('connectError', (err) => {
      logger.error('LDAP connection error:', err);
    });

    // ขั้นตอนที่ 1: เชื่อมต่อด้วย Service Account
    client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (bindErr) => {
      if (bindErr) {
        logger.error('LDAP service bind error:', bindErr);
        client.unbind();
        reject(new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับบริการ LDAP: ' + bindErr.message));
        return;
      }
      
      logger.info('Service Account bind สำเร็จ กำลังค้นหาผู้ใช้...');
      
      const userFilter = `(&(objectClass=user)(|(sAMAccountName=${username})(userPrincipalName=${username}@onetwotrading.co.th)(mail=${username}@onetwotrading.co.th)))`;
      
      const opts = {
        filter: userFilter,
        scope: 'sub',
        attributes: ['distinguishedName']
      };

      client.search(LDAP_BASE_DN, opts, (searchErr, res) => {
        if (searchErr) {
          logger.error('LDAP search error:', searchErr);
          client.unbind();
          reject(new Error('เกิดข้อผิดพลาดในการค้นหาผู้ใช้: ' + searchErr.message));
          return;
        }

        let userDN = null;

        res.on('searchEntry', (entry) => {
          userDN = entry.objectName.toString();
        });

        res.on('error', (err) => {
          logger.error('Search error:', err);
        });

        res.on('end', () => {
          if (!userDN) {
            logger.warn('ไม่พบผู้ใช้ในระบบ');
            client.unbind();
            reject(new Error('ไม่พบผู้ใช้ในระบบ'));
            return;
          }

          logger.info('พบผู้ใช้:', userDN);
          
          // ใช้ LDAP Modify สำหรับเปลี่ยนรหัสผ่าน
          performLDAPModifyPasswordChange(client, userDN, newPassword, resolve, reject);
        });
      });
    });
  });
}

// ฟังก์ชันเปลี่ยนรหัสผ่านแบบเดิม (LDAP Modify)
async function changeLDAPPasswordModify(username, currentPassword, newPassword) {
  return new Promise((resolve, reject) => {
    logger.info('เริ่มการเปลี่ยนรหัสผ่านด้วย LDAP Modify สำหรับผู้ใช้:', username);
    
    const client = ldap.createClient({
      url: process.env.LDAP_URL,
      timeout: 5000,
      connectTimeout: 10000
    });
    
    client.on('error', (err) => {
      logger.error('LDAP client error:', err);
    });
    
    client.on('connectError', (err) => {
      logger.error('LDAP connection error:', err);
    });

    // ขั้นตอนที่ 1: ค้นหาผู้ใช้
    client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (bindErr) => {
      if (bindErr) {
        logger.error('LDAP service bind error:', bindErr);
        client.unbind();
        reject(new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับบริการ LDAP: ' + bindErr.message));
        return;
      }
      
      const userFilter = `(&(objectClass=user)(|(sAMAccountName=${username})(userPrincipalName=${username}@onetwotrading.co.th)(mail=${username}@onetwotrading.co.th)))`;
      
      const opts = {
        filter: userFilter,
        scope: 'sub',
        attributes: ['distinguishedName']
      };

      client.search(LDAP_BASE_DN, opts, (searchErr, res) => {
        if (searchErr) {
          logger.error('LDAP search error:', searchErr);
          client.unbind();
          reject(new Error('เกิดข้อผิดพลาดในการค้นหาผู้ใช้: ' + searchErr.message));
          return;
        }

        let userDN = null;

        res.on('searchEntry', (entry) => {
          userDN = entry.objectName.toString();
        });

        res.on('error', (err) => {
          logger.error('Search error:', err);
        });

        res.on('end', () => {
          if (!userDN) {
            logger.warn('ไม่พบผู้ใช้ในระบบ');
            client.unbind();
            reject(new Error('ไม่พบผู้ใช้ในระบบ'));
            return;
          }
 
          // ตรวจสอบรหัสผ่านเก่าก่อน
          verifyAndChangePasswordModify(client, userDN, currentPassword, newPassword, resolve, reject);
        });
      });
    });
  });
}

// ฟังก์ชันตรวจสอบรหัสผ่านเก่าและเปลี่ยนรหัสผ่านใหม่ (LDAP Modify)
function verifyAndChangePasswordModify(client, userDN, currentPassword, newPassword, resolve, reject) {
  logger.info('กำลังตรวจสอบรหัสผ่านเก่าและเปลี่ยนรหัสผ่านใหม่สำหรับ DN:', userDN);
  
  // ปิดการเชื่อมต่อเก่า
  client.unbind((unbindErr) => {
    if (unbindErr) {
      logger.error('Error unbinding:', unbindErr);
    }
    
    // สร้างการเชื่อมต่อใหม่
    const newClient = ldap.createClient({
      url: process.env.LDAP_URL,
      timeout: 5000,
      connectTimeout: 10000
    });

    // ทำการ bind ด้วยรหัสผ่านเก่า
    newClient.bind(userDN, currentPassword, (userBindErr) => {
      if (userBindErr) {
        logger.error('รหัสผ่านเก่าไม่ถูกต้อง:', userBindErr);
        newClient.unbind();
        reject(new Error('รหัสผ่านเก่าไม่ถูกต้อง'));
        return;
      }

      logger.info('รหัสผ่านเก่าถูกต้อง กำลังเปลี่ยนรหัสผ่านใหม่...');
      
      try {
        // สร้าง Attribute object สำหรับ unicodePwd
        const unicodePwdAttr = new Attribute({
          type: 'unicodePwd',
          values: [Buffer.from(`"${newPassword}"`, 'utf16le')]
        });

        // เปลี่ยนรหัสผ่าน
        const change = new Change({
          operation: 'replace',
          modification: unicodePwdAttr
        });

        newClient.modify(userDN, change, (modifyErr) => {
          if (modifyErr) {
            logger.error('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน:', modifyErr);
            newClient.unbind();
            reject(new Error('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน: ' + modifyErr.message));
            return;
          }

          logger.info('เปลี่ยนรหัสผ่านสำเร็จด้วย LDAP Modify');
          newClient.unbind();
          resolve({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
        });
        
      } catch (error) {
        logger.error('เกิดข้อผิดพลาดในการสร้าง Change object:', error);
        newClient.unbind();
        reject(new Error('เกิดข้อผิดพลาดในการเตรียมข้อมูลเปลี่ยนรหัสผ่าน: ' + error.message));
      }
    });
  });
}

// ฟังก์ชันตรวจสอบรหัสผ่านหมดอายุจาก user attributes
async function checkPasswordExpiration(username) {
  return new Promise((resolve, reject) => {
    logger.info('กำลังตรวจสอบรหัสผ่านหมดอายุสำหรับผู้ใช้:', username);
    
    const client = ldap.createClient({
      url: process.env.LDAP_URL,
      timeout: 5000,
      connectTimeout: 10000
    });
    
    client.on('error', (err) => {
      logger.error('LDAP client error:', err);
    });
    
    client.on('connectError', (err) => {
      logger.error('LDAP connection error:', err);
    });

    client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (bindErr) => {
      if (bindErr) {
        logger.error('LDAP service bind error:', bindErr);
        client.unbind();
        reject(new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับบริการ LDAP: ' + bindErr.message));
        return;
      }
      
      const userFilter = `(&(objectClass=user)(|(sAMAccountName=${username})(userPrincipalName=${username}@onetwotrading.co.th)(mail=${username}@onetwotrading.co.th)))`;
      
      const opts = {
        filter: userFilter,
        scope: 'sub',
        attributes: [
          'pwdLastSet',
          'userAccountControl',
          'maxPwdAge',
          'pwdExpires',
          'accountExpires',
          'lockoutTime'
        ]
      };

      client.search(LDAP_BASE_DN, opts, (searchErr, res) => {
        if (searchErr) {
          logger.error('LDAP search error:', searchErr);
          client.unbind();
          reject(new Error('เกิดข้อผิดพลาดในการค้นหาผู้ใช้: ' + searchErr.message));
          return;
        }

        let userEntry = null;

        res.on('searchEntry', (entry) => {
          userEntry = entry.pojo.attributes;
        });

        res.on('error', (err) => {
          logger.error('Search error:', err);
        });

        res.on('end', () => {
          client.unbind();
          
          if (!userEntry) {
            reject(new Error('ไม่พบผู้ใช้ในระบบ'));
            return;
          }

          // ตรวจสอบ password expiration
          const isExpired = checkPasswordExpirationFromAttributes(userEntry);
          resolve({ isExpired });
        });
      });
    });
  });
}

// ฟังก์ชันตรวจสอบ password expiration จาก attributes
function checkPasswordExpirationFromAttributes(attributes) {
  try {
    // หา pwdLastSet attribute
    const pwdLastSetAttr = attributes.find(attr => attr.type === 'pwdLastSet');
    const userAccountControlAttr = attributes.find(attr => attr.type === 'userAccountControl');
    const maxPwdAgeAttr = attributes.find(attr => attr.type === 'maxPwdAge');
    
    if (!pwdLastSetAttr || !pwdLastSetAttr.values || pwdLastSetAttr.values.length === 0) {
      logger.info('ไม่พบ pwdLastSet attribute');
      return false;
    }

    const pwdLastSet = parseInt(pwdLastSetAttr.values[0]);
    
    // ถ้า pwdLastSet เป็น 0 แสดงว่า password หมดอายุ
    if (pwdLastSet === 0) {
      logger.info('pwdLastSet เป็น 0 - รหัสผ่านหมดอายุ');
      return true;
    }

    // ตรวจสอบ userAccountControl
    if (userAccountControlAttr && userAccountControlAttr.values && userAccountControlAttr.values.length > 0) {
      const userAccountControl = parseInt(userAccountControlAttr.values[0]);
      
      // ตรวจสอบ DONT_EXPIRE_PASSWORD flag (0x10000)
      if (userAccountControl & 0x10000) {
        logger.info('รหัสผ่านไม่หมดอายุ (DONT_EXPIRE_PASSWORD flag)');
        return false;
      }
      
      // ตรวจสอบ PASSWORD_EXPIRED flag (0x800000)
      if (userAccountControl & 0x800000) {
        logger.info('ตรวจพบ PASSWORD_EXPIRED flag');
        return true;
      }
    }

    // คำนวณอายุของรหัสผ่าน
    const pwdLastSetDate = new Date((pwdLastSet - 116444736000000000) / 10000);
    const currentDate = new Date();
    const daysSinceLastSet = Math.floor((currentDate - pwdLastSetDate) / (1000 * 60 * 60 * 24));
    
    logger.info('วันที่ตั้งรหัสผ่านล่าสุด:', pwdLastSetDate);
    logger.info('จำนวนวันที่ผ่านมา:', daysSinceLastSet);

    // ถ้า maxPwdAge ไม่ได้ตั้งค่า (ไม่มีข้อจำกัดอายุ)
    if (!maxPwdAgeAttr || !maxPwdAgeAttr.values || maxPwdAgeAttr.values.length === 0) {
      logger.info('ไม่มีการจำกัดอายุรหัสผ่าน');
      return false;
    }

    const maxPwdAge = parseInt(maxPwdAgeAttr.values[0]);
    const maxPwdAgeDays = Math.abs(maxPwdAge) / (10000000 * 60 * 60 * 24);
    
    logger.info('อายุรหัสผ่านสูงสุด (วัน):', maxPwdAgeDays);
    logger.info('อายุรหัสผ่านปัจจุบัน (วัน):', daysSinceLastSet);

    if (daysSinceLastSet >= maxPwdAgeDays) {
      logger.info('รหัสผ่านหมดอายุแล้ว');
      return true;
    }

    return false;
  } catch (error) {
    logger.error('เกิดข้อผิดพลาดในการตรวจสอบ password expiration:', error);
    return false;
  }
}

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.error('Authentication middleware error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ฟังก์ชันเปลี่ยนรหัสผ่านที่หมดอายุ
async function changeExpiredPassword(username, currentPassword, newPassword) {
  return new Promise((resolve, reject) => {
    logger.info('เริ่มการเปลี่ยนรหัสผ่านที่หมดอายุสำหรับผู้ใช้:', username);
    
    const client = ldap.createClient({
      url: process.env.LDAP_URL,
      timeout: 10000,
      connectTimeout: 15000
    });
    
    client.on('error', (err) => {
      logger.error('LDAP client error:', err);
    });
    
    client.on('connectError', (err) => {
      logger.error('LDAP connection error:', err);
    });

    // ขั้นตอนที่ 1: หาข้อมูลผู้ใช้ด้วย Service Account
    client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (bindErr) => {
      if (bindErr) {
        logger.error('LDAP service bind error:', bindErr);
        client.unbind();
        reject(new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับบริการ LDAP: ' + bindErr.message));
        return;
      }
      
      const userFilter = `(&(objectClass=user)(|(sAMAccountName=${username})(userPrincipalName=${username}@onetwotrading.co.th)(mail=${username}@onetwotrading.co.th)))`;
      
      const opts = {
        filter: userFilter,
        scope: 'sub',
        attributes: ['distinguishedName', 'pwdLastSet', 'userAccountControl']
      };

      client.search(LDAP_BASE_DN, opts, (searchErr, res) => {
        if (searchErr) {
          logger.error('LDAP search error:', searchErr);
          client.unbind();
          reject(new Error('เกิดข้อผิดพลาดในการค้นหาผู้ใช้: ' + searchErr.message));
          return;
        }

        let userDN = null;
        let userAttributes = null;

        res.on('searchEntry', (entry) => {
          userDN = entry.objectName.toString();
          userAttributes = entry.pojo.attributes;
        });

        res.on('error', (err) => {
          logger.error('Search error:', err);
        });

        res.on('end', () => {
          if (!userDN) {
            logger.warn('ไม่พบผู้ใช้ในระบบ');
            client.unbind();
            reject(new Error('ไม่พบผู้ใช้ในระบบ'));
            return;
          }

          logger.info('พบผู้ใช้:', userDN);
          
          // ตรวจสอบว่ารหัสผ่านหมดอายุจริงหรือไม่
          const isExpired = checkPasswordExpirationFromAttributes(userAttributes);
          if (!isExpired) {
            client.unbind();
            reject(new Error('รหัสผ่านยังไม่หมดอายุ'));
            return;
          }
          
          logger.info('ยืนยันว่ารหัสผ่านหมดอายุแล้ว กำลังทำการ reset รหัสผ่านด้วย Service Account...');
          
          // ขั้นตอนที่ 2: ทำการ reset รหัสผ่านโดยตรงด้วย Service Account (ไม่ต้อง authenticate ด้วยรหัสผ่านเก่า)
          performExpiredPasswordReset(client, userDN, newPassword, resolve, reject);
        });
      });
    });
  });
}

// เพิ่มฟังก์ชันใหม่ - authenticate ด้วยผู้ใช้เองและเปลี่ยนรหัสผ่าน
function authenticateUserAndChangePassword(userDN, currentPassword, newPassword, resolve, reject) {
  logger.info('กำลัง authenticate ด้วยผู้ใช้เองและเปลี่ยนรหัสผ่าน');
  
  // สร้างการเชื่อมต่อสำหรับผู้ใช้
  const userClient = ldap.createClient({
    url: process.env.LDAP_URL,
    timeout: 10000,
    connectTimeout: 15000
  });

  userClient.on('error', (err) => {
    logger.error('User LDAP client error:', err);
  });

  // ลอง bind ด้วยรหัสผ่านเก่า
  userClient.bind(userDN, currentPassword, (userBindErr) => {
    if (userBindErr) {
      logger.error('ไม่สามารถ authenticate ด้วยรหัสผ่านเก่าได้:', userBindErr);
      userClient.unbind();
      
      // ตรวจสอบว่าเป็นเพราะรหัสผ่านหมดอายุหรือไม่
      if (userBindErr.code === 49) {
        reject(new Error('รหัสผ่านเก่าไม่ถูกต้อง หรือบัญชีถูกล็อค'));
      } else {
        reject(new Error('ไม่สามารถเชื่อมต่อด้วยรหัสผ่านเก่าได้: ' + userBindErr.message));
      }
      return;
    }

    logger.info('Authenticate ด้วยผู้ใช้เองสำเร็จ กำลังเปลี่ยนรหัสผ่าน...');
    
    // ทำการเปลี่ยนรหัสผ่านด้วยสิทธิ์ของผู้ใช้เอง
    changePasswordWithUserRights(userClient, userDN, newPassword, resolve, reject);
  });
}

// เพิ่มฟังก์ชันใหม่ - เปลี่ยนรหัสผ่านด้วยสิทธิ์ของผู้ใช้เอง
function changePasswordWithUserRights(client, userDN, newPassword, resolve, reject) {
  logger.info('กำลังเปลี่ยนรหัสผ่านด้วยสิทธิ์ของผู้ใช้เอง');
  
  try {
    // ลองใช้ unicodePwd ก่อน (สำหรับ Active Directory)
    const change = new Change({
      operation: 'replace',
      modification: {
        unicodePwd: [Buffer.from(`"${newPassword}"`, 'utf16le')]
      }
    });

    client.modify(userDN, change, (modifyErr) => {
      if (modifyErr) {
        logger.warn('การเปลี่ยนด้วย unicodePwd ล้มเหลว:', modifyErr);
        
        // ลองใช้ userPassword (สำหรับ LDAP ทั่วไป)
        const userPasswordChange = new Change({
          operation: 'replace',
          modification: {
            userPassword: [newPassword]
          }
        });

        client.modify(userDN, userPasswordChange, (userPwdErr) => {
          client.unbind();
          
          if (userPwdErr) {
            logger.error('การเปลี่ยนด้วย userPassword ก็ล้มเหลว:', userPwdErr);
            
            // แปล error codes เป็นข้อความที่เข้าใจง่าย
            if (userPwdErr.code === 53) {
              reject(new Error('รหัสผ่านใหม่ไม่ตรงตามนโยบาย (ต้องมีตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ)'));
            } else if (userPwdErr.code === 19) {
              reject(new Error('รหัสผ่านใหม่ไม่ตรงตามข้อกำหนด (อาจซ้ำกับรหัสผ่านเก่า หรือความยาวไม่เพียงพอ)'));
            } else if (userPwdErr.code === 50) {
              reject(new Error('ไม่มีสิทธิ์ในการเปลี่ยนรหัสผ่าน'));
            } else {
              reject(new Error('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน: ' + userPwdErr.message));
            }
            return;
          }

          logger.info('เปลี่ยนรหัสผ่านสำเร็จด้วย userPassword');
          resolve({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
        });
        return;
      }

      client.unbind();
      logger.info('เปลี่ยนรหัสผ่านสำเร็จด้วย unicodePwd');
      resolve({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    });
    
  } catch (error) {
    logger.error('เกิดข้อผิดพลาดในการสร้าง Change object:', error);
    client.unbind();
    reject(new Error('เกิดข้อผิดพลาดในการเตรียมข้อมูลเปลี่ยนรหัสผ่าน: ' + error.message));
  }
}

// ฟังก์ชันดึงข้อมูลผู้ใช้และสถานะรหัสผ่าน
async function getUserInfo(username) {
  return new Promise((resolve, reject) => {
    logger.info('กำลังดึงข้อมูลผู้ใช้:', username);
    
    const client = ldap.createClient({
      url: process.env.LDAP_URL,
      timeout: 5000,
      connectTimeout: 10000
    });
    
    client.on('error', (err) => {
      logger.error('LDAP client error:', err);
    });
    
    client.on('connectError', (err) => {
      logger.error('LDAP connection error:', err);
    });

    client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (bindErr) => {
      if (bindErr) {
        logger.error('LDAP service bind error:', bindErr);
        client.unbind();
        reject(new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับบริการ LDAP: ' + bindErr.message));
        return;
      }
      
      const userFilter = `(&(objectClass=user)(|(sAMAccountName=${username})(userPrincipalName=${username}@onetwotrading.co.th)(mail=${username}@onetwotrading.co.th)))`;
      
      const opts = {
        filter: userFilter,
        scope: 'sub',
        attributes: [
          'distinguishedName',
          'sAMAccountName',
          'userPrincipalName',
          'mail',
          'displayName',
          'givenName',
          'sn',
          'cn',
          'employeeID',
          'title',
          'department',
          'company',
          'pwdLastSet',
          'userAccountControl',
          'maxPwdAge',
          'pwdExpires',
          'accountExpires',
          'lockoutTime'
        ]
      };

      client.search(LDAP_BASE_DN, opts, (searchErr, res) => {
        if (searchErr) {
          logger.error('LDAP search error:', searchErr);
          client.unbind();
          reject(new Error('เกิดข้อผิดพลาดในการค้นหาผู้ใช้: ' + searchErr.message));
          return;
        }

        let userEntry = null;

        res.on('searchEntry', (entry) => {
          userEntry = entry.pojo.attributes;
        });

        res.on('error', (err) => {
          logger.error('Search error:', err);
        });

        res.on('end', () => {
          client.unbind();
          
          if (!userEntry) {
            reject(new Error('ไม่พบผู้ใช้ในระบบ'));
            return;
          }

          // สร้าง user object
          const user = {};
          userEntry.forEach(attr => {
            if (attr.values && attr.values.length > 0) {
              user[attr.type] = attr.values[0];
            }
          });

          // ตรวจสอบ password expiration
          const passwordExpired = checkPasswordExpirationFromAttributes(userEntry);
          
          resolve({
            ...user,
            passwordExpired
          });
        });
      });
    });
  });
}

// แทนที่ฟังก์ชัน performExpiredPasswordReset เดิม - ไม่ใช้ Change constructor
function performExpiredPasswordReset(client, userDN, newPassword, resolve, reject) {
  logger.info('กำลังทำการ reset รหัสผ่านที่หมดอายุสำหรับ DN:', userDN);
  
  try {
    // Method 1: ใช้ array ของ plain objects (ไม่ใช้ Change constructor)
    const changes1 = [
      {
        operation: 'replace',
        modification: {
          unicodePwd: [Buffer.from(`"${newPassword}"`, 'utf16le')]
        }
      }
    ];

    client.modify(userDN, changes1, (err1) => {
      if (err1) {
        logger.warn('Method 1 ล้มเหลว:', err1);
        
        // Method 2: ลองใช้ userPassword
        const changes2 = [
          {
            operation: 'replace',
            modification: {
              userPassword: [newPassword]
            }
          }
        ];

        client.modify(userDN, changes2, (err2) => {
          if (err2) {
            logger.warn('Method 2 ล้มเหลว:', err2);
            
            // Method 3: ลองใช้ single object
            const change3 = {
              operation: 'replace',
              modification: {
                userPassword: newPassword
              }
            };

            client.modify(userDN, change3, (err3) => {
              if (err3) {
                logger.warn('Method 3 ล้มเหลว:', err3);
                
                // Method 4: ลองใช้ attribute style
                const change4 = {
                  type: 'replace',
                  vals: [newPassword]
                };

                client.modify(userDN, { userPassword: change4 }, (err4) => {
                  if (err4) {
                    logger.warn('Method 4 ล้มเหลว:', err4);
                    
                    // Method 5: ลองใช้ direct attribute replacement
                    const attributes = {
                      userPassword: newPassword
                    };

                    client.modify(userDN, attributes, (err5) => {
                      if (err5) {
                        logger.error('ทุกวิธีล้มเหลว:', err5);
                        client.unbind();
                        
                        // แปล error codes
                        if (err5.code === 50) {
                          reject(new Error('ไม่มีสิทธิ์ในการเปลี่ยนรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ'));
                        } else if (err5.code === 53) {
                          reject(new Error('รหัสผ่านใหม่ไม่ตรงตามนโยบาย (ต้องมีตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ)'));
                        } else if (err5.code === 19) {
                          reject(new Error('รหัสผ่านใหม่ไม่ตรงตามข้อกำหนด (อาจซ้ำกับรหัสผ่านเก่า หรือความยาวไม่เพียงพอ)'));
                        } else {
                          reject(new Error('ไม่สามารถเปลี่ยนรหัสผ่านได้: ' + err5.message));
                        }
                        return;
                      }

                      logger.info('เปลี่ยนรหัสผ่านสำเร็จด้วย Method 5');
                      activateNewPasswordSimple(client, userDN, resolve, reject);
                    });
                    return;
                  }

                  logger.info('เปลี่ยนรหัสผ่านสำเร็จด้วย Method 4');
                  activateNewPasswordSimple(client, userDN, resolve, reject);
                });
                return;
              }

              logger.info('เปลี่ยนรหัสผ่านสำเร็จด้วย Method 3');
              activateNewPasswordSimple(client, userDN, resolve, reject);
            });
            return;
          }

          logger.info('เปลี่ยนรหัสผ่านสำเร็จด้วย Method 2');
          activateNewPasswordSimple(client, userDN, resolve, reject);
        });
        return;
      }

      logger.info('เปลี่ยนรหัสผ่านสำเร็จด้วย Method 1');
      activateNewPasswordSimple(client, userDN, resolve, reject);
    });
    
  } catch (error) {
    logger.error('เกิดข้อผิดพลาดในการเตรียมข้อมูล:', error);
    client.unbind();
    reject(new Error('เกิดข้อผิดพลาดในการเตรียมข้อมูลเปลี่ยนรหัสผ่าน: ' + error.message));
  }
}

function activateNewPassword(client, userDN, resolve, reject) {
  logger.info('กำลัง activate รหัสผ่านใหม่...');
  
  try {
    // Set pwdLastSet เป็น -1 เพื่อให้รหัสผ่านมีผลทันที
    const activateChange = new Change({
      operation: 'replace',
      modification: {
        pwdLastSet: ['-1']
      }
    });

    client.modify(userDN, activateChange, (activateErr) => {
      client.unbind();
      
      if (activateErr) {
        logger.warn('ไม่สามารถ activate รหัสผ่านได้:', activateErr);
        // ไม่ reject เพราะรหัสผ่านเปลี่ยนแล้ว
      }

      logger.info('เปลี่ยนรหัสผ่านที่หมดอายุสำเร็จ');
      resolve({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    });
    
  } catch (error) {
    logger.warn('เกิดข้อผิดพลาดในการ activate รหัสผ่าน:', error);
    client.unbind();
    // ไม่ reject เพราะรหัสผ่านเปลี่ยนแล้ว
    resolve({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ (แต่ไม่สามารถ activate ได้)' });
  }
}

function activateNewPasswordSimple(client, userDN, resolve, reject) {
  logger.info('กำลัง activate รหัสผ่านใหม่...');
  
  try {
    // ลองใช้ array แบบง่าย
    const activateChanges = [
      {
        operation: 'replace',
        modification: {
          pwdLastSet: ['-1']
        }
      }
    ];

    client.modify(userDN, activateChanges, (activateErr) => {
      client.unbind();
      
      if (activateErr) {
        logger.warn('ไม่สามารถ activate รหัสผ่านได้:', activateErr);
        // ไม่ reject เพราะรหัสผ่านเปลี่ยนแล้ว
      }

      logger.info('เปลี่ยนรหัสผ่านที่หมดอายุสำเร็จ');
      resolve({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    });
    
  } catch (error) {
    logger.warn('เกิดข้อผิดพลาดในการ activate รหัสผ่าน:', error);
    client.unbind();
    // ไม่ reject เพราะรหัสผ่านเปลี่ยนแล้ว
    resolve({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ (แต่ไม่สามารถ activate ได้)' });
  }
}

async function changeExpiredPasswordSimple(username, currentPassword, newPassword) {
  return new Promise((resolve, reject) => {
    logger.info('เริ่มการเปลี่ยนรหัสผ่านแบบ Simple Method สำหรับผู้ใช้:', username);
    
    const client = ldap.createClient({
      url: process.env.LDAP_URL,
      timeout: 10000,
      connectTimeout: 15000
    });
    
    client.on('error', (err) => {
      logger.error('LDAP client error:', err);
    });

    // หาข้อมูลผู้ใช้
    client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (bindErr) => {
      if (bindErr) {
        logger.error('LDAP service bind error:', bindErr);
        client.unbind();
        reject(new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับบริการ LDAP: ' + bindErr.message));
        return;
      }
      
      const userFilter = `(&(objectClass=user)(|(sAMAccountName=${username})(userPrincipalName=${username}@onetwotrading.co.th)(mail=${username}@onetwotrading.co.th)))`;
      
      const opts = {
        filter: userFilter,
        scope: 'sub',
        attributes: ['distinguishedName', 'pwdLastSet']
      };

      client.search(LDAP_BASE_DN, opts, (searchErr, res) => {
        if (searchErr) {
          logger.error('LDAP search error:', searchErr);
          client.unbind();
          reject(new Error('เกิดข้อผิดพลาดในการค้นหาผู้ใช้: ' + searchErr.message));
          return;
        }

        let userDN = null;

        res.on('searchEntry', (entry) => {
          userDN = entry.objectName.toString();
        });

        res.on('end', () => {
          if (!userDN) {
            client.unbind();
            reject(new Error('ไม่พบผู้ใช้ในระบบ'));
            return;
          }

          logger.info('พบผู้ใช้:', userDN);
          
          // ลอง reset รหัสผ่านโดยตรง
          performSimplePasswordReset(client, userDN, newPassword, resolve, reject);
        });
      });
    });
  });
}

function performSimplePasswordReset(client, userDN, newPassword, resolve, reject) {
  logger.info('กำลังทำการ reset รหัสผ่านแบบง่าย');
  
  // ลองใช้ userPassword โดยตรง
  const passwordData = {
    userPassword: newPassword
  };

  client.modify(userDN, passwordData, (modifyErr) => {
    client.unbind();
    
    if (modifyErr) {
      logger.error('Simple password reset ล้มเหลว:', modifyErr);
      
      if (modifyErr.code === 50) {
        reject(new Error('ไม่มีสิทธิ์ในการเปลี่ยนรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ'));
      } else if (modifyErr.code === 53) {
        reject(new Error('รหัสผ่านใหม่ไม่ตรงตามนโยบาย'));
      } else {
        reject(new Error('ไม่สามารถเปลี่ยนรหัสผ่านได้: ' + modifyErr.message));
      }
      return;
    }

    logger.info('เปลี่ยนรหัสผ่านสำเร็จแบบง่าย');
    resolve({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  });
}


async function changeExpiredPasswordWithExtOp(username, currentPassword, newPassword) {
  return new Promise((resolve, reject) => {
    logger.info('ใช้ Password Modify Extended Operation สำหรับรหัสผ่านที่หมดอายุ');
    
    const client = ldap.createClient({
      url: process.env.LDAP_URL,
      timeout: 10000,
      connectTimeout: 15000
    });

    client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (bindErr) => {
      if (bindErr) {
        logger.error('LDAP service bind error:', bindErr);
        client.unbind();
        reject(new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับบริการ LDAP: ' + bindErr.message));
        return;
      }

      // หาข้อมูลผู้ใช้
      const userFilter = `(&(objectClass=user)(|(sAMAccountName=${username})(userPrincipalName=${username}@onetwotrading.co.th)(mail=${username}@onetwotrading.co.th)))`;
      
      const opts = {
        filter: userFilter,
        scope: 'sub',
        attributes: ['distinguishedName']
      };

      client.search(LDAP_BASE_DN, opts, (searchErr, res) => {
        if (searchErr) {
          logger.error('LDAP search error:', searchErr);
          client.unbind();
          reject(new Error('เกิดข้อผิดพลาดในการค้นหาผู้ใช้: ' + searchErr.message));
          return;
        }

        let userDN = null;

        res.on('searchEntry', (entry) => {
          userDN = entry.objectName.toString();
        });

        res.on('end', () => {
          if (!userDN) {
            client.unbind();
            reject(new Error('ไม่พบผู้ใช้ในระบบ'));
            return;
          }

          // ใช้ Extended Operation สำหรับเปลี่ยนรหัสผ่าน
          const passwordModifyRequest = {
            userIdentity: userDN,
            oldPassword: currentPassword,
            newPassword: newPassword
          };

          // OID สำหรับ Password Modify Extended Operation
          client.exop('1.3.6.1.4.1.4203.1.11.1', passwordModifyRequest, (extopErr, result) => {
            client.unbind();
            
            if (extopErr) {
              logger.error('Extended Operation error:', extopErr);
              reject(new Error('ไม่สามารถเปลี่ยนรหัสผ่านด้วย Extended Operation ได้: ' + extopErr.message));
              return;
            }

            logger.info('เปลี่ยนรหัสผ่านสำเร็จด้วย Extended Operation');
            client.unbind();
            resolve({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
          });
        });
      });
    });
  });
}

async function changeExpiredPasswordRaw(username, currentPassword, newPassword) {
  return new Promise((resolve, reject) => {
    logger.info('เริ่มการเปลี่ยนรหัสผ่านด้วย Raw LDAP Protocol สำหรับผู้ใช้:', username);
    
    const client = ldap.createClient({
      url: process.env.LDAP_URL,
      timeout: 10000,
      connectTimeout: 15000
    });
    
    client.on('error', (err) => {
      logger.error('LDAP client error:', err);
    });

    // หาข้อมูลผู้ใช้
    client.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (bindErr) => {
      if (bindErr) {
        logger.error('LDAP service bind error:', bindErr);
        client.unbind();
        reject(new Error('เกิดข้อผิดพลาดในการเชื่อมต่อกับบริการ LDAP: ' + bindErr.message));
        return;
      }
      
      const userFilter = `(&(objectClass=user)(|(sAMAccountName=${username})(userPrincipalName=${username}@onetwotrading.co.th)(mail=${username}@onetwotrading.co.th)))`;
      
      const opts = {
        filter: userFilter,
        scope: 'sub',
        attributes: ['distinguishedName', 'pwdLastSet']
      };

      client.search(LDAP_BASE_DN, opts, (searchErr, res) => {
        if (searchErr) {
          logger.error('LDAP search error:', searchErr);
          client.unbind();
          reject(new Error('เกิดข้อผิดพลาดในการค้นหาผู้ใช้: ' + searchErr.message));
          return;
        }

        let userDN = null;

        res.on('searchEntry', (entry) => {
          userDN = entry.objectName.toString();
        });

        res.on('end', () => {
          if (!userDN) {
            client.unbind();
            reject(new Error('ไม่พบผู้ใช้ในระบบ'));
            return;
          }

          logger.info('พบผู้ใช้:', userDN);
          
          // ใช้ raw modify operation
          performRawPasswordModify(client, userDN, newPassword, resolve, reject);
        });
      });
    });
  });
}

// ฟังก์ชันทำ raw modify operation
function performRawPasswordModify(client, userDN, newPassword, resolve, reject) {
  logger.info('กำลังทำการ modify ด้วย raw operation');
  
  // Method 1: ใช้ client._modify โดยตรง (bypass Change constructor)
  try {
    const req = {
      dn: userDN,
      changes: [
        {
          operation: 'replace',
          modification: {
            type: 'userPassword',
            vals: [newPassword]
          }
        }
      ]
    };

    // ใช้ internal modify method
    if (client._modify) {
      client._modify(req, (err, res) => {
        if (err) {
          logger.warn('Raw modify method 1 ล้มเหลว:', err);
          tryPasswordExtendedOp(client, userDN, newPassword, resolve, reject);
          return;
        }
        
        logger.info('เปลี่ยนรหัสผ่านสำเร็จด้วย raw modify');
        client.unbind();
        resolve({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
      });
    } else {
      tryPasswordExtendedOp(client, userDN, newPassword, resolve, reject);
    }
  } catch (error) {
    logger.warn('Raw modify error:', error);
    tryPasswordExtendedOp(client, userDN, newPassword, resolve, reject);
  }
}

// ลองใช้ Password Extended Operation
function tryPasswordExtendedOp(client, userDN, newPassword, resolve, reject) {
  logger.info('กำลังลองใช้ Password Extended Operation');
  
  try {
    // OID สำหรับ Password Modify Extended Operation: 1.3.6.1.4.1.4203.1.11.1
    const extOpValue = Buffer.concat([
      Buffer.from([0x30]), // SEQUENCE
      Buffer.from([0x00])  // Empty sequence (no old password)
    ]);

    client.exop('1.3.6.1.4.1.4203.1.11.1', extOpValue, (extErr, extRes) => {
      if (extErr) {
        logger.warn('Extended Operation ล้มเหลว:', extErr);
        trySimpleTextReplace(client, userDN, newPassword, resolve, reject);
        return;
      }
      
      logger.info('เปลี่ยนรหัสผ่านสำเร็จด้วย Extended Operation');
      client.unbind();
      resolve({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    });
  } catch (error) {
    logger.warn('Extended Operation error:', error);
    trySimpleTextReplace(client, userDN, newPassword, resolve, reject);
  }
}

// ลองใช้ simple text replacement
function trySimpleTextReplace(client, userDN, newPassword, resolve, reject) {
  logger.info('กำลังลองใช้ simple text replacement');
  
  // ลองใช้ del + add operation แทน replace
  const deleteOp = {
    operation: 'delete',
    modification: {
      userPassword: []
    }
  };
  
  const addOp = {
    operation: 'add', 
    modification: {
      userPassword: [newPassword]
    }
  };

  // ลำดับ: delete ก่อน แล้วค่อย add
  client.modify(userDN, deleteOp, (delErr) => {
    if (delErr) {
      logger.warn('Delete password ล้มเหลว:', delErr);
    }
    
    // ลอง add password ใหม่
    client.modify(userDN, addOp, (addErr) => {
      client.unbind();
      
      if (addErr) {
        logger.error('Add password ล้มเหลว:', addErr);
        
        if (addErr.code === 50) {
          reject(new Error('ไม่มีสิทธิ์ในการเปลี่ยนรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ'));
        } else if (addErr.code === 53) {
          reject(new Error('รหัสผ่านใหม่ไม่ตรงตามนโยบาย'));
        } else {
          reject(new Error('ไม่สามารถเปลี่ยนรหัสผ่านได้: ' + addErr.message));
        }
        return;
      }
      
      logger.info('เปลี่ยนรหัสผ่านสำเร็จด้วย delete+add operation');
      resolve({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    });
  });
}

// ฟังก์ชันสุดท้าย - ใช้ manual LDAP message construction
async function changePasswordManual(username, newPassword) {
  return new Promise((resolve, reject) => {
    logger.info('กำลังใช้วิธี manual LDAP message construction');
    
    const net = require('net');
    const socket = new net.Socket();
    
    // Parse LDAP URL
    const ldapUrl = new URL(process.env.LDAP_URL);
    const host = ldapUrl.hostname;
    const port = ldapUrl.port || 389;
    
    socket.connect(port, host, () => {
      logger.info('เชื่อมต่อ LDAP socket สำเร็จ');
      
      // ส่ง LDAP bind request
      const bindMessage = constructBindMessage(LDAP_BIND_DN, LDAP_BIND_PASSWORD);
      socket.write(bindMessage);
    });
    
    socket.on('data', (data) => {
      logger.info('ได้รับข้อมูลจาก LDAP server');
      // Parse LDAP response และดำเนินการต่อ
      socket.end();
      reject(new Error('Manual LDAP construction ยังไม่สมบูรณ์'));
    });
    
    socket.on('error', (err) => {
      logger.error('Socket error:', err);
      reject(new Error('ไม่สามารถเชื่อมต่อ LDAP ด้วย socket ได้'));
    });
  });
}

function constructBindMessage(dn, password) {
  // สร้าง LDAP bind message แบบ manual
  // นี่เป็นการใช้ LDAP protocol โดยตรง
  const messageId = Buffer.from([0x02, 0x01, 0x01]); // INTEGER 1
  const bindRequest = Buffer.from([0x60]); // BindRequest
  // ... สร้าง LDAP message structure
  
  return Buffer.concat([messageId, bindRequest]);
}

  module.exports = {
    authenticateLDAP,
    authMiddleware,
    changeLDAPPasswordModify,
    transformEntryFormat,
    filterEntriesWithEmployeeID,
    extractOU,
    checkPasswordExpiration,
    checkPasswordExpirationFromAttributes,
    changeExpiredPassword,
    getUserInfo,
    changePasswordWithExtendedOperation,
    authenticateUserAndChangePassword,
    changePasswordWithUserRights,
    performExpiredPasswordReset,
    changeExpiredPasswordSimple,
    performSimplePasswordReset,
    activateNewPasswordSimple,
    changeExpiredPasswordWithExtOp,
    
  };  