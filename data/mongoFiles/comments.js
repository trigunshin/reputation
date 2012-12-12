var COLL = "comments", DB="reputation";
var ObjectID = require('mongodb').ObjectID;
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

var get = function(userScriptId, site, userId, callback) {
    getCollection(stdlib.errorClosure(callback, function(collection) {
    	var query = {userScriptId:userScriptId,
    	    site:site,
    	    siteUserId:userId
	    };
		var sort = [["createdOn",-1]];
        var opts = {"limit":5, "sort":sort};
        collection.find(query, opts, stdlib.errorClosure(callback, function(results) {
        	results.toArray(stdlib.errorClosure(callback, function(items) {
                callback(null, items);
        	}));
        }));
    }));
};

var save = function(comment, callback) {
  getCollection(stdlib.errorClosure(callback, function(collection) {
      collection.insert(comment, stdlib.errorClosure(callback, function(result) {
          callback(null, result);
      }));
  }));
};

var remove = function(comment, callback) {
  getCollection(stdlib.errorClosure(callback, function(collection) {
    collection.remove(comment, stdlib.errorClosure(callback, function(result) {
      callback(null, result);
    }));
  }));
};

var removeById = function(commentId, callback) {
  getCollection(stdlib.errorClosure(callback, function(collection) {
    collection.remove({_id: new ObjectID(commentId)}, stdlib.errorClosure(callback, function(result) {
      callback(null, result);
    }));
  }));
};

exports.setCollectionAccessor = setCollectionAccessor;
exports.get = get;
exports.save = save;
exports.remove = remove;
exports.removeById = removeById;
exports.setStdlib = setStdlib;
exports.setRedis = setRedis;