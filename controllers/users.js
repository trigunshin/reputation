var bcrypt = require('bcrypt');
var stdlib = require("../stdlib").stdlib,
    dbmux = null,
    userDB = null,
    setDBMux = function(aDBMux) {
        dbmux = aDBMux;
        userDB = dbmux.users;
    };

var get = function(email, callback) {
    userDB.get(email, stdlib.errorClosure(callback, function(userList) {
        return callback(null, userList[0]);
    }));
};

var save = function(user, callback) {
    userDB.save(user, stdlib.errorClosure(callback, function(userResult) {
        return callback(null, userResult);
    }));
};

var findAndUpdate = function(email, fields, callback) {
    userDB.findAndUpdate(email, fields, stdlib.errorClosure(callback, function(updatedUser) {
        return callback(null, updatedUser);
    }));
};

var verifyPass = function(submitted, dbPass, callback) {
    bcrypt.compare(submitted, dbPass, stdlib.errorClosure(callback, function(res) {
        callback(null, res);
    })); 
};

var getPassHash = function(pass, callback) {
    bcrypt.genSalt(11, stdlib.errorClosure(callback, function(salt) {
        bcrypt.hash(pass, salt, callback);
    }));
};

var pushFavoriteTicker = function(email, ticker, callback) {
    userDB.pushFavoriteTicker(email, ticker, stdlib.errorClosure(callback, function(updatedUser) {
        return callback(null, updatedUser);
    }));
};

var pullFavoriteTicker = function(email, ticker, callback) {
    userDB.pullFavoriteTicker(email, ticker, stdlib.errorClosure(callback, function(updatedUser) {
        return callback(null, updatedUser);
    }));
};

exports.getPassHash = getPassHash;
exports.verifyPass = verifyPass;
exports.setDBMux = setDBMux;
exports.get = get;
exports.save = save;
exports.findAndUpdate = findAndUpdate;
exports.pullFavoriteTicker = pullFavoriteTicker;
exports.pushFavoriteTicker = pushFavoriteTicker;
exports.addSubscription = addSubscription;
exports.cancelSubscription = cancelSubscription;
