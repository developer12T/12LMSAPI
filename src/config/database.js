const sql = require('mssql');
const { setupLogger } = require('../utils/logger');

const logger = setupLogger();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, 
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;

async function setupDatabase() {
  try {
    pool = await sql.connect(dbConfig);
    logger.info('Connected to SQL Server');
    return pool;
  } catch (err) {
    logger.error('Database Connection Failed:', err);
    throw err;
  }
}

async function executeStoredProcedure(procedureName, params = {}) {
  try {
    const request = pool.request();
    
    // Check if params is an array (for positional parameters) or object (for named parameters)
    if (Array.isArray(params)) {
      // Handle array of parameters (positional parameters)
      params.forEach((value, index) => {
        // For stored procedures with positional parameters, we need to add them in order
        // The parameter names are typically @P1, @P2, @P3, etc. or the actual parameter names
        const paramName = `@P${index + 1}`;
        request.input(paramName, value);
      });
    } else {
      // Handle object parameters (named parameters)
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    const result = await request.execute(procedureName);
    return result.recordset;
  } catch (err) {
    logger.error(`Error executing stored procedure ${procedureName}:`, err);
    throw err;
  }
}

module.exports = {
  setupDatabase,
  executeStoredProcedure,
  pool
}; 