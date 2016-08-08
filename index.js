const executor = require('./lib/order_executor.js');

let opts = {};

function init(options) {
  const seneca = this;
  const extend = seneca.util.deepextend;
  opts = extend(opts, options);

  // ======= executor =========== //
  seneca.use(executor, opts);
  // seneca.add('role:executor,cmd:place_order', executor.place_order.bind(seneca))

  return {
    name: 'harvest_executor',
  };
}

module.exports = init;