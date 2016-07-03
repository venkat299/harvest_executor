var chai = require('chai'),
    expect = chai.expect,
    assert = chai.assert,
    should = chai.should();
var Promise = require('bluebird')
var config = require('../../config.json')
    // ###### initializing test server ########
var intialize_server = require('../init_test_server.js')
var seneca;
//seneca.use('entity')
//=========== mock data ============
var route = 'role:executor,cmd:place_order'
    // sample ordr onj receved as opt 
var order_obj = {
    strategy_id: 'fifty_2_wk',
    track_id: "1463392269207/evaluator/YESBANK",
    tradingsymbol: "YESBANK",
    exchange: "NSE",
    transaction_type: "BUY",
    order_type: "MARKET",
    quantity: 10,
    product: "CNC",
    validity: "DAY"
}
var order_placed_dt = {
    "success": true,
    "prev_track_id": "1463392269207/evaluator/YESBANK",
    "curr_track_id": "1463392269236/executor/YESBANK",
    "cb_msg": 'kite.api:orders/regular',
    "cb_msg_obj": {
        "order_id": "151220000000000",
        "tradingsymbol": "YESBANK",
        "strategy_id": "fifty_2_wk"
    }
}
var order_executed_dt = {
        track_id: "1463392269236/executor/YESBANK",
        order_detail: {
            "order_id": "151220000000000",
            "exchange_order_id": "511220371736111",
            "user_id": "AB0012",
            "status": "COMPLETE",
            "tradingsymbol": "YESBANK",
            "exchange": "NSE",
            "transaction_type": "BUY",
            "average_price": 100.00,
            "price": 100.00,
            "quantity": 19,
            "filled_quantity": 19,
            "trigger_price": 0,
            "status_message": "",
            "order_timestamp": "2015-12-20 15:01:43",
            "checksum": "5aa3f8e3c8cc41cff362de9f73212e28"
        }
    }
    //==================================
describe('Order_executor{}-> shadowing mode', function() {
    before('initialize', initialize)
    after('clearing db', clear_db)
    describe('#place_order() -> default test', function() {
        var curr_track_id = route
        it('should return a proper/standard api response\n\tshould update `order_log` collection entry status', function(done) {
            this.timeout(5000);
            seneca.act(curr_track_id, order_obj, function(err, val) {
                if (err) done(err)
                default_api_test(val)
                expect(val.cb_msg_obj.order_id).to.exist
                done()
            })
        });
    })
})
var check_order_info = function(err, val) {
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
var default_api_test = function(val) {
    expect(val).to.be.an('object');
    expect(val.success).to.be.true;
    expect(val.cb_msg).to.exist;
    expect(val.curr_track_id).to.exist;
    expect(val.prev_track_id).to.have.property;
}

function initialize(done) {
    intialize_server.start().then(function(my_seneca) {
        //console.log(my_seneca)
        seneca = my_seneca
        seneca.client();
        var entity_1 = seneca.make$('strategy', {
            strategy_id: 'fifty_2_wk',
            budget: 10000,
            spent: 2000,
            equity_ceil: 0.2,
            shadowing: true
        })
        var entity_1_save$ = Promise.promisify(entity_1.save$, {
            context: entity_1
        })
        var entity_2 = seneca.make$('strategy_stock', {
            strategy_id: 'fifty_2_wk',
            tradingsymbol: 'YESBANK',
            stock_ceil: 0.4,
            nrr: 0.8
        })
        var entity_2_save$ = Promise.promisify(entity_2.save$, {
            context: entity_2
        })
        seneca.ready(function() {
            Promise.all([
                entity_1_save$(),
                entity_2_save$()
            ]).then(function(res) {
                done()
            })
        })
    })
}

function clear_db(done) {
    //mongoose.connection.db.dropDatabase(function(err, result) {
    //mongoose.connection.close()
    seneca.close(done)
    //})
}