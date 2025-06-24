const { clearCacheByPrefix } = require('../utils/cache');
const { formatErrorResponse, createSuccessResponse } = require('../utils/responseFormatter');

/**
 * Controller to clear cache by a given prefix.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const clearCache = async (req, res) => {
  const { prefix } = req.body;

  if (!prefix) {
    return res.status(400).json(
      formatErrorResponse('Prefix parameter is required', 400)
    );
  }

  try {
    const deletedCount = clearCacheByPrefix(prefix);
    res.json(createSuccessResponse({
      message: `Successfully cleared ${deletedCount} cache entries with prefix '${prefix}'.`
    }));
  } catch (error) {
    res.status(500).json(
      formatErrorResponse(error, 500)
    );
  }
};

module.exports = {
  clearCache
}; 