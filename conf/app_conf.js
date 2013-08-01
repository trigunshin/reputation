var user = (process.env.EMAIL_NAME||"admin@tradeslow.com");
var emailConfig = {
   user:user,
   password:(process.env.EMAIL_PASS||"pinkledwrenis"),
   host:(process.env.EMAIL_HOST||"smtp.gmail.com"),
   ssl:true,
   userNameString:"Tradeslow <" + user + ">"
};

var amqpConfig = {
  defaultURL : (process.env.CLOUDAMQP_URL||"amqp://hep:pinkledwrenis@kilrog.dyndns.org:5672")
};

//need to standardize auth-including urls
var redisConfig = {
  defaultURL : (process.env.REDISTOGO_URL || process.env.REDIS_URL || 'kilrog.dyndns.org')
};

//not yet used, need to standardize auth-including urls
var mongoConfig = {
  defaultURL : (process.env.MONGOLAB_URI || process.env.MONGO_HOST || 'kilrog.dyndns.org')
};

exports.emailConfig = emailConfig;
exports.amqpConfig = amqpConfig;
exports.redisConfig = redisConfig;
exports.mongoConfig = mongoConfig;


