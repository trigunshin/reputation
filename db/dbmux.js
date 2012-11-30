var mongoDB = require('mongodb'),
    Db = mongoDB.Db,
    Server = mongoDB.Server;
var stdlib = require("../stdlib").stdlib;

var mongoLabURI = process.env.MONGOLAB_URI;
var SERVER = process.env.MONGO_HOST || "localhost",
    PORT = process.env.MONGO_PORT || 27017;

var stdlib = require("../stdlib").stdlib;
var redisClient;

var getMongoLabConnection = function(collectionName) {
	var cache = {};
	var key = collectionName;
	return function(cb) {
		if(cache[key]) return cb(null, cache[key]);
		
		mongoDB.connect(mongoLabURI, stdlib.errorClosure(cb, function(openedDB) {
			openedDB.collection(collectionName, stdlib.errorClosure(cb, function(opened) {
				cb(null, cache[key] = opened);
			}));
		}));
	};
};
var getDedicatedConnection = function (collectionName, databaseName) {
	var cache = {};
	var key = collectionName+"___"+databaseName;
	return function(cb) {
		if(cache[key]) return cb(null, cache[key]);
		
		var dbObject = new Db(databaseName, new Server(SERVER, PORT, {"auto_reconnect":true}),{"safe":false});
		dbObject.open(stdlib.errorClosure(cb, function(openedDB) {
			openedDB.collection(collectionName, stdlib.errorClosure(cb, function(opened) {
				cb(null, cache[key] = opened);
			}));
		}));
	};
};

var getConnection;
if(mongoLabURI) {
	console.log("DBMux connecting to mongo @ " + mongoLabURI);
	getConnection = getMongoLabConnection;
} else {
	console.log("DBMux connecting to mongo @ host&port:"+SERVER+":"+PORT);
	getConnection = getDedicatedConnection;
}

var files = ["users", "comment"];
var perDBFile = function(applyToSubclass) {
    for(var i=0,iLen=files.length;i<iLen;i++) {
        var curName = files[i];
        var curObj = exports[curName] || require("./"+curName);//don't require() repeatedly
        applyToSubclass(curObj, curName);
    }
};

/*helper functions to run through the perDBFile() method on each file*/
var loadFiles = function(curObj, curName) {
    curObj.setCollectionAccessor(getConnection);
    exports[curName] = curObj;
};
var setSubclassRedis = function(curObj) {
    curObj.setRedis(redisClient);
};
var setSubclassStdlib = function(curObj) {
    curObj.setStdlib(stdlib);
};

function setRedisClient(aRedis) {
    redisClient = aRedis;
    perDBFile(setSubclassRedis);
};

perDBFile(loadFiles);
perDBFile(setSubclassStdlib);

exports.setRedisClient = setRedisClient;
