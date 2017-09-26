const logger = require('twlv-logger')('twlv-chat:lib:session');
const assert = require('assert');
const cmd = require('../cmd');
const { Log } = require('./log');
const { Peer } = require('./peer');

class Session {
  constructor (manager, id) {
    assert(typeof id === 'string', 'Session must define id as string');

    Object.defineProperties(this, {
      manager: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: manager,
      },
    });

    this.id = id;
    this.name = '';
    this.peers = [];
  }

  get initialized () {
    return Boolean(this.name);
  }

  get address () {
    return this.manager.api.profile.address;
  }

  get client () {
    return this.manager.api.client;
  }

  get dao () {
    return this.manager.api.dao;
  }

  createLog (kind, value) {
    let address = this.address;
    let peer = this.getPeer(address);
    let time = new Date().getTime();
    let vector = time * 10;
    if (peer.vectorTime === time) {
      vector = vector + peer.vectorSeq + 1;
    }
    return new Log({ address, vector, kind, value });
  }

  async init (data) {
    await this.log(this.createLog('init', data));
  }

  async setName (name) {
    await this.log(this.createLog('name', name));
  }

  async addPeer (address) {
    await this.log(this.createLog('add-peer', address));
  }

  async send (message) {
    await this.log(this.createLog('message', message));
  }

  async log (log) {
    log = new Log(log);

    let peer = this.getPeer(log.address);

    if (peer.vector >= log.vector) {
      return;
    }

    if (log.kind === 'init') {
      if (this.initialized) {
        await this.client.send({
          address: log.address,
          command: cmd.IPC_LOGS,
          payload: { id: this.id, logs: await this.getLogs() },
        });
      } else {
        let { name, peers } = log.value;
        this.name = name;
        peers.forEach(address => this.getPeer(address));
      }
    } else if (log.kind === 'name') {
      if (this.name === log.value) {
        return;
      }
      this.name = log.value;
    } else if (log.kind === 'add-peer') {
      let peer = this.peers.find(peer => peer.address === log.value);
      if (!peer) {
        this.peers.push(new Peer({ address: log.value }));
      }
    }

    this.dao.addSessionLog(this.id, log.dump());

    if (peer.vector < log.vector) {
      peer.vector = log.vector;
    }

    // TODO: update to dao

    // send all valid logs to peers
    await Promise.all(this.peers.map(async peer => {
      if (peer.address === this.address) {
        return;
      }

      try {
        await this.client.send({
          address: peer.address,
          command: cmd.IPC_LOG,
          payload: { id: this.id, log },
        });
      } catch (err) {
        // noop
      }
    }));
  }

  getPeer (address) {
    let peer = this.peers.find(peer => peer.address === address);
    if (!peer) {
      peer = new Peer({ address });
      this.peers.push(peer);
    }

    return peer;
  }

  async getLogs (filter) {
    let logs = await this.dao.getSessionLogs(this.id, filter);
    return logs.map(log => {
      log.value = JSON.parse(log.value);
      return new Log(log);
    });
  }
}

module.exports = { Session };
