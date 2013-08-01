var email = require("emailjs");
var nodemailer = require("nodemailer");
var emailConfig = require("../conf/app_conf").emailConfig;
var server = email.server.connect(emailConfig);
var crypto = require("crypto"), querystring = require("querystring");

var encodeToken = function(token) {
  return querystring.stringify(token, ';', ':');
};

var decodeToken = function(token) {
  return querystring.parse(token, ';', ':');
};

var signupSubject = "Reputation Signup Confirmation";

var path = require('path'), templatesDir = path.join(__dirname, 'templates');
var emailTemplates = require("email-templates");

var userSignup = function(msgObject, cb) {
  console.log("mailer saw signup object:" + JSON.stringify(msgObject));
  crypto.randomBytes(48, function(err, bytes) {
    var activateCode = bytes.toString('hex');
    emailTemplates(templatesDir, function(err, template) {
      if (err) {
        console.log(err);
      } else {
        var transport = nodemailer.createTransport("SMTP", {
          service : "Gmail",
          auth : {
            user : emailConfig.user,
            pass : emailConfig.password
          }
        });
        var locals = {
          email : msgObject.email,
          name : {
            first : 't',
            last : 'c'
          },
          subject : signupSubject,
          activationCode : msgObject.activationCode
        };
        template('signup', locals, function(err, html, text) {
          if (err) {
            console.log(err);
          } else {
            transport.sendMail({
              from : emailConfig.userNameString,
              to : locals.email,
              subject : locals.subject,
              html : html,
              generateTextFromHTML : true,
            // text: text
            }, function(err, responseStatus) {
              if (err) {
                console.log(err);
              } else {
                console.log(responseStatus.message);
                if (cb)
                  cb(err, responseStatus.message);
              }
            });
          }
        });
      }
    });
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

exports.send_signup_email = function(user_email, user_code, cb) {
  emailTemplates(templatesDir, function(err, template) {
    if (err) {
      console.log(err);
    } else {
      var transport = nodemailer.createTransport("SMTP", {
        service : "Gmail",
        auth : {
          user : emailConfig.user,
          pass : emailConfig.password
        }
      });
      var locals = {
        email : user_email,
        name : {
          first : 't',
          last : 'c'
        },
        subject : signupSubject,
        activationCode : user_code
      };
      template('signup', locals, function(err, html, text) {
        if (err) {
          return cb(err);
        } else {
          transport.sendMail({
            from : emailConfig.userNameString,
            to : locals.email,
            subject : locals.subject,
            html : html,
            generateTextFromHTML : true,
          // text: text
          }, function(err, responseStatus) {
            if (err) {
              console.log(err);
              cb(err);
            } else {
              console.log(responseStatus.message);
              if (cb)
                return cb(err, responseStatus.message);
            }
          });
        }
      });
    }
  });
};

exports.userSignup = userSignup;
exports.userWelcome = userWelcome;