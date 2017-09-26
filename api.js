const { Dao } = require('./lib/dao');
const { Server } = require('./lib/server');
const { Loop } = require('./lib/loop');
const cmd = require('./lib/cmd');
const logger = require('twlv-logger')('twlv-chat:api');
const { EventEmitter } = require('events');
const { Client } = require('twlv-client');
const { Manager: SessionManager } = require('./lib/session');
const assert = require('assert');

class Api extends EventEmitter {
  constructor ({ ipcUrl, loopInterval = 5000, dbFile = ':memory:' }) {
    super();

    let api = this;
    this.sessions = new SessionManager({ api });

    this.client = new Client(ipcUrl);
    this.client.setRequestHandler(cmd.IPC_QUERY, this.getProfile.bind(this));
    this.client.setRequestHandler(cmd.IPC_GETLOGS, this.getLogs.bind(this));
    this.client.setMessageHandler(cmd.IPC_LOG, this._onIpcLog.bind(this));
    this.client.setMessageHandler(cmd.IPC_LOGS, this._onIpcLogs.bind(this));

    this.server = new Server({ api });
    this.server.setConnectHandler(this._onUiConnect.bind(this));
    this.server.setCommandHandler(cmd.PROFILE, this.setProfile.bind(this));

    this.dao = new Dao({ api, dbFile });
    this.loop = new Loop({ api, loopInterval });
  }

  get port () {
    return this.server.port;
  }

  async start (server) {
    await this.client.connect({
      kind: 'a',
      name: 'chat',
      version: require('./package.json').version,
    });

    await this.server.start(server);
    await this.dao.start();
    await this.loop.start();

    this.profile = await this.initProfile();

    logger.log('API listening at ws://localhost:%d', this.port);
  }

  async stop () {
    await this.loop.stop();
    await this.dao.stop();
    await this.server.stop();
    await this.client.disconnect();
    logger.log('API stopped');
  }

  async initProfile () {
    let profile = await this.dao.getProfile();
    if (!profile) {
      await this.dao.setProfile({
        address: this.client.address,
        name: `User ${this.client.address.substr(0, 4)}`,
        publicKey: this.client.identity.publicKey,
      });
      profile = await this.dao.getProfile();
    }

    return profile;
  }

  getProfile () {
    return this.profile;
  }

  async setProfile (profile) {
    await this.dao.setProfile(profile);
    this.profile = await this.dao.getProfile();
    this.server.broadcast({ command: cmd.PROFILE, payload: this.profile });
  }

  async createSession ({ id, name, peers = [] }) {
    assert(peers.length > 1, 'Session needs 2 or more peers');

    if (await this.sessions.get(id)) {
      throw new Error('Session already exists');
    }

    let session = await this.sessions.create(id);
    await session.init({ name, peers });

    return session;
  }

  createPrivateSession (address) {
    let peers = [ this.profile.address, address ].sort();
    let id = peers.join('.');
    let name = id;

    return this.createSession({ id, name, peers });
  }

  getSession (id) {
    return this.sessions.get(id);
  }

  getPrivateSession (address) {
    return this.getSession([ this.profile.address, address ].sort().join('.'));
  }

  async sendMessage (id, message) {
    let session = await this.getSession(id);
    if (!session) {
      throw new Error('Failed send message to unknown session');
    }

    await session.send(message);
  }

  async getLogs (id, vectors) {
    assert(id, 'Get logs must specify id');

    let session = await this.sessions.get(id);
    let logs = await session.getLogs(vectors);

    return { id, logs };
  }

  async _onIpcLog ({ address, command, payload }) {
    let { id, log } = payload;
    let session = await this.sessions.get(id);
    if (!session) {
      session = await this.sessions.create(id);
      if (log.kind !== 'init') {
        let { logs } = await this.client.request({ address, command: cmd.IPC_GETLOGS, payload: id });
        while (logs.length) {
          await session.log(logs.shift());
        }
      }
    }

    await session.log(log);
  }

  async _onIpcLogs ({ address, command, payload }) {
    let { id, logs } = payload;
    let session = await this.sessions.get(id);
    if (session) {
      while (logs.length) {
        await session.log(logs.shift());
      }
    } else {
      throw new Error('Unimplemented yet');
    }
  }

  _onUiConnect (socket) {
    this.server.send(socket, { command: cmd.PROFILE, payload: this.profile });
  }
}

module.exports = { Api };
