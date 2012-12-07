var amqp = require('amqp'),
    amqp_config = require("./conf/app_conf").amqpConfig;

var amqpUrl = process.env.CLOUDAMQP_URL || amqp_config.defaultURL;
var rabbitMQ = amqp.createConnection({ url: amqpUrl});

rabbitMQ.addListener('error', function(err) {
  console.log("rabbit error:"+err);
});
rabbitMQ.addListener('ready', function(){
  console.log("ready...");
  var queue = rabbitMQ.queue('testQueue',{'exclusive':true}, function(q){
      //get all messages for the rabbitExchange
      q.bind('rabbitExchange','#');
      // Receive messages
      q.subscribe(function (message) {
        // Print messages to stdout
        console.log(message.data.toString());
      });
    });
}); 
