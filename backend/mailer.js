var email = require("emailjs");
var emailConfig = require("./conf/app_conf").emailConfig;
var server = email.server.connect(emailConfig);
var crypto = require("crypto"),
    querystring = require("querystring");

var encodeToken = function(token) {
  return querystring.stringify(token, ';', ':');
};

var decodeToken = function(token) {
  return querystring.parse(token, ';',':');
};

var userEmailToken = "#{name}";
var signupText = "Thanks for signing up, " +
  userEmailToken +
  ".\nThe following link will activate you:"+
  "reputation.herokuapp.com/activate?token=";
var signupFrom = "you <" + emailConfig.user + ">";
var signupSubject = "Reputation Signup Confirmation";
var userSignup = function(userEmail, cb) {
  console.log("mailer saw signup for:"+userEmail);
  crypto.randomBytes(24, function (err, bytes) {
	var activateCode = encodeURIComponent(bytes.toString('base64'));
    server.send({
        text:signupText.replace(userEmailToken, userEmail) + activateCode,
        from: "you <"+emailConfig.user+">",
        to: userEmail+" <" + userEmail +">",
        subject: signupSubject,
        attachment: [
          {data:"<html>i <i>hope</i> this works! <hr><a href='reputation.herokuapp.com/activate?token="+
        	  activateCode+
        	  "'>Activate</a></html>",
           alternative:true}
        ]
      },
      function(err, message) {
        if(err) cb(err);
        console.log("Signup confirmation sent for:"+userEmail);
        if(cb) cb(null, message);
      }
    );
  });
  
};

var userWelcome = function() {
    
};

var passwordReset = function() {
    
};

var billingChange = function() {
    
};

var billingStatus = function() {
    
};


exports.userSignup = userSignup;
exports.userWelcome = userWelcome;