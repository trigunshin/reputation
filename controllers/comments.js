var bcrypt = require('bcrypt');
var stdlib = require("../stdlib").stdlib,
  dbmux = null,
  commentDB = null,
  setDBMux = function(aDBMux) {
    dbmux = aDBMux;
    commentDB = dbmux.comments;
  };

var get = function(userScriptId, site, userId, callback) {
	commentDB.get(userScriptId, site, userId, stdlib.errorClosure(callback, function(commentList) {
    return callback(null, commentList);
  }));
};

var getCommentGroup = function(userScriptId, site, userIdArray, callback) {
  commentDB.get(userScriptId, site, userIdArray, stdlib.errorClosure(callback, function(commentList) {
    return callback(null, commentList);
  }));
};

var save = function(commentData, callback) {
  commentDB.save(commentData, stdlib.errorClosure(callback, function(commentResult) {
    return callback(null, commentResult);
  }));
};

var remove = function(commentData, callback) {
  commentDB.remove(commentData, stdlib.errorClosure(callback, function(commentResult) {
      return callback(null, commentResult);
  }));
};

var removeById = function(commentId, callback) {
  commentDB.removeById(commentId, stdlib.errorClosure(callback, function(commentResult) {
      return callback(null, commentResult);
  }));
};

exports.setDBMux = setDBMux;
exports.get = get;
exports.getCommentGroup = getCommentGroup;
exports.save = save;
exports.remove = remove;
exports.removeById = removeById;