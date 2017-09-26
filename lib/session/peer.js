class Peer {
  constructor ({ address, vector = 0 }) {
    this.address = address;
    this.vector = vector;
  }

  get vectorTime () {
    return Math.floor(this.vector / 10);
  }

  get vectorSeq () {
    return this.vector % 10;
  }
}

module.exports = { Peer };
