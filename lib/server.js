const http = require('http');
const WebSocket = require('ws');
const logger = require('twlv-logger')('twlv-chat:lib:server');

class Server {
  constructor () {
    this.commandHandlers = {};
  }

  get port () {
    return this.instance ? this.instance.address().port : 0;
  }

  async start (instance) {
    if (!instance) {
      instance = this._instance = http.createServer((req, res) => res.end('api'));
      await new Promise(resolve => this._instance.listen(resolve));
    }
    this.instance = instance;

    await this._startWs(this.instance);
  }

  async stop () {
    if (this._instance) {
      await new Promise(resolve => this._instance.close(resolve));
    }
  }

  _startWs (server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', socket => {
      logger.log('API client connected, size %d', this.wss.clients.size);
      if (this.connectHandler) {
        this.connectHandler(socket);
      } else {
        logger.warn('No connect handler');
      }
      socket.on('message', frame => this.onMessage(socket, JSON.parse(frame)));
      socket.on('close', () => logger.log('API client disconnected, size %d', this.wss.clients.size));
    });
  }

  setConnectHandler (handler) {
    this.connectHandler = handler;
  }

  setCommandHandler (command, handler) {
    this.commandHandlers[command] = handler;
  }

  async onMessage (socket, { id, command, payload }) {
    logger.log('Received message: %o', { command, payload });

    let value;
    let error;

    try {
      let handler = this.commandHandlers[command];
      if (handler) {
        value = await handler(payload);
      } else {
        logger.warn('Command handler not found for %s', command);
      }
    } catch (err) {
      error = err.message;
    }

    if (id) {
      this.send(
        socket,
        error ? { id, command: '!error', payload: error } : { id, command: '!value', payload: value }
      );
    }
  }

  send (socket, message) {
    logger.log('Send %o', message);

    socket.send(JSON.stringify(message));
  }

  broadcast (message) {
    logger.log('Broadcast %o', message);

    let data = JSON.stringify(message);
    this.wss.clients.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    });
  }
}

module.exports = { Server };
