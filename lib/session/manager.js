const { Session } = require('./session');
const logger = require('twlv-logger')('twlv-chat:lib:session:manager');

class Manager {
  constructor ({ api }) {
    this.api = api;
    this.sessions = [];
  }

  get address () {
    return this.api.profile.address;
  }

  get dao () {
    return this.api.dao;
  }

  async get (id) {
    let session = this.sessions.find(session => session.id === id);
    if (!session) {
      let dbSession = await this.dao.getSession(id);
      if (dbSession) {
        throw new Error('Unimplemented get exist db session');
      }
    }

    return session;
  }

  async create (id) {
    let session = new Session(this, id);
    this.sessions.push(session);
    await this.dao.createSession(id);

    this.api.emit('session-create', session);

    return session;
  }
}

module.exports = { Manager };
