var email   = require("emailjs");
var emailConfig = require("./conf/app_conf").emailConfig;
var server  = email.server.connect(emailConfig);

// send the message and get a callback with an error or details of the message that was sent
server.send({
    text:    "i hope this works", 
    from:    "you <"+emailConfig.user+">", 
    to:      "someone <trigunshin@gmail.com>",
    subject: "testing emailjs"
  },
  function(err, message) {
    console.log(err || message);
  }
);