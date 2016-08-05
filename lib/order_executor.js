var Promise = require('bluebird')
    //var this = require('this')
var place_order = function(opt, cb) {
    var seneca = this
    var forward_route = 'kite.api:orders/regular'
    var prev_track_id = opt.track_id
    var curr_track_id = Date.now() + '/executor/' + opt.tradingsymbol
        // determine if strategy is in shadow-trading mode
    seneca.make$('strategy').list$({
        strategy_id: opt.strategy_id
    }, function(err, ls) {
        if (err) cb(err)
        if ((ls.length <= 0)) cb(new Error("ERR:COLLECTION_COUNT_MISMATCH"));
        var ent = ls[0]
        var order_placed_dt = {} // object to be sent in callback
        if (ent.shadowing) {
            // do mock trading
            // mock object received from kite after placing order, confirming order reached kite platform
          var order_id =  generateUUID()// dummy order_id
          order_placed_dt = {
                "status": "success",
                "data": {
                    "order_id": order_id
                }
            }
        } else {
            // pass order to trading platform
                     var order_id =  generateUUID()// dummy order_id
          order_placed_dt = {
                "status": "success",
                "data": {
                    "order_id": order_id
                }
            }
        }
        order_placed_dt.data.tradingsymbol = opt.tradingsymbol //append more detail
        order_placed_dt.data.strategy_id = opt.strategy_id //append more detail
        var payload = {
                success: (order_placed_dt.status === 'success'), // check if order reached executor module
                prev_track_id: prev_track_id,
                curr_track_id: curr_track_id,
                cb_msg: forward_route,
                cb_msg_obj: order_placed_dt.data
            }
            // send the message to callback that request succesfully processed
        cb(null, payload)
        // after a certain time-out send a fake order succesfull msg request
         if (ent.shadowing)
        setTimeout(send_mock_confirmation.bind(seneca),1000, opt,order_placed_dt.data.order_id)
    })
}

function send_mock_confirmation(opt,order_id) {
  console.log('send_mock_confi...ion')
    var mock_dt = get_mock_order(opt,order_id)
    this.act('role:evaluator,cmd:update_order', mock_dt, function(err, val) {
        if (err) console.log('if', 'err:', err)
    })
}

function get_mock_order(opt,order_id) {
    return {
        track_id: "1463392269236/executor/YESBANK",
        order_detail: {
            "order_id": order_id,
            "exchange_order_id": "511220371736111",
            "user_id": "AB0012",
            "status": "COMPLETE",
            "tradingsymbol": opt.tradingsymbol,
            "exchange": "NSE",
            "transaction_type": opt.transaction_type,
            "average_price": opt.ltp,
            "price": opt.ltp,
            "quantity": opt.quantity,
            "filled_quantity": opt.quantity,
            "trigger_price": 0,
            "status_message": "",
            "order_timestamp": (new Date()).toISOString(),
            "checksum": "5aa3f8e3c8cc41cff362de9f73212e28"
        }
    }
}

function generateUUID() {
    var d = new Date().getTime();
    // if (window.performance && typeof window.performance.now === "function") {
    //     d += performance.now(); //use high-precision timer if available
    // }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}
module.exports.place_order = place_order;