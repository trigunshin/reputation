var redisLib = require('redis'),
    urlParser = require('url');
var redisClient;

var get = function(config, cb) {
  if(redisClient) return cb(redisClient);
  else if (process.env.REDISTOGO_URL) {
    console.log("Connecting to redis @ url:" + process.env.REDISTOGO_URL);
    var rtg  = urlParser.parse(process.env.REDISTOGO_URL);
    redisClient = redisLib.createClient(rtg.port, rtg.hostname);
    redisClient.auth(rtg.auth.split(":")[1]);
  } else if(process.env.REDIS_URL) {
    console.log("Connecting to redis @ default port on host:" + process.env.REDIS_URL);
    redisClient = redisLib.createClient(6379, process.env.REDIS_URL);
  } else {
    console.log("Connecting to redis @ default fallback:" + config.redisConfig.defaultURL);
    redisClient = redisLib.createClient(6379, config.redisConfig.defaultURL);
  }
  redisClient.on("error", function(err) {
    console.log("error:" + redisClient.host + ":"+redisClient.port+"-"+err);
  });
  return cb(redisClient);
};

exports.get = get;