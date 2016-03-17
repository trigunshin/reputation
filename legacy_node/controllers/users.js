var bcrypt = require('bcrypt');
var stdlib = require("../stdlib").stdlib, dbmux = null, userDB = null, setDBMux = function(
    aDBMux) {
  dbmux = aDBMux;
  userDB = dbmux.users;
};

var getByEmail = function(email, callback) {
  userDB.getByEmail(email, stdlib.errorClosure(callback, function(userList) {
    return callback(null, userList[0]);
  }));
};

var getByActivationCode = function(code, callback) {
  userDB.getByActivationCode(code, stdlib.errorClosure(callback, function(userList) {
    return callback(null, userList[0]);
  }));
};

var internalSave = function(user, callback) {
  userDB.save(user, stdlib.errorClosure(callback, function(userResult) {
    return callback(null, userResult);
  }));
};

var save = function(user, callback) {
  userDB.getByEmail(user.email, function(err, users) {
    if(users && users[0])
      userDB.remove(user.email, function(err, result) {
        internalSave(user, callback);
      });
    else
      internalSave(user, callback);
  });
};

var findAndUpdate = function(email, fields, callback) {
  userDB.findAndUpdate(email, fields, stdlib.errorClosure(callback, function(updatedUser) {
    return callback(null, updatedUser);
  }));
};

var verifyPass = function(submitted, dbPass, callback) {
  bcrypt.compare(submitted, dbPass, stdlib.errorClosure(callback,function(res) {
    callback(null, res);
  }));
};

var getPassHash = function(pass, callback) {
  bcrypt.genSalt(11, stdlib.errorClosure(callback, function(salt) {
    bcrypt.hash(pass, salt, callback);
  }));
};

exports.getPassHash = getPassHash;
exports.verifyPass = verifyPass;
exports.setDBMux = setDBMux;
exports.getByEmail = getByEmail;
exports.getByActivationCode = getByActivationCode;
exports.save = save;
exports.findAndUpdate = findAndUpdate;
