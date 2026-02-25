const { formatErrorResponse } = require('../utils/responseFormatter');

/**
 * Validate required parameters
 * @param {Array} requiredParams - Array of required parameter names
 * @returns {Function} Express middleware function
 */
const validateRequiredParams = (requiredParams) => {
  return (req, res, next) => {
    const params = { ...req.query, ...req.body };
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

    next();
  };
};

/**
 * Validate pagination parameters
 * @param {number} maxPageSize - Maximum allowed page size
 * @returns {Function} Express middleware function
 */
const validatePaginationParams = (maxPageSize = 100) => {
  return (req, res, next) => {
    const params = { ...req.query, ...req.body };
    const page = parseInt(params.page) || 1;
    const perPage = parseInt(params.per_page) || 10;

    if (page < 1) {
      return res.status(400).json(formatErrorResponse('Page number must be greater than 0', 400));
    }

    if (perPage < 1 || perPage > maxPageSize) {
      return res.status(400).json(formatErrorResponse(`Page size must be between 1 and ${maxPageSize}`, 400));
    }

    next();
  };
};

/**
 * Sanitize and validate string parameters
 * @param {Array} stringParams - Array of string parameter names
 * @param {number} maxLength - Maximum length for string parameters
 * @returns {Function} Express middleware function
 */
const validateStringParams = (stringParams, maxLength = 255) => {
  return (req, res, next) => {
    const params = { ...req.query, ...req.body };

    for (const param of stringParams) {
      if (params[param] && typeof params[param] === 'string') {
        // Trim whitespace
        params[param] = params[param].trim();
        
        // Check length
        if (params[param].length > maxLength) {
          return res.status(400).json(formatErrorResponse(`${param} parameter exceeds maximum length of ${maxLength}`, 400));
        }
      }
    }

    next();
  };
};

/**
 * Validate date parameters
 * @param {Array} dateParams - Array of date parameter names
 * @returns {Function} Express middleware function
 */
const validateDateParams = (dateParams) => {
  return (req, res, next) => {
    const params = { ...req.query, ...req.body };

    for (const param of dateParams) {
      if (params[param]) {
        const date = new Date(params[param]);
        if (isNaN(date.getTime())) {
          return res.status(400).json(formatErrorResponse(`${param} parameter must be a valid date`, 400));
        }
      }
    }

    next();
  };
};

/**
 * Validate numeric parameters
 * @param {Array} numericParams - Array of numeric parameter names
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Function} Express middleware function
 */
const validateNumericParams = (numericParams, min = null, max = null) => {
  return (req, res, next) => {
    const params = { ...req.query, ...req.body };

    for (const param of numericParams) {
      if (params[param]) {
        const num = parseFloat(params[param]);
        if (isNaN(num)) {
          return res.status(400).json(formatErrorResponse(`${param} parameter must be a valid number`, 400));
        }

        if (min !== null && num < min) {
          return res.status(400).json(formatErrorResponse(`${param} parameter must be greater than or equal to ${min}`, 400));
        }

        if (max !== null && num > max) {
          return res.status(400).json(formatErrorResponse(`${param} parameter must be less than or equal to ${max}`, 400));
        }
      }
    }

    next();
  };
};

module.exports = {
  validateRequiredParams,
  validatePaginationParams,
  validateStringParams,
  validateDateParams,
  validateNumericParams
}; 