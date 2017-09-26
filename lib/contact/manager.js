const { Contact } = require('./contact');

class Manager {
  constructor ({ api }) {
    this.api = api;
    this.profile = {};
  }

  get dao () {
    return this.api.dao;
  }

  get client () {
    return this.api.client;
  }

  async start () {
    let profile = await this.dao.getProfile();
    if (profile) {
      this.profile = new Contact(this, profile);
    } else {
      let contact = new Contact(this, {
        address: this.client.address,
        self: true,
      });

      let name = `User ${this.client.address.substr(0, 4)}`;
      let publicKey = this.client.identity.publicKey;
      let status = '';

      await contact.init({ name, publicKey, status });

      this.profile = new Contact(this, contact);
    }
  }

  async getContact (address) {
    let dbContact = await this.dao.getContact(address);
    if (dbContact) {
      return new Contact(this, dbContact);
    }
  }
}

module.exports = { Manager };
