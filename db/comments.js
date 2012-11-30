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
    getCollection(stdlib.errorClosure(callback, function(collection) {
        collection.insert(comment, stdlib.errorClosure(callback, function(result) {
            callback(null, result);
        }));
    }));
};

exports.setCollectionAccessor = setCollectionAccessor;
exports.save = save;
exports.setStdlib = setStdlib;
exports.setRedis = setRedis;