//var stdlib = require("../stdlib").stdlib;
var config = require("./../conf/app_conf.js");
var rabbit = require("./rabbitmq");
var mongo = require("./dbmux");
var redis = require("./redis");


var getRedis = function(cb) {
  return redis.get(config, cb);
};

var getMongo = function(cb) {
  return cb(mongo);
};

var getRabbit = function(cb) {
  return rabbit.get(config, cb);
};

exports.getRabbit = getRabbit;
exports.getMongo = getMongo;
exports.getRedis = getRedis;