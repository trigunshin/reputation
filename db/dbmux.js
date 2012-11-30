var Db = require('mongodb').Db,
    Server = require('mongodb').Server;
var stdlib = require("../node_libs/conf/stdlib").stdlib;
var SERVER = process.env.MONGO_HOST || "localhost",
    PORT = process.env.MONGO_PORT || 27017;
console.log("DBMux connecting to mongo @ host&port:"+SERVER+":"+PORT);
var stdlib = require("../stdlib").stdlib;
var redisClient;

var getConnection = function (collectionName, databaseName) {
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

var files = ["users"];
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
