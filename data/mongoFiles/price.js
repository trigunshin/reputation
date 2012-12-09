var COLL = "hist", DB="nasdaq";
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

var getPriceValues = function(ticker, start, end, limit, callback) {
	getCollection(stdlib.errorClosure(callback, function(collection) {
		var query = {"symb":ticker};
		if(start)
			query.date = {"$gte":start};
		if(end) {
			if(query.date) query.date["$lt"] = end;
			else query.date = {"$lt":end};
		}
		var sort = (query.date) ? [["date",1]] : [["date",-1]];
        var opts = {"limit":limit, "sort":sort};
    	collection.find(query, opts, stdlib.errorClosure(callback, function(results) {
            results.toArray(stdlib.errorClosure(callback, function(items) {
            	callback(null, items);
            }));
        }));
    }));
};

exports.getPriceValues = getPriceValues;
exports.setCollectionAccessor = setCollectionAccessor;
exports.setStdlib = setStdlib;
exports.setRedis = setRedis;
