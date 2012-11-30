var COLL = "comments", DB="reputation";
var getCollection = null;
var stdlib;
var redisClient;

function setStdlib(aStdlib) {
    stdlib = aStdlib;
};

function setRedis(aRedis) {
    redisClient = aRedis;
};

function setCollectionAccessor(getColl) {
    getCollection = getColl(COLL, DB);
};

var save = function(comment, callback) {
	console.log("commentDB.save(commentData:" + JSON.stringify(comment));
    getCollection(stdlib.errorClosure(callback, function(collection) {
    	console.log("commentDB.gotCollection");
        collection.insert(comment, stdlib.errorClosure(callback, function(result) {
        	console.log("commentDB.inserted comment");
            callback(null, result);
        }));
    }));
};

exports.setCollectionAccessor = setCollectionAccessor;
exports.save = save;
exports.setStdlib = setStdlib;
exports.setRedis = setRedis;