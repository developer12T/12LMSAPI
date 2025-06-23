const NodeCache = require('node-cache');
const { setupLogger } = require('./logger');

const logger = setupLogger();

const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 1800, // 30 minutes default
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Store references instead of cloning objects
});

// Cache events for monitoring
cache.on('expired', (key, value) => {
  logger.debug(`Cache key expired: ${key}`);
});

cache.on('error', (err) => {
  logger.error('Cache error:', err);
});

function getCacheKey(prefix, params) {
  return `${prefix}_${JSON.stringify(params)}`;
}

async function getCachedData(key, fetchData, ttl = null) {
  try {
    const cachedData = cache.get(key);
    if (cachedData) {
      logger.debug(`Cache hit for key: ${key}`);
      return cachedData;
    }

    logger.debug(`Cache miss for key: ${key}`);
    const data = await fetchData();
    cache.set(key, data, ttl);
    return data;
  } catch (error) {
    logger.error(`Error in getCachedData for key ${key}:`, error);
    throw error;
  }
}

module.exports = {
  cache,
  getCacheKey,
  getCachedData
}; 