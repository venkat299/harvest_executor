var Promise = require('bluebird')
	//var this = require('this')

var place_order = function(opt, cb) {

	console.log('order_received_for_execution', opt)

	var forward_route = 'kite.api:orders/regular'
	var prev_track_id = opt.track_id

	var order_placed_dt = {
		"status": "success",
		"data": {
			"order_id": "151220000000000"
		}
	}

	var curr_track_id = Date.now() + '/executor/' + opt.tradingsymbol


	cb(null, {
		success: true,
		prev_track_id: prev_track_id,
		curr_track_id: curr_track_id,
		cb_msg: forward_route,
		cb_msg_obj: null
	})

	// object received from kite after placing order confirming order reached kite platform
	var order_placed_dt = {
		"status": "success",
		"data": {
			"order_id": "151220000000000"
		}
	}

	order_placed_dt.data.tradingsymbol = opt.tradingsymbol //append more detail
	order_placed_dt.data.strategy_id = opt.strategy_id //append more detail
	


	var payload = {
		success: (order_placed_dt.status==='success'), // check if order reached executor module
		prev_track_id: prev_track_id,
		curr_track_id: curr_track_id,
		cb_msg: forward_route,
		cb_msg_obj: order_placed_dt
	}

	//this.act('role:evaluator,cmd:register_order', payload, function(err, val) {

	//})


}

module.exports.place_order = place_order;