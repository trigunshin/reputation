var fs = require('fs');
var express = require('express'),
    RedisStore = require('connect-redis')(express),
    app = module.exports = express.createServer();

/*Set up injections to routes module.*/
var stdlib = require("./stdlib").stdlib,
    routes = require('./index');

var client;
if (process.env.REDISTOGO_URL) {
    console.log("Connecting to redis @ url:" + process.env.REDISTOGO_URL);
    var rtg  = require("url").parse(process.env.REDISTOGO_URL);
    client = require("redis").createClient(rtg.port, rtg.hostname);
    client.auth(rtg.auth.split(":")[1]);
} else if(process.env.REDIS_URL) {
    console.log("Connecting to redis @ default port on host:" + process.env.REDIS_URL);
    client = require("redis").createClient(6379, process.env.REDIS_URL);
} else {
    console.log("Connecting to redis @ default localhost");
    client = require("redis").createClient();
    client.on("error", function(err) {
        console.warn("Redis error:"+err);
    });
}
client.on("error", function(err) {
    console.log("error:" + client.host + ":"+client.port+"-"+err);
});
routes.setStdlib(stdlib);
routes.setRedisClient(client);

// Configuration
var logstring = ":remote-addr - [:date] \":method :url\" :status len\::res[content-length] 'ref :referrer' :response-time ms";
var logStream = fs.createWriteStream('./log.log',{flags:'a'});
app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({ secret: "hue1k3yboard cat",
	                      store: new RedisStore({ client: client}) })
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
app.get('/getUserFile', routes.getUserGreasemonkeyScript);
app.get('/getUserFile/user_tracker.user.js', routes.getUserGreasemonkeyScript);
app.get('/profile', routes.profileGet);

app.get('/', routes.index);

var APP_PORT = process.env.PORT || 3000;
app.listen(APP_PORT);
console.log("Express server listening on port %d in %s mode", APP_PORT, app.settings.env);
