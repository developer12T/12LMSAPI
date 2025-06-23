const { setupLogger } = require('./logger');

const logger = setupLogger();

// Custom stream for Morgan that uses Winston
const morganStream = {
  write: (message) => {
    // Remove newline character from the end of the message
    const logMessage = message.trim();
    
    // Log with appropriate level based on status code
    if (logMessage.includes(' 5')) {
      logger.error(logMessage);
    } else if (logMessage.includes(' 4')) {
      logger.warn(logMessage);
    } else {
      logger.info(logMessage);
    }
  }
};

module.exports = morganStream; 