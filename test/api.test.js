const assert = require('assert');
const { Api } = require('../api');
const { Daemon } = require('twlv-swarm/daemon');
const Tcp = require('twlv-swarm/channel/tcp');
const logger = require('twlv-logger')('twlv-chat:test:api');

describe('Api', () => {
  describe('#start()', () => {
    it('listening at port', async () => {
      let daemon = createDaemon();
      await daemon.start();

      let api = createApi(daemon);
      await api.start();

      // assert(api.port);
    });
  });

  describe('#setProfile()', () => {
    it('return profile', async () => {
      let daemon = createDaemon();
      await daemon.start();

      let api = createApi(daemon);
      await api.start();

      assert.notEqual(api.profile.name, 'foo');

      await api.setProfile(Object.assign({}, api.profile, { name: 'foo' }));

      assert.equal(api.profile.name, 'foo');
    });
  });

  describe('#createPrivateSession()', () => {
    it('create new private session by peer address', async () => {
      let daemon1 = createDaemon();
      let daemon2 = createDaemon();

      await daemon1.start();
      await daemon2.start();

      // await connect(daemon2, daemon1);

      let api1 = createApi(daemon1);
      let api2 = createApi(daemon2);

      await api1.start();
      await api2.start();

      let session = await api1.createPrivateSession(daemon2.address);
      let session2 = await api1.getPrivateSession(daemon2.address);

      assert.equal(session, session2);
      assert.equal(session.peers.length, 2);
    });

    it.only('resolve conflict private session', async () => {
      let daemon1 = createDaemon();
      let daemon2 = createDaemon();

      await daemon1.start();
      await daemon2.start();

      await connect(daemon2, daemon1);

      let api1 = createApi(daemon1);
      let api2 = createApi(daemon2);

      await api1.start();

      let session = await api1.createPrivateSession(daemon2.address);
      await api1.sendMessage(session.id, 'Foo1 1');

      await require('es7-sleep')(10);

      await api2.start();

      let session2 = await api2.createPrivateSession(daemon1.address);
      await api2.sendMessage(session2.id, 'Foo2 1');

      await require('es7-sleep')(100);

      let logs1 = await api1.getLogs(session.id);
      let logs2 = await api2.getLogs(session.id);

      // console.log(logs1);
      // console.log(logs2);
      assert.equal(logs1.logs.length, 4);
      assert.equal(logs2.logs.length, 4);
    });
  });

  describe('#sendMessage()', () => {
    it('send message to session', async () => {
      let daemon1 = createDaemon();
      let daemon2 = createDaemon();

      await daemon1.start();
      await daemon2.start();

      await connect(daemon2, daemon1);

      let api1 = createApi(daemon1);
      let api2 = createApi(daemon2);

      await api1.start();
      await api2.start();

      let session;

      await new Promise(async resolve => {
        session = await api1.createPrivateSession(daemon2.address);
        api2.once('session-create', resolve);
      });

      await api1.sendMessage(session.id, 'Foo 1');
      await api2.sendMessage(session.id, 'Foo 2');

      await require('es7-sleep')(10);

      let logs1 = await api1.getLogs(session.id);
      let logs2 = await api2.getLogs(session.id);

      assert.equal(logs1.logs.length, 3);
      assert.equal(logs2.logs.length, 3);
    });
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
    daemon.swarm.addModule(new Tcp());
    daemons.push(daemon);
    return daemon;
  }

  async function connect (daemon1, daemon2) {
    await daemon1.swarm.connect(daemon2.swarm.advertisement.urls[0]);
  }

  afterEach(async () => {
    await Promise.all(apis.map(api => api.stop()));
    apis = [];

    await Promise.all(daemons.map(daemon => daemon.stop()));
    daemons = [];
  });

  before(() => process.on('unhandledRejection', err => logger.log('unhandledRejection', err)));
  after(() => process.removeAllListeners('unhandledRejection'));
});
