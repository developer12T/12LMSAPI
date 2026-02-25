/**
 * Get current time in Thai timezone
 * @returns {string} ISO string in Thai timezone
 */
const getThaiTime = () => {
  return new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6.000Z');
};

/**
 * Format date to Thai timezone
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date in Thai timezone
 */
const formatThaiTime = (date) => {
  if (!date) return getThaiTime();
  
  const dateObj = new Date(date);
  return dateObj.toLocaleString('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6.000Z');
};

/**
 * Format error response
 * @param {Error|string} error - Error object or message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted error response
 */
const formatErrorResponse = (error, statusCode = 500) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorName = typeof error === 'string' ? 'ValidationError' : error.name;
  
  return {
    status: {
      code: statusCode,
      message: statusCode === 500 ? "Internal Server Error" : errorMessage,
      timestamp: getThaiTime(),
      timezone: 'Asia/Bangkok'
    },
    error: {
      type: errorName,
      code: error.code || 'UNKNOWN_ERROR',
      message: process.env.NODE_ENV === 'development' ? errorMessage : 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' && typeof error !== 'string' ? error.stack : undefined
    }
  };
};

/**
 * Create standard success response
 * @param {Array} data - Data array
 * @param {Object} metadata - Metadata object
 * @returns {Object} Formatted success response
 */
const createSuccessResponse = (data, metadata = {}) => {
  // Handle array data with pagination
  if (Array.isArray(data)) {
    const { page = 1, pageSize = 10 } = metadata;
    const total = data.length;
    const totalPages = Math.ceil(total / pageSize);
    
    return {
      status: {
        code: 200,
        message: "Success",
        timestamp: getThaiTime(),
        timezone: 'Asia/Bangkok'
      },
      data: data,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_records: total,
        per_page: pageSize,
        has_next: page < totalPages,
        has_previous: page > 1
      }
    };
  }

  // Handle non-array data (e.g., from an update or create operation)
  return {
    status: {
      code: 200,
      message: "Success",
      timestamp: getThaiTime(),
      timezone: 'Asia/Bangkok'
    },
    data: data !== undefined ? data : { message: "Operation completed successfully." }
  };
};

/**
 * Validate pagination parameters
 * @param {number|string} page - Page number
 * @param {number|string} pageSize - Page size
 * @param {number} maxPageSize - Maximum page size
 * @param {number} defaultPageSize - Default page size
 * @returns {Object} Validated pagination parameters
 */
const validatePagination = (page, pageSize, maxPageSize = 100, defaultPageSize = 10) => {
  const validatedPage = Math.max(1, parseInt(page) || 1);
  const validatedPageSize = Math.min(
    maxPageSize,
    Math.max(1, parseInt(pageSize) || defaultPageSize)
  );
  return { page: validatedPage, pageSize: validatedPageSize };
};

module.exports = {
  getThaiTime,
  formatThaiTime,
  formatErrorResponse,
  createSuccessResponse,
  validatePagination
}; 