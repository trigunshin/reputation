var fs = require('fs');
var express = require('express'),
	urlParsing = require('url'),
    RedisStore = require('connect-redis')(express),
    app = module.exports = express.createServer();

/*Set up injections to routes module.*/
var stdlib = require("./stdlib").stdlib,
    routes = require('./index');
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

/* Set up websockets */
var socket = require("socket.io");
var io = socket.listen(app);
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10);
  io.set("log level", 2);
});

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
  socket.on('message',function(data,time,username) {
    socket.broadcast.emit('message',data,time,username);
    socket.emit('message',data,time,username,true);
  });
//  socket.on('connected',function(username) {
//    socket.nick = username;
//    users.push(username);
//    io.sockets.emit('user_connected',users);
//  });
//  socket.on('disconnect',function() {
//    users.splice(users.indexOf(socket.nick), 1);
//    socket.broadcast.emit('updated_user_list',users);
//  });
});


/* Set up RabbitMQ */
function pub_and_sub() {
  var exchange = conn.exchange(''); // get the default exchange
  var queue = conn.queue('queue1', {}, function() { // create a queue
    queue.subscribe(function(msg) { // subscribe to that queue
      console.log(msg.body); // print new messages to the console
    });
    // publish a message
    exchange.publish(queue.name, {body: 'Hello CloudAMQP!'}); 
  });
}

var rabbitUrl = process.env.CLOUDAMQP_URL || "amqp://localhost"; // default to localhost
var conn = amqp.createConnection({url: rabbitUrl}); // create the connection
conn.on('ready', pub_and_sub); // when connected, call "pub_and_sub"
conn.on('error', function(err) {
  console.log("rabbit error:"+err);
});

function sendMsg(msg) {
  console.log(msg);
  if(exchange) {
    exchange.publish('key.a',msg);
  }
  else {
    console.log("exchange not around now...");
  }
}
/*/rabbitMQ */
routes.setStdlib(stdlib);
routes.setRedisClient(redisClient);

// Configuration
var logstring = ":remote-addr - [:date] \":method :url\" :status len\::res[content-length] 'ref :referrer' :response-time ms";
var logStream = fs.createWriteStream('./log.log',{flags:'a'});
app.configure(function(){
	app.set('jsonp callback', true);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({ secret: "hue1k3yboard cat",
	                      store: new RedisStore({ client: redisClient}) })
           );
    app.dynamicHelpers({session:function(req, res) {
        return req.session;
    }});
    app.use(express.logger({format:logstring, stream:logStream}));
    app.use(require('stylus').middleware({ src: __dirname + '/public', compress:true, force:true}));
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

// Routes
app.get('/logout', routes.logoutGet);
app.get('/signup', routes.signupGet);
app.post('/login', routes.loginPost);
app.post('/signup', routes.signupPost);

app.get('/userData/:userScriptId/:website/:articleId/:username/:userId/:commentId/add', routes.addComment);
app.get('/userComments/:userScriptId/:website/:userId/get', routes.userCommentGet);

app.get('/getUserFile/:site/get', routes.getUserGreasemonkeyScript);
app.get('/getUserFile/:site/*.user.js', routes.getUserGreasemonkeyScript);
app.get('/profile', routes.profileGet);

app.get('/sockets', routes.sockets);
app.get('/', routes.index);

app.get('/rabbitTest', function(req, res) { 
	// your normal server code 
  	var path = urlParsing.parse(req.url).pathname;
  	console.log("sending path as message:"+path);
	sendMsg(path);
	res.writeHead(200, {'Content-Type':'text/html'});
	res.write('OK', 'utf8');
	res.end();
});

var APP_PORT = process.env.PORT || 3000;
app.listen(APP_PORT);
console.log("Express server listening on port %d in %s mode", APP_PORT, app.settings.env);
