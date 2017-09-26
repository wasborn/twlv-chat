const sha3256 = require('js-sha3').sha3_256;

class Log {
  constructor ({ address, vector, kind, value, hash }) {
    this.address = address;
    this.vector = vector;
    this.kind = kind;
    this.value = value;
    this.hash = hash || this.generateHash();

    // TODO: add status sent, read
  }

  generateHash () {
    let { address, vector, kind, value } = this;
    return sha3256(JSON.stringify({ address, vector, kind, value }));
  }

  dump () {
    let { address, vector, kind, value, hash } = this;
    return { address, vector, kind, value: JSON.stringify(value), hash };
  }
}

module.exports = { Log };
