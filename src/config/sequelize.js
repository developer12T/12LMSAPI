const { Sequelize } = require('sequelize');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

// Sequelize configuration
const sequelize = new Sequelize({
  dialect: 'mssql',
  host: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  dialectOptions: {
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true
    }
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false
});

/**
 * Execute stored procedure ง่ายๆ สุดๆ
 * @param {string} procedureName - ชื่อ stored procedure
 * @param {Object} params - parameters
 * @returns {Promise<Array>} ผลลัพธ์
 */
async function exec(procedureName, params = {}) {
  try {
    logger.info(`Executing: ${procedureName}`, params);
    
    // สร้าง SQL statement
    let sql = `EXEC ${procedureName}`;
    const replacements = {};
    
    Object.entries(params).forEach(([key, value], index) => {
      if (index > 0) sql += ',';
      sql += ` @${key} = :${key}`;
      replacements[key] = value;
    });
    
    logger.info(`SQL: ${sql}`);
    logger.info(`Replacements:`, replacements);
    
    // ตรวจสอบการเชื่อมต่อฐานข้อมูล
    await sequelize.authenticate();
    
    const results = await sequelize.query(sql, {
      replacements: replacements,
      type: Sequelize.QueryTypes.SELECT
    });
    
    logger.info(`Success: ${procedureName}, Results: ${Array.isArray(results) ? results.length : 0}`);
    logger.info(`Results type: ${typeof results}`);
    logger.info(`Results:`, results);
    return results || [];
  } catch (error) {
    logger.error(`Error: ${procedureName}`, {
      message: error.message,
      code: error.code,
      state: error.state,
      class: error.class,
      lineNumber: error.lineNumber,
      serverName: error.serverName,
      procName: error.procName,
      stack: error.stack
    });
    
    // ส่งกลับ error ที่มีรายละเอียดมากขึ้น
    const enhancedError = new Error(`Database error in ${procedureName}: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.procedureName = procedureName;
    enhancedError.params = params;
    throw enhancedError;
  }
}

/**
 * Execute stored procedure แบบ array parameters
 * @param {string} procedureName - ชื่อ stored procedure
 * @param {Array} params - array parameters
 * @returns {Promise<Array>} ผลลัพธ์
 */
async function execArray(procedureName, params = []) {
  try {
    logger.info(`Executing: ${procedureName}`, params);
    
    const paramString = params.map((_, index) => `@P${index + 1}`).join(', ');
    const sql = `EXEC ${procedureName} ${paramString}`;
    
    logger.info(`SQL: ${sql}`);
    
    const results = await sequelize.query(sql, {
      bind: params,
      type: Sequelize.QueryTypes.SELECT
    });
    
    logger.info(`Success: ${procedureName}, Results: ${Array.isArray(results) ? results.length : 0}`);
    return results || [];
  } catch (error) {
    logger.error(`Error: ${procedureName}`, error.message);
    throw error;
  }
}

/**
 * Test connection
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected successfully');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Close connection
 */
async function closeConnection() {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing connection:', error);
  }
}

module.exports = {
  sequelize,
  exec,
  execArray,
  testConnection,
  closeConnection
}; 