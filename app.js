require('nodefly').profile(
    process.env.NODEFLY_APPLICATION_KEY,
    ["reputation",'Heroku']
);

var fs = require('fs');
var express = require('express'),
	urlParsing = require('url'),
	amqp = require('amqp'),
    RedisStore = require('connect-redis')(express),
    app = module.exports = express.createServer();

/*Set up injections to routes module.*/
var stdlib = require("./stdlib").stdlib,
    routes = require('./index');
routes.setStdlib(stdlib);

/* Set up datamux */
var datamux = require("./data/datamux");
routes.setDataMux(datamux);
/* Set up Redis client */
var redisClient;
datamux.getRedis(function(redis) {
  redisClient = redis;
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
});

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
app.get('/activate', routes.activateGet);
app.post('/login', routes.loginPost);
app.post('/signup', routes.signupPost);

app.get('/userData/:userScriptId/:website/:articleId/:username/:userId/:commentId/add', routes.addComment);
app['delete']('/userData/:userScriptId/:website/:articleId/:username/:userId/:commentId/remove', routes.removeComment);
app.get('/userComments/:userScriptId/:website/:userId/get', routes.userCommentGet);

app.get('/userComments/:userScriptId/:website/get',routes.getCommentGroup);

app.get('/getUserFile/:site/get', routes.getUserGreasemonkeyScript);
app.get('/getUserFile/:site/*.user.js', routes.getUserGreasemonkeyScript);
app.get('/profile', routes.profileGet);

app.get('/sockets', routes.sockets);
app.get('/', routes.index);

var APP_PORT = process.env.PORT || 3000;
app.listen(APP_PORT);
console.log("Express server listening on port %d in %s mode", APP_PORT, app.settings.env);
