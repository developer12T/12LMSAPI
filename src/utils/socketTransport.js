const winston = require('winston');
const util = require('util');

class SocketTransport extends winston.Transport {
  constructor(options) {
    super(options);
    this.io = options.io;
    this.name = 'socketTransport';
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Emit log to all connected clients
    if (this.io) {
      this.io.emit('log', {
        timestamp: new Date().toISOString(),
        level: info.level,
        message: info.message,
        metadata: info.metadata || {}
      });
    }

    callback();
  }
}

module.exports = SocketTransport; 