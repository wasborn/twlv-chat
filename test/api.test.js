const assert = require('assert');
const { Api } = require('../api');
const { Daemon } = require('twlv-swarm/daemon');
const logger = require('twlv-logger')('twlv-swarm:test:api');

describe('Api', () => {
  describe('constructor', () => {
    it('create new instance', () => {
      let ipcUrl = 'ws://localhost:1234';
      let api = createApi({ ipcUrl });
      assert.equal(api.ipcUrl, ipcUrl);
    });
  });

  describe('#start()', () => {
    it('listening at port', async () => {
      let daemon = createDaemon();
      await daemon.start();

      logger.log('port', daemon.port);
      let api = createApi(daemon);
      await api.start();

      assert(api.port);
    });
  });

  describe('on query', () => {
    it('', () => {

    })
  });

  let apis = [];
  function createApi ({ ipcUrl }) {
    let api = new Api({ ipcUrl });
    apis.push(api);
    return api;
  }

  let daemons = [];
  function createDaemon () {
    let daemon = new Daemon();
    daemons.push(daemon);
    return daemon;
  }

  afterEach(async () => {
    await Promise.all(apis.map(api => api.stop()));
    apis = [];

    await Promise.all(daemons.map(daemon => daemon.stop()));
    daemons = [];
  });
});
