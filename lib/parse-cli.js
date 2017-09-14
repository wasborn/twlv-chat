const yargs = require('yargs');
const path = require('path');

module.exports = function parseCli () {
  return yargs.epilog('twlv-chat')
    .strict(true)
    .showHelpOnFail(true, 'Specify --help for available options')
    .version()
    .option('d', {
      alias: 'data-dir',
      describe: 'Data directory',
      default: path.join(require('os').homedir(), '.twlv'),
      coerce: value => path.resolve(value),
    })
    .option('p', {
      alias: 'port',
      describe: 'Application port',
      default: 8080,
    })
    .option('i', {
      alias: 'ipc-port',
      describe: 'Swarm IPC port',
      default: 0,
    })
    .options('c', {
      alias: 'connect',
      describe: 'Connect IPC url',
    })
    .alias('v', 'version')
    .help()
    .alias('h', 'help')
    .argv;
};
