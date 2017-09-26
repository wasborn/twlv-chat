const logger = require('twlv-logger')('twlv-chat:lib:loop');

class Loop {
  constructor ({ loopInterval }) {
    this.loopInterval = loopInterval;
  }

  start () {
    this.timeout = setTimeout(() => this.loop(), this.loopInterval);
  }

  stop () {
    clearTimeout(this.timeout);
  }

  loop () {
    // logger.log('loop');
    // TODO: here loop
    this.timeout = setTimeout(this.loop.bind(this), this.loopInterval);
  }
}

module.exports = { Loop };
