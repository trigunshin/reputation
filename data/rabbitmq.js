var amqp = require("amqp");
var rabbitMQ;

var get = function(config, cb) {
  if(rabbitMQ) return cb(rabbitMQ);
  //initialize it
  var amqp_config = config.amqpConfig;
  var amqpUrl = amqp_config.defaultURL;
  rabbitMQ = amqp.createConnection({url:amqpUrl});
  rabbitMQ.addListener('error', function(err) {
    console.log("rabbit error:"+err);
  });
  rabbitMQ.addListener('ready', function() {
    console.log("rabbit ready on: "+amqpUrl);
    return cb(rabbitMQ);
  });
};

exports.get = get;