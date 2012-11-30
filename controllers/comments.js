var bcrypt = require('bcrypt');
var stdlib = require("../stdlib").stdlib,
    dbmux = null,
    commentDB = null,
    setDBMux = function(aDBMux) {
        dbmux = aDBMux;
        commentDB = dbmux.comments;
    };

var get = function(email, callback) {
	commentDB.get(email, stdlib.errorClosure(callback, function(commentList) {
        return callback(null, commentList);
    }));
};

var save = function(commentData, callback) {
    commentDB.save(commentData, stdlib.errorClosure(callback, function(commentResult) {
        return callback(null, commentData);
    }));
};


exports.setDBMux = setDBMux;
exports.get = get;
exports.save = save;
