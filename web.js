const Bundle = require('bono');
const { devMiddleware, hotMiddleware } = require('koa-webpack-middleware');
const webpack = require('webpack');

class Web extends Bundle {
  constructor ({ env = 'dev' }) {
    super();

    if (env === 'dev') {
      let compile = webpack(require('./webpack.config')({ hmr: true }));

      this.use(require('./middlewares/log')());
      this.use(devMiddleware(compile, { noInfo: true }));
      this.use(hotMiddleware(compile));
    }
  }
}

module.exports = { Web };
