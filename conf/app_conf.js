var emailConfig = {
   user:    (process.env.EMAIL_NAME||""),
   password:(process.env.EMAIL_PASS||""),
   host:    (process.env.EMAIL_HOST||""),
   ssl:      true
};
var amqpConfig = {
  defaultURL : (process.env.CLOUDAMQP_URL||"")
};

//not yet used, need to standardize auth-including urls
var redisConfig = {
  defaultURL : (process.env.REDISTOGO_URL || process.env.REDIS_URL || 'localhost')
};

//not yet used, need to standardize auth-including urls
var mongoConfig = {
  defaultURL : (process.env.MONGOLAB_URI || process.env.MONGO_HOST || "localhost")
};

exports.emailConfig = emailConfig;
exports.amqpConfig = amqpConfig;
exports.redisConfig = redisConfig;
exports.mongoConfig = mongoConfig;