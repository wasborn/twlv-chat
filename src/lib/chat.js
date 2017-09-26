import { Logger } from 'twlv-logger';
import { EventEmitter } from 'events';
import { Request } from './request';
import cmd from '../../lib/cmd';

const logger = new Logger('twlv-chat:components:app-main');
const WebSocket = window.WebSocket;

export class Chat extends EventEmitter {
  constructor () {
    super();

    this.requests = [];
  }

  connect (url = `ws://${window.location.host}`) {
    return new Promise(resolve => {
      logger.log('Connecting to %s', url);

      this.ws = new WebSocket(url);
      this.ws.onopen = resolve;
      this.ws.onmessage = evt => {
        // logger.log('Received wire message', evt.data);
        let message = JSON.parse(evt.data);

        this._onMessage(message);
      };
      this.ws.onclose = evt => {
        logger.log('Disconnected');
        if (!evt.wasClean) {
          setTimeout(() => this.connect(url), 5000);
        }
      };
    });
  }

  subscribe (name, callback) {
    this.on(name, callback);
    callback(this[name]);
  }

  query (address) {
    return this.apiRequest({ command: cmd.QUERY, payload: address });
  }

  search (q) {
    return this.apiRequest({ command: cmd.SEARCH, payload: q });
  }

  async follow (contact) {
    await this.apiSend({ command: cmd.FOLLOW, payload: contact });
  }

  async setProfile (profile) {
    await this.apiSend({ command: cmd.PROFILE, payload: profile });
  }

  apiSend ({ command, payload }) {
    this.ws.send(JSON.stringify({ command, payload }));
  }

  apiRequest ({ command, payload }) {
    let req = new Request(this._removeRequest.bind(this));
    this._addRequest(req);
    return req.run(({ id }) => {
      this.ws.send(JSON.stringify({ id, command, payload }));
    });
  }

  _removeRequest (req) {
    let index = this.requests.indexOf(req);
    if (index !== -1) {
      this.requests.splice(index, 1);
    }
  }

  _addRequest (req) {
    this.requests.push(req);
  }

  _onMessage ({ id, command, payload }) {
    logger.log('Received message %o', { command, payload });

    if (id) {
      let req = this.requests.find(req => req.id === id);
      if (req) {
        if (command === 'error') {
          req.reject(new Error(payload));
        } else {
          req.resolve(payload);
        }
      }
    } else {
      if (command === cmd.PROFILE) {
        this.profile = payload;
        this.emit('profile', payload);
      } else if (command === cmd.CONTACTS) {
        this.contacts = payload;
        this.emit('contacts', payload);
      }
    }
  }
}
