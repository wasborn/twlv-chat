const logger = require('twlv-logger')('twlv-chat/middlewares/log');

module.exports = function () {
  return async (ctx, next) => {
    try {
      await next();
      logger.log('%o %s %s', ctx.status, ctx.method, ctx.url);
    } catch (err) {
      logger.log('%o %s %s', ctx.status, ctx.method, ctx.url);
      throw err;
    }
  };
};
