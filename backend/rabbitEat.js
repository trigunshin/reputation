/* Set up Mongo client */
var dbmux = require("./db/dbmux");

/* Set up redis client */
var redisClient;
if (process.env.REDISTOGO_URL) {
    console.log("Connecting to redis @ url:" + process.env.REDISTOGO_URL);
    var rtg  = require("url").parse(process.env.REDISTOGO_URL);
    redisClient = require("redis").createClient(rtg.port, rtg.hostname);
    redisClient.auth(rtg.auth.split(":")[1]);
} else if(process.env.REDIS_URL) {
    console.log("Connecting to redis @ default port on host:" + process.env.REDIS_URL);
    redisClient = require("redis").createClient(6379, process.env.REDIS_URL);
} else {
    console.log("Connecting to redis @ default localhost");
    redisClient = require("redis").createClient();
}
redisClient.on("error", function(err) {
    console.log("error:" + redisClient.host + ":"+redisClient.port+"-"+err);
});

dbmux.setRedisClient(redisClient);

/* End Mongo/Redis */
/* Set up AMQP */
var amqp = require('amqp'),
    amqp_config = require("./conf/app_conf").amqpConfig;

var amqpUrl = amqp_config.defaultURL;
var rabbitMQ = amqp.createConnection({ url: amqpUrl});

/* End AMQP */
var mailer = require("./mailer"),
    mailerDict = {};

var SIGNUP_STRING="reputation.email.signup";
var EMAIL_TOPICS="reputation.email.*";

mailerDict[SIGNUP_STRING] = function(message, headers, deliveryInfo) {
  mailer.userSignup(message);
};


rabbitMQ.addListener('error', function(err) {
  console.log("rabbit error:"+err);
});
rabbitMQ.addListener('ready', function() {
  console.log("rabbit ready...");
  var queue = rabbitMQ.queue('emailQueue', {//'exclusive':true,
      'durable':true
    }, function(q) {
      //get all messages for the rabbitExchange
      q.bind('rabbitEmailExchange',EMAIL_TOPICS);
      // Receive messages
      q.subscribe({'routingKeyInPayload':true},
        function (message, headers, deliveryInfo) {
        // Print messages to stdout
        console.log(message.data.toString());
        console.log("key of:"+deliveryInfo.routingKey);
        mailerDict[deliveryInfo.routingKey](message.data.toString(), function(err, msg) {
        	console.log("mailer returned message:"+msg);
        });
      });
    }
  );
}); 
