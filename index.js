var executor = require('./lib/order_executor.js');

var opts = {};

module.exports = function(options) {

	var seneca = this
	var extend = seneca.util.deepextend
	opts = extend(opts, options)

	this.executor_config = options
	seneca.add('role:executor,cmd:place_order', executor.place_order.bind(seneca))
	//seneca.add('role:executor,cmd:sell', executor.sell)
		//seneca.add('role:info,req:part', aliasGet)

	return {
		name: 'harvest_executor'
	}


}