var dataMux = require("../data/datamux");

/* Set up AMQP */
var rabbitMQ;
dataMux.getRabbit(function(rabbit) {
  rabbitMQ = rabbit;
  initRabbit();
});
/* End AMQP */

var mailer = require("./mailer"),
    mailerDict = {};

var SIGNUP_STRING="reputation.email.signup";
var EMAIL_TOPICS="reputation.email.*";

/* set up function/topic mappings */
mailerDict[SIGNUP_STRING] = function(message, headers, deliveryInfo) {
  mailer.userSignup(message);
};

var initRabbit = function() {
  var queue = rabbitMQ.queue('emailQueue', {//'exclusive':true,
      'durable':true
    }, function(q) {
      //get all messages for the rabbitExchange
      q.bind('rabbitEmailExchange',EMAIL_TOPICS);
      // Receive messages
      q.subscribe({'routingKeyInPayload':true},
          function (message, headers, deliveryInfo) {
        console.log("key of:"+deliveryInfo.routingKey);
        var msgObj = JSON.parse(message.data.toString());
        mailerDict[deliveryInfo.routingKey](msgObj, function(err, msg) {
          if(err) console.warn("mail error:"+err);
          else console.log("mailer returned message:"+msg);
        });
      });
    }
  );
};