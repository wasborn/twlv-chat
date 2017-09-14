const { Web } = require('../web');
const { Api } = require('../api');
const http = require('http');
const logger = require('twlv-logger')('twlv-chat:dev');
const createDaemon = require('../lib/create-daemon');
const parseCli = require('../lib/parse-cli');
const path = require('path');

process.on('unhandledRejection', err => {
  logger.error('Unhandled rejection', err);
});

process.on('uncaughtException', function (err) {
  logger.error('Uncaught exception', err);
});

(async () => {
  const { dataDir, port, ipcPort, connect } = parseCli();
  const env = process.env.NODE_ENV || 'dev';

  try {
    let daemon;
    let ipcUrl;
    if (connect) {
      ipcUrl = connect;
    } else {
      daemon = createDaemon(dataDir, ipcPort);
      await daemon.start();
      ipcUrl = `ws://localhost:${daemon.port}`;
    }

    const storeFile = path.join(dataDir, 'db.json');
    let storeConfig = {
      connections: [
        {
          name: 'default',
          adapter: 'disk',
          file: storeFile,
        },
      ],
    };

    logger.log('Environment: %s', env);
    logger.log('Store file: %s', storeFile);

    let web = new Web({ env });
    let api = new Api({ ipcUrl, storeConfig });
    let server = http.Server(web.callback());
    server.listen(port, () => logger.log(`Server listening at http://localhost:${port}`));
    api.start(server);

    ['SIGTERM', 'SIGINT', 'SIGBREAK', 'SIGUSR2'].forEach(signal => {
      process.once(signal, async () => {
        logger.log('Caught signal %o', signal);

        api.stop();
        server.close();
        if (daemon) {
          await daemon.stop();
        }

        process.kill(process.pid, signal);
      });
    });
  } catch (err) {
    console.error('[ERROR]', err);
  }
})();
