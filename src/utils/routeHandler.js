const { setupLogger } = require('./logger');
const { formatErrorResponse, createSuccessResponse, validatePagination } = require('./responseFormatter');

const logger = setupLogger();

/**
 * Create a standardized route handler
 * @param {Function} controllerFunction - Controller function to execute
 * @param {Object} options - Options for the handler
 * @returns {Function} Express route handler
 */
const createRouteHandler = (controllerFunction, options = {}) => {
  const {
    requiredParams = [],
    stringParams = [],
    dateParams = [],
    numericParams = [],
    maxPageSize = 100,
    defaultPageSize = 10,
    extractMetadata = null
  } = options;

  return async (req, res) => {
    try {
      // Extract parameters from both query and body
      const params = {
        ...req.query,
        ...req.body,
        page: req.query.page || req.body.page || 1,
        per_page: req.query.per_page || req.body.per_page || defaultPageSize
      };

      // Validate required parameters
      const missingParams = [];
      for (const param of requiredParams) {
        if (!params[param] || params[param].toString().trim() === '') {
          missingParams.push(param);
        }
      }

      if (missingParams.length > 0) {
        const errorMessage = `Missing required parameters: ${missingParams.join(', ')}`;
        return res.status(400).json(formatErrorResponse(errorMessage, 400));
      }

      // Validate pagination
      const { page: validPage, pageSize: validPerPage } = validatePagination(
        params.page, 
        params.per_page, 
        maxPageSize, 
        defaultPageSize
      );

      // Sanitize string parameters
      for (const param of stringParams) {
        if (params[param] && typeof params[param] === 'string') {
          params[param] = params[param].trim();
        }
      }

      // Validate date parameters
      for (const param of dateParams) {
        if (params[param]) {
          const date = new Date(params[param]);
          if (isNaN(date.getTime())) {
            return res.status(400).json(formatErrorResponse(`${param} parameter must be a valid date`, 400));
          }
        }
      }

      // Validate numeric parameters
      for (const param of numericParams) {
        if (params[param]) {
          const num = parseFloat(params[param]);
          if (isNaN(num)) {
            return res.status(400).json(formatErrorResponse(`${param} parameter must be a valid number`, 400));
          }
        }
      }

      // Execute controller function
      const data = await controllerFunction(params);

      // Create metadata
      const metadata = {
        page: validPage,
        pageSize: validPerPage,
        query_parameters: extractMetadata ? extractMetadata(params) : params
      };

      res.json(createSuccessResponse(data, metadata));
    } catch (error) {
      logger.error(`Error in route handler:`, error);
      const statusCode = error.message.includes('required') ? 400 : 500;
      res.status(statusCode).json(formatErrorResponse(error, statusCode));
    }
  };
};

/**
 * Create a simple route handler for basic operations
 * @param {Function} controllerFunction - Controller function to execute
 * @returns {Function} Express route handler
 */
const createSimpleRouteHandler = (controllerFunction) => {
  return async (req, res) => {
    try {
      const params = { ...req.query, ...req.body };
      const data = await controllerFunction(params);
      res.json(createSuccessResponse(data));
    } catch (error) {
      logger.error(`Error in simple route handler:`, error);
      const statusCode = error.message.includes('required') ? 400 : 500;
      res.status(statusCode).json(formatErrorResponse(error, statusCode));
    }
  };
};

module.exports = {
  createRouteHandler,
  createSimpleRouteHandler
}; 