const uuidv1 = require('uuid/v1');

class Request {
  constructor (endCallback, timeout = 3000) {
    this.id = uuidv1();
    this.endCallback = endCallback;
    this.timeout = timeout;
  }

  async run (fn) {
    try {
      let value = await new Promise(async (resolve, reject) => {
        // TODO: implement timeout
        this.resolve = resolve;
        this.reject = reject;
        try {
          await fn(this);
        } catch (err) {
          reject(err);
        }
      });

      this.endCallback(this);

      return value;
    } catch (err) {
      this.endCallback(this);

      throw err;
    }
  }
}

module.exports = { Request };
