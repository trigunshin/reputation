var emailConfig = {
   user:    (process.env.EMAIL_NAME||""),
   password:(process.env.EMAIL_PASS||""),
   host:    (process.env.EMAIL_HOST||""),
   ssl:      true
};
var amqpConfig = {
  defaultURL : (process.env.CLOUDAMQP_URL||"")
};

exports.emailConfig = emailConfig;
exports.amqpConfig = amqpConfig;
