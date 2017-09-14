const http = require('http');
const WebSocket = require('ws');
const Manager = require('node-norm');
const { Client } = require('twlv-client');
const cmd = require('./lib/cmd');

class Api {
  constructor ({ ipcUrl, storeConfig = {} }) {
    this.ipcUrl = ipcUrl;
    this.storeConfig = storeConfig;
    this.logger = require('twlv-logger')('twlv-chat:api');
  }

  get module () {
    return {
      kind: 'a',
      name: 'chat',
      version: require('./package.json').version,
    };
  }

  get port () {
    return this.server ? this.server.address().port : 0;
  }

  async start (server) {
    await this._bootClient();
    await this._bootStore();
    await this._bootServer(server);
    await this._bootWS();

    await this._mainLoop();

    this.logger.log('API listening at ws://localhost:%d', this.port);
  }

  async stop () {
    await this._debootClient();
    await this._debootServer();
    this.logger.log('API stopped');
  }

  send (socket, message) {
    this.logger.log('Send %o', message);

    socket.send(JSON.stringify(message));
  }

  broadcast (message) {
    this.logger.log('Broadcast %o', message);

    let data = JSON.stringify(message);
    this.wss.clients.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    });
  }

  _debootClient () {
    this.client.disconnect();
  }

  async _debootServer () {
    if (this._server) {
      await new Promise(resolve => this._server.close(resolve));
    }
  }

  async _mainLoop () {
    let hasChanges = false;
    await Promise.all(this.contacts.map(async contact => {
      try {
        let data = await this._query(contact.address);
        if (contact.name !== data.name || !contact.status) {
          Object.assign(contact, data, { status: 1 });
          hasChanges = true;
        }
      } catch (err) {
        // this.logger.error('Caught err', err);
        if (contact.status) {
          contact.status = 0;
          hasChanges = true;
        }
      }
    }));

    if (hasChanges) {
      this.broadcast({ command: cmd.CONTACTS, payload: this.contacts });
    }

    setTimeout(this._mainLoop.bind(this), 5000);
  }

  async _bootClient () {
    this.client = new Client(this.ipcUrl);

    this.client.setRequestHandler(cmd.IPC_QUERY, () => this.profile);

    await this.client.connect(this.module);
  }

  async _bootStore () {
    this.manager = new Manager(this.storeConfig);
    this.store = this.manager.openSession();

    let profile = await this.store.factory('profile').single();
    if (!profile) {
      let { address } = this.client;
      await this.store.factory('profile')
        .insert({
          address,
          name: `User ${address.substr(0, 4)}`,
        })
        .save();
      profile = await this.store.factory('profile').single();
    }

    this.profile = profile;
    this.contacts = await this.store.factory('contact').all();
  }

  async _bootServer (server) {
    if (!server) {
      server = this._server = http.createServer((req, res) => res.end('api'));
      await new Promise(resolve => this._server.listen(resolve));
    }
    this.server = server;
  }

  _bootWS (server) {
    this.wss = new WebSocket.Server({ server: this.server });

    this.wss.on('connection', socket => {
      this.logger.log('API client connected, size %d', this.wss.clients.size);
      this.send(socket, { command: cmd.PROFILE, payload: this.profile });
      this.send(socket, { command: cmd.CONTACTS, payload: this.contacts });

      socket.on('message', frame => {
        // this.logger.log('Received wire message: %s', frame);
        this._onWireMessage(socket, JSON.parse(frame));
      });

      socket.on('close', () => {
        this.logger.log('API client disconnected, size %d', this.wss.clients.size);
      });
    });
  }

  async _onWireMessage (socket, { id, command, payload }) {
    this.logger.log('Received message: %o id: %s', { command, payload }, id);

    let value;
    let error;
    try {
      switch (command) {
        case cmd.PROFILE:
          value = await this._updateProfile(payload);
          break;
        case cmd.ADD_CONTACT:
          value = await this._addContact(payload);
          break;
        case cmd.QUERY:
          value = await this._query(payload);
          break;
        default:
          this.logger.warn('Command %o not supported', command);
      }
    } catch (err) {
      error = err.message;
    }

    if (id) {
      if (error) {
        this.send(socket, { id, command: '!error', payload: error });
      } else {
        this.send(socket, { id, command: '!value', payload: value });
      }
    }
  }

  async _updateProfile (profile) {
    await this.store.factory('profile', profile.id).set(profile).save();
    this.profile = profile;
    this.broadcast({ command: cmd.PROFILE, payload: profile });
  }

  async _addContact (contact) {
    let existingContact = await this.store.factory('contact', { address: contact.address }).single();
    if (existingContact) {
      throw new Error('Contact already exists');
    }
    await this.store.factory('contact').insert(contact).save();

    let contacts = await this.store.factory('contact').all();
    this.broadcast({ command: cmd.CONTACTS, payload: contacts });
  }

  _query (address) {
    return this.client.request({ address, command: cmd.IPC_QUERY, payload: address });
  }
}

module.exports = { Api };
