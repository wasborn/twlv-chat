const { Swarm } = require('twlv-swarm');
const FileStorage = require('twlv-storage-file');
const { Daemon } = require('twlv-swarm/daemon');
const { Config } = require('twlv-config');

module.exports = function createDaemon (dataDir, port) {
  let modules = [
    { kind: 'c', name: 'tcp', autostart: true },
    { kind: 'd', name: 'mdns', autostart: true },
  ];
  let config = new Config({ dataDir, port, modules });
  // config.file = path.join(dataDir, 'twlvd.json');
  let swarm = new Swarm({ storage: new FileStorage({ dataDir }) });
  let daemon = new Daemon(config, swarm);

  return daemon;
};
