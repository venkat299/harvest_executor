/* eslint max-len:0 */
// const Promise = require('bluebird');
const logger = require('winston');
// var this = require('this')
function mock_order_detail(opt) {
  logger.debug('generating mock_order detail...');
  const order = opt.data;

  return {
    track_id: '1463392269236/executor/YESBANK',
    order_detail: {
      order_id: order.order_id,
      exchange_order_id: '511220371736111',
      user_id: 'AB0012',
      status: 'COMPLETE',
      tradingsymbol: order.tradingsymbol,
      exchange: 'NSE',
      transaction_type: order.transaction_type,
      average_price: order.ltp,
      price: order.ltp,
      quantity: order.quantity,
      filled_quantity: order.quantity,
      trigger_price: 0,
      status_message: '',
      order_timestamp: (new Date()).toISOString(),
      checksum: '5aa3f8e3c8cc41cff362de9f73212e28',
    },
  };
}

function send_mock_confirmation(opt) {
  logger.debug('send_mock_confirmation ....');
  const mock_dt = mock_order_detail(opt);
  this.act('role:evaluator,cmd:update_order', mock_dt, (err) => {
    if (err) logger.debug('if', 'err:', err);
  });
}

function place_order(opt, cb) {
  const seneca = this;
  const forward_route = 'kite.api:orders/regular';
  const prev_track_id = opt.order_obj.track_id;
  const curr_track_id = `${Date.now()}'/executor/'${opt.tradingsymbol}`;
  const order_id = opt.order_id;

  // determine if strategy is in shadow-trading mode
  seneca.make$('strategy').list$({
    strategy_id: opt.strategy_id,
  }, (err, ls) => {
    if (err) cb(err);
    if ((ls.length <= 0)) cb(new Error('ERR:COLLECTION_COUNT_MISMATCH'));
    const ent = ls[0];
    let order_placed_dt = {}; // object to be sent in callback
    if (ent.shadowing) {
      // do mock trading
      // mock object received from kite after placing order, confirming order reached kite platform
      order_placed_dt = {
        status: 'success',
        data: {
          order_id,
        },
      };
    } else {
      // pass order to trading platform

      order_placed_dt = {
        status: 'success',
        data: {
          order_id,
        },
      };
    }
    order_placed_dt.data.tradingsymbol = opt.tradingsymbol;
    order_placed_dt.data.strategy_id = opt.strategy_id;
    const payload = {
      success: (order_placed_dt.status === 'success'), // check if order reached executor module
      prev_track_id,
      curr_track_id,
      cb_msg: forward_route,
      cb_msg_obj: order_placed_dt.data,
    };
    // send the message to callback that request succesfully processed
    logger.debug('despatch to evaluator:', payload);
    cb(null, payload);

    // ==== commenting out as manually approving each order ====
    // ==== shadowing if true ==========
    // after a certain time-out send a fake order succesfull msg request
    if (ent.shadowing) setTimeout(send_mock_confirmation.bind(seneca), 1000, order_placed_dt);
  });
}

// function approve_order(opt, cb) {
//   const seneca = this;

//   if (!opt.order_id) cb(new Error('ERR:PARAMETER_NOT_DEFINED'));
//   seneca.make$('order_log').list$({
//     order_id: opt.order_id,
//   }, (err, ls) => {
//     if (err) cb(err);
//     if ((ls.length <= 0)) cb(new Error('ERR:COLLECTION_COUNT_MISMATCH'));
//     const order_detail = ls[0];
//     send_mock_confirmation(order_detail);
//   });
// }

function init() {
  // const app_config = options.app_config;
  const seneca = this;
  /* Retrieves all the signals for the given strategy
   */
  this.add('role:executor,cmd:place_order', place_order.bind(seneca));
}
//= ========= seneca api export
module.exports = init;