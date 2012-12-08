var http = require('http'),
	url = require('url'),
	amqp = require('amqp'),
	amqp_config = require("./conf/app_conf").amqpConfig;
var amqpUrl = amqp_config.defaultURL;
var exchange;

function sendMsg(msg) {
  console.log(msg);
  if(exchange) {
    exchange.publish('emails',msg,{},function(errExists){;});
  } else {
    console.log("exchange not around now...");
  }
}

var server = http.createServer(function(req, res) { 
  var path = url.parse(req.url).pathname;
  sendMsg(path);
  res.writeHead(200, {'Content-Type':'text/html'});
  res.write('OK', 'utf8');
  res.end();
});

var rabbitMQ = amqp.createConnection({url:amqpUrl});
rabbitMQ.addListener('ready', function() {
  console.log("rabbit ready");
  rabbitMQ.exchange('rabbitEmailExchange', {
      'type':'topic',
      'durable':true
    }, function(exch) {
    	exchange = exch;
    	console.log("exchange open");
    }
  );
});
rabbitMQ.addListener('error', function(err) {
  console.log("rabbit error:"+err);
});
server.listen(8081);