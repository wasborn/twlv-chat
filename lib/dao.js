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
    if (this.db) {
      await this.db.close();
    }
  }

  async ddl () {
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS contact (
        address     TEXT      PRIMARY KEY NOT NULL,
        name        TEXT      NOT NULL,
        publicKey   TEXT      NOT NULL,
        status      TEXT      NOT NULL,
        vector      INTEGER   NOT NULL,
        self        INTEGER   NOT NULL
      )
    `);

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS contactLog (
        address     TEXT      NOT NULL,
        vector      INTEGER   NOT NULL,
        kind        TEXT      NOT NULL,
        value       TEXT
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
        vector      INTEGER NOT NULL
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
          status = ?
          vector = ?
        WHERE self = 1
      `, profile.address, profile.name, profile.publicKey, profile.status, profile.vector);
    } else {
      await this.db.run(`
        INSERT INTO contact (address, name, publicKey, status, vector, self)
        VALUES (?, ?, ?, ?, ?, 1)
      `, profile.address, profile.name, profile.publicKey, profile.status, profile.vector);
    }

    this.profile = undefined;
    await this.getProfile();
    return this.profile;
  }

  getSession (id) {
    return this.db.get('SELECT * FROM session WHERE id = ? LIMIT 1', id);
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

  async addSessionLog (id, log) {
    await this.db.run(`
      INSERT INTO sessionLog (sessionId, address, vector, kind, value)
      VALUES (?, ?, ?, ?, ?)
    `, id, log.address, log.vector, log.kind, log.value);
  }

  getSessionLogs (id, filter) {
    if (!filter) {
      // all logs
      return this.db.all(`
        SELECT *
        FROM sessionLog
        WHERE sessionId = ?
        ORDER BY vector
      `, id);
    }

    // console.log('filter', filter);
    throw new Error('Unimplemented yet');
  }

  getContact (address) {
    return this.db.get('SELECT * FROM contact WHERE address = ?', address);
  }

  async addContact (contact) {
    let dbContact = await this.getContact(contact.address);
    if (dbContact) {
      throw new Error('Contact already exists');
    }

    return this.db.run(`
      INSERT INTO contact (address, name, publicKey, status, vector, self)
      VALUES (?, ?, ?, ?, ?, 0)
    `, contact.address, contact.name, contact.publicKey, contact.status, contact.vector);
  }

  async updateContact (contact) {
    let dbContact = await this.getContact(contact.address);
    if (!dbContact) {
      throw new Error('Failed update missing contact');
    }

    return this.db.run(`
      UPDATE contact
      SET name = ?, publicKey = ?, status = ?, vector = ?
      WHERE address = ?
    `, contact.name, contact.publicKey, contact.status, contact.vector, contact.address);
  }

  getContactLogs (address, vector = 0) {
    return this.db.all(`
      SELECT *
      FROM contactLog
      WHERE address = ?
      AND vector > ?
      ORDER BY vector
    `, address, vector);
  }

  async addContactLog (log) {
    await this.db.run(`
      INSERT INTO contactLog (address, vector, kind, value)
      VALUES (?, ?, ?, ?)
    `, log.address, log.vector, log.kind, log.value);
  }
}

module.exports = { Dao };
