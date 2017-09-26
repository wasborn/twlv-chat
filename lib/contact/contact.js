const assert = require('assert');
const cmd = require('../cmd');
const logger = require('twlv-logger')('twlv-chat:lib:contact');
const { Log } = require('./log');

class Contact {
  constructor (manager, { address, name = '', publicKey = '', status = '', vector = 0, self = false }) {
    assert(address, 'Contact must define address');

    Object.defineProperties(this, {
      manager: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: manager,
      },
      followers: {
        enumerable: false,
        configurable: true,
        writable: true,
        value: [],
      },
    });

    this.address = address;
    this.name = name;
    this.publicKey = publicKey;
    this.status = status;
    this.vector = vector;
    this.self = Boolean(self);
  }

  get dao () {
    return this.manager.api.dao;
  }

  get client () {
    return this.manager.api.client;
  }

  get initialized () {
    return Boolean(this.publicKey);
  }

  createLog (kind, value) {
    let address = this.address;
    let time = new Date().getTime();
    let vector = time * 10;
    if (this.vectorTime === time) {
      vector = vector + this.vectorSeq + 1;
    }
    return { address, vector, kind, value };
  }

  async init ({ name, publicKey, status }) {
    assert(this.self, 'Cannot init from other contact');

    await this.dao.setProfile(this);

    await this.log(this.createLog('init', { name, publicKey, status }));
  }

  async updateProfile ({ name }) {
    assert(this.self, 'Cannot init from other contact');

    await this.log(this.createLog('profile', { name }));
  }

  isFollower (address) {
    return this.followers.indexOf(address) !== -1;
  }

  async addFollower (address) {
    assert(this.self, 'Cannot add follower from other contact');

    if (this.isFollower(address)) {
      return;
    }

    // make sure publish timeline log first, so the new follower doesnt get update
    await this.log(this.createLog('followed', address));

    this.followers.push(address);
  }

  async follow (address) {
    assert(this.self, 'Cannot follow from other contact');

    let contact = new Contact(this.manager, { address });
    await this.dao.addContact(contact);
    let { logs } = await this.client.request({ address, command: cmd.IPC_FOLLOW });
    await Promise.all(logs.map(log => contact.log(new Log(log))));

    await this.log(this.createLog('follow', address));
  }

  async log (log) {
    log = new Log(log);

    // logger.log('log %s %o', this.self, log);

    if (this.vector >= log.vector) {
      return;
    }

    if (log.kind === 'init') {
      let { name, publicKey, status } = log.value;
      this.name = name;
      this.publicKey = publicKey;
      this.status = status;
    } else if (log.kind === 'profile') {
      let { name } = log.value;
      if (name) {
        this.name = name;
      }
    }

    this.vector = log.vector;

    await this.dao.updateContact(this);
    await this.dao.addContactLog(log.dump());

    this.manager.api.emit('timeline-log', log);

    // send all valid logs to peers
    await this.sendLogToFollowers(log);
  }

  async sendLogToFollowers (log) {
    await Promise.all(this.followers.map(async address => {
      try {
        await this.client.send({
          address,
          command: cmd.IPC_TIMELINE,
          payload: { address: this.address, log },
        });
      } catch (err) {
        // noop
      }
    }));
  }

  async pull () {
    assert(!this.self, 'Cannot pull from own profile');

    let { logs } = await this.client.request({
      address: this.address,
      command: cmd.IPC_GETTIMELINE,
      payload: this.vector,
    });

    logger.log('pull logs %O', logs);
  }

  async getTimeline (vector) {
    let address = this.address;
    let logs = await this.getLogs(vector);
    return { address, logs };
  }

  async getLogs (vector) {
    let logs = await this.dao.getContactLogs(this.address, vector);
    return logs.map(log => {
      log.value = JSON.parse(log.value);
      return new Log(log);
    });
  }
}

module.exports = { Contact };
