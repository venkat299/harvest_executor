/* eslint no-undef:0 */
/* eslint max-len:0 */
/* eslint no-unused-expressions:0 */
/* eslint no-unused-vars:0 */
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const should = chai.should();
const Promise = require('bluebird');
const config = require('../../config.json');
// ###### initializing test server ########
const intialize_server = require('../init_test_server.js');
let seneca;
// seneca.use('entity')
//= ========== mock data ============
// sample ordr onj receved as opt
const order_obj = {
  strategy_id: 'fifty_2_wk',
  track_id: '1463392269207/evaluator/YESBANK',
  tradingsymbol: 'YESBANK',
  exchange: 'NSE',
  transaction_type: 'BUY',
  order_type: 'MARKET',
  quantity: 10,
  product: 'CNC',
  validity: 'DAY',
};
// const order_placed_dt = {
//   success: true,
//   prev_track_id: '1463392269207/evaluator/YESBANK',
//   curr_track_id: '1463392269236/executor/YESBANK',
//   cb_msg: 'kite.api:orders/regular',
//   cb_msg_obj: {
//     order_id: '151220000000000',
//     tradingsymbol: 'YESBANK',
//     strategy_id: 'fifty_2_wk',
//   },
// };

// const order_executed_dt = {
//   track_id: '1463392269236/executor/YESBANK',
//   order_detail: {
//     order_id: '151220000000000',
//     exchange_order_id: '511220371736111',
//     user_id: 'AB0012',
//     status: 'COMPLETE',
//     tradingsymbol: 'YESBANK',
//     exchange: 'NSE',
//     transaction_type: 'BUY',
//     average_price: 100.00,
//     price: 100.00,
//     quantity: 19,
//     filled_quantity: 19,
//     trigger_price: 0,
//     status_message: '',
//     order_timestamp: '2015-12-20 15:01:43',
//     checksum: '5aa3f8e3c8cc41cff362de9f73212e28',
//   },
// };
const sample_signal_log = {
  transaction_type: 'BUY',
  tradingsymbol: 'SUZLON',
  strategy_id: 'fifty_2_wk',
  signal_status: 'PENDING_OPEN',
  log: [
    ['PENDING_OPEN', 'BUY', 1467599489386],
  ],
};

const sample_order_entity = {
  strategy_id: 'fifty_2_wk',
  order_id: '9eca55c7-f3cb-4a45-8855-cafe7d81a98e',
  is_approved: false,
  tradingsymbol: 'SUZLON',
  status: 'INIT',
  order_obj: {
    strategy_id: 'fifty_2_wk',
    prev_track_id: null,
    track_id: '1467574377440/evaluator/SUZLON',
    tradingsymbol: 'SUZLON',
    exchange: 'NSE',
    transaction_type: 'BUY',
    order_type: 'MARKET',
    quantity: 19,
    product: 'CNC',
    validity: 'DAY',
    ltp: 100,
  },
  status_log: [
    ['INIT', 1467574377440],
  ],
  kite_response: [{
    order_id: '0233ff12-4323-4c29-82fc-b2f839c4c301',
    tradingsymbol: 'SUZLON',
    strategy_id: 'fifty_2_wk',
  }],
  order_id: '0233ff12-4323-4c29-82fc-b2f839c4c301',
  id: 'yp27qh',
};

function initialize(done) {
  intialize_server.get_server((options) => {
    // console.log(options.seneca)
    seneca = options.seneca;
    seneca.client();
    const entity_1 = seneca.make$('strategy', {
      strategy_id: 'fifty_2_wk',
      budget: 10000,
      spent: 2000,
      equity_ceil: 0.2,
      shadowing: true,
    });
    const entity_1_save$ = Promise.promisify(entity_1.save$, {
      context: entity_1,
    });
    const entity_2 = seneca.make$('strategy_stock', {
      strategy_id: 'fifty_2_wk',
      tradingsymbol: 'YESBANK',
      stock_ceil: 0.4,
      nrr: 0.8,
    });
    const entity_2_save$ = Promise.promisify(entity_2.save$, {
      context: entity_2,
    });
    const entity_3 = seneca.make$('order_log', sample_order_entity);
    const entity_3_save$ = Promise.promisify(entity_3.save$, {
      context: entity_3,
    });
    const entity_4 = seneca.make$('order_log', sample_signal_log);
    const entity_4_save$ = Promise.promisify(entity_4.save$, {
      context: entity_4,
    });
    seneca.ready(() => {
      Promise.all([
        entity_1_save$(),
        entity_2_save$(),
        entity_3_save$(),
        entity_4_save$(),
      ]).then(() => {
        done();
      });
    });
  });
}

function check_order_info(err, val) {
  expect(val.cb_msg).to.match(/role:executor,cmd:place_order/);
  expect(val.cb_msg_obj).to.be.an('object');
  expect(val.cb_msg_obj.track_id).to.be.a('string');
  expect(val.cb_msg_obj.tradingsymbol).to.be.a('string');
  expect(val.cb_msg_obj.strategy_id).to.be.a('string');
  expect(val.cb_msg_obj.exchange).to.be.oneOf(['NSE']);
  expect(val.cb_msg_obj.transaction_type).to.be.oneOf(['BUY', 'SELL']);
  expect(val.cb_msg_obj.order_type).to.be.oneOf(['MARKET']);
  expect(val.cb_msg_obj.quantity).to.be.a('number');
  expect(val.cb_msg_obj.quantity % 1).to.be.equal(0);
  expect(val.cb_msg_obj.quantity).to.be.above(0);
  expect(val.cb_msg_obj.product).to.be.oneOf(['CNC']);
  expect(val.cb_msg_obj.validity).to.be.oneOf(['DAY']);
}

function default_api_test(val) {
  expect(val).to.be.an('object');
  expect(val.success).to.be.true;
  expect(val.cb_msg).to.exist;
  expect(val.curr_track_id).to.exist;
  expect(val.prev_track_id).to.have.property;
}

//= =================================
describe('Order_executor{}-> shadowing mode', () => {
  before('initialize', initialize);
  describe('#place_order() -> default test', () => {
    const curr_track_id = 'role:executor,cmd:place_order';
    it('should return a proper/standard api response', (done) => {
      // this.timeout(5000);
      seneca.act(curr_track_id, sample_order_entity, (err, val) => {
        if (err) done(err);
        default_api_test(val);
        expect(val.cb_msg_obj.order_id).to.exist;
        done();
      });
    });
  });
});