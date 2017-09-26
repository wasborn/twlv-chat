const sqlite = require('sqlite');
const logger = require('twlv-logger')('twlv-chat:lib:dao');

class Dao {
  constructor ({ dbFile }) {
    this.dbFile = dbFile;
    this.profile = undefined;
  }

  async start () {
    this.db = await sqlite.open(this.dbFile);

    await this.ddl();
  }

  async stop () {
    await this.db.close();
  }

  async ddl () {
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS contact (
        address     TEXT      PRIMARY KEY NOT NULL,
        name        TEXT      NOT NULL,
        publicKey   TEXT      NOT NULL,
        self        INTEGER   NOT NULL
      )
    `);

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS session (
        id          TEXT    PRIMARY KEY NOT NULL,
        name        TEXT
      )
    `);

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS sessionPeer (
        sessionId   TEXT    NOT NULL,
        address     TEXT    NOT NULL,
        vector      INTEGER
      )
    `);

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS sessionLog (
        sessionId   TEXT      NOT NULL,
        address     TEXT      NOT NULL,
        vector      INTEGER   NOT NULL,
        kind        TEXT      NOT NULL,
        value       TEXT
      )
    `);
  }

  async getProfile () {
    if (!this.profile) {
      this.profile = await this.db.get('SELECT * FROM contact WHERE self = 1 LIMIT 1');
    }

    return this.profile;
  }

  async setProfile (profile) {
    if (await this.getProfile()) {
      await this.db.run(`
        UPDATE contact
        SET
          address = ?,
          name = ?,
          publicKey = ?
        WHERE self = 1
      `, profile.address, profile.name, profile.publicKey);
    } else {
      await this.db.run(`
        INSERT INTO contact (address, name, publicKey, self)
        VALUES (?, ?, ?, 1)
      `, profile.address, profile.name, profile.publicKey);
    }

    this.profile = undefined;
    await this.getProfile();
    return this.profile;
  }

  getSession (id) {
    return this.db.get('SELECT * FROM session WHERE id = ? LIMIT 1', id);
  }

  getSessionPeer (id, address) {
    return this.db.get('SELECT * FROM sessionPeer WHERE sessionId = ? AND address = ?', id, address);
  }

  getSessionPeers (id) {
    return this.db.all('SELECT * FROM sessionPeer WHERE sessionId = ?', id);
  }

  async createSession (id) {
    let dbSession = await this.getSession(id);
    if (!dbSession) {
      await this.db.run(`INSERT INTO session (id) VALUES (?)`, id);
    }
  }

  async updateSessionPeerVectors (id, updates) {
    // logger.log('update session peer vectors %s %O', id, updates);
    await Promise.all(Object.keys(updates).map(async address => {
      let vector = updates[address];
      await this.db.run(`
        UPDATE sessionPeer
        SET vector = ?
        WHERE sessionId = ? AND address = ?
      `, vector, id, address);
    }));
  }

  async addSessionLog (id, log) {
    await this.db.run(`
      INSERT INTO sessionLog (sessionId, address, vector, kind, value)
      VALUES (?, ?, ?, ?, ?)
    `, id, log.address, log.vector, log.kind, log.value);
  }

  getSessionLogs (id, filter) {
    if (!filter) {
      // all logs
      return this.db.all('SELECT * FROM sessionLog WHERE sessionId = ? ORDER BY vector', id);
    }

    console.log('filter', filter);
    throw new Error('Unimplemented yet');
  }

  getMessage (id, address, vector) {
    return this.db.get(`
      SELECT * FROM message
      WHERE sessionId = ?
      AND address = ?
      AND vector = ?
    `, id, address, vector);
  }
}

module.exports = { Dao };
