var COLL = "users", DB = "reputation";
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

var getByActivationCode = function(code, callback) {
  getCollection(stdlib.errorClosure(callback, function(collection) {
    var query = {
      'activationCode' : code
    };
    collection.find(query, {"limit" : 1}, stdlib.errorClosure(callback, function(results) {
      results.toArray(stdlib.errorClosure(callback, function(items) {
        callback(null, items);
      }));
    }));
  }));
};

var getByEmail = function(email, callback) {
  getCollection(stdlib.errorClosure(callback, function(collection) {
    var query = {
      'email' : email
    };
    collection.find(query, {"limit" : 1}, stdlib.errorClosure(callback, function(results) {
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

var remove = function(email, callback) {
  getCollection(stdlib.errorClosure(callback, function(collection) {
    collection.remove({email:email}, stdlib.errorClosure(callback, function(result) {
      cb(null, result);
    }));
  }));
};

var findAndUpdate = function(email, fields, callback) {
  getCollection(stdlib.errorClosure(callback, function(collection) {
    collection.findAndModify({
      'email' : email
    }, [], {
      "$set" : fields
    }, {
      "new" : true
    }, stdlib.errorClosure(callback, function(result) {
      callback(null, result);
    }));
  }));
};

exports.setCollectionAccessor = setCollectionAccessor;
exports.getByEmail = getByEmail;
exports.getByActivationCode = getByActivationCode;
exports.save = save;
exports.remove = remove;
exports.findAndUpdate = findAndUpdate;
exports.setStdlib = setStdlib;
exports.setRedis = setRedis;
