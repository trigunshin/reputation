var COLL = "users", DB="vortex";
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

var get = function(email, callback) {
    getCollection(stdlib.errorClosure(callback, function(collection) {
        var query = {'email':email};
        collection.find(query, {"limit":1}, stdlib.errorClosure(callback, function(results) {
            results.toArray(stdlib.errorClosure(callback, function(items) {
                callback(null, items);
            }));
        }));
    }));
};

var save = function(user, callback) {
    getCollection(stdlib.errorClosure(callback, function(collection) {
        collection.insert(user, stdlib.errorClosure(callback, function(result) {
            callback(null, result);
        }));
    }));
};

var findAndUpdate = function(email, fields, callback) {
    getCollection(stdlib.errorClosure(callback, function(collection) {
        collection.findAndModify({'email':email},[],{"$set":fields},{"new":true}, 
                stdlib.errorClosure(callback, function(result) {
            callback(null, result);
        }));
    }));
};

var pushFavoriteTicker = function(email, ticker, callback) {
    if(!ticker) return callback("no ticker!");
    var tickerString = "favorites."+ticker.toUpperCase();
    getCollection(stdlib.errorClosure(callback, function(collection) {
    	var updater = {"$set":{}};
        updater["$set"][tickerString] = ticker;
    	collection.findAndModify({'email':email},[],updater,{"new":true}, 
                stdlib.errorClosure(callback, function(result) {
            callback(null, result);
        }));
    }));
};

var pullFavoriteTicker = function(email, ticker, callback) {
    if(!ticker) return callback("no ticker!");
    var tickerString = "favorites."+ticker.toUpperCase();
    getCollection(stdlib.errorClosure(callback, function(collection) {
    	var updater = {"$unset":{}};
        updater["$unset"][tickerString] = ticker;
    	collection.findAndModify({'email':email},[],updater,{"new":true}, 
                stdlib.errorClosure(callback, function(result) {
            callback(null, result);
        }));
    }));
};

exports.setCollectionAccessor = setCollectionAccessor;
exports.get = get;
exports.save = save;
exports.findAndUpdate = findAndUpdate;
exports.pullFavoriteTicker = pullFavoriteTicker;
exports.pushFavoriteTicker = pushFavoriteTicker;
exports.setStdlib = setStdlib;
exports.setRedis = setRedis;
