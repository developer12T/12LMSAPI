const winston = require('winston');
const SocketTransport = require('./socketTransport');

let io;
 
 
function setupLogger(socketIO) {
  io = socketIO;
  
  const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error' 
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log' 
      }),
      new SocketTransport({ io })
    ]
  });

  return logger;
}

module.exports = {
  setupLogger
}; 