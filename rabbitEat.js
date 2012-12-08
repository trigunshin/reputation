var amqp = require('amqp'),
    amqp_config = require("./conf/app_conf").amqpConfig;

var amqpUrl = amqp_config.defaultURL;
var rabbitMQ = amqp.createConnection({ url: amqpUrl});

rabbitMQ.addListener('error', function(err) {
  console.log("rabbit error:"+err);
});
rabbitMQ.addListener('ready', function() {
  console.log("rabbit ready...");
  var queue = rabbitMQ.queue('emailQueue', {//'exclusive':true,
      'durable':true
    }, function(q) {
      //get all messages for the rabbitExchange
      q.bind('rabbitEmailExchange','emails');
      // Receive messages
      q.subscribe({'routingKeyInPayload':true},
        function (message, headers, deliveryInfo) {
        // Print messages to stdout
        console.log(message.data.toString());
        console.log("key of:"+deliveryInfo.routingKey);
      });
    }
  );
}); 
