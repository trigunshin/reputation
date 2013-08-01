//var stripeConf = require("./conf/stripeConf");
var check = require('validator').check;
var requestLib = require("request");
var querystring = require("querystring"),
    content = require("./content")['ext'],
    url = require("url"),
    fs = require("fs"),
    crypto = require("crypto");

var userController = require("./controllers/users");
var commentController = require("./controllers/comments");

/*handle injections*/
var dbmux,// = require("./data/dbmux");
    stdlib,
    rabbitMQ,
    emailExchange,
    redisClient;
function setStdlib(aStdlib) {
    stdlib = aStdlib;
};
var EMAIL_SIGNUP_STRING="reputation.email.signup";
    WELCOME_SIGNUP_STRING="reputation.email.welcome";

function setDataMux(aDataMux) {
  dataMux = aDataMux;
  dataMux.getRabbit(function(rabbitClient) {
    rabbitMQ = rabbitClient;
    // create the exchange if it doesnt exist
    rabbitMQ.exchange('rabbitEmailExchange', {
        'type':'topic',
        'durable':true
      }, function(exch) {
        emailExchange = exch;
        console.log("emailer exchange open");
      }
    );
  });
  dataMux.getRedis(function(aRedisClient) {
    redisClient = aRedisClient;
    dataMux.getMongo(function(mongoClient) {
      dbmux = mongoClient;
      dbmux.setRedisClient(redisClient);
      
      userController.setDBMux(dbmux);
      commentController.setDBMux(dbmux);
    });
  });
}


function sendMsg(topic, msg) {
  if(emailExchange) {
	  emailExchange.publish(topic,msg);
  }
  else {
    console.log("email exchange not around now...");
  }
}

/* Greasemonkey file setup */
var scriptSplitToken = "// ==/UserScript==\n";
var scriptFileDict = {};
var idDropIn = "var userScriptId = '";
// For our tracked sites, read in the appropriate chunks
var sites = ["seeking_alpha", 'ycombinator'];
for(var i=0,iLen=sites.length;i<iLen;i++) {
	readDataForSite(sites[i]);
}
function readDataForSite(aSite) {
	var tmp = {};
	fs.readFile("./userScripts/"+aSite+".user.js", "utf8", function(err, data) {
		if(err) {console.warn("readFile error: ", err);}
		var commentIndex = data.indexOf(scriptSplitToken);
		tmp.prefix = data.substring(0, commentIndex + scriptSplitToken.length);
		tmp.suffix = data.substring(commentIndex + scriptSplitToken.length);
		console.log("storing site:"+aSite);
		scriptFileDict[aSite] = tmp;
	});
};

/* Route Handlers */
var index = function(request, response) {
    response.render(__dirname+"/views/index", {
        title:"User Reputation Tracker"
    });
};

var sockets = function(request, response) {
	response.render(__dirname+"/views/sockets", {
        title:"Socket Toomie."
    });
};

var profileGet = function(request, response) {
	if(request.session && request.session.user) {
	    response.render(__dirname+"/views/profile", {
	        title:"So it begins.",
	        sites:sites,
	        scriptId:request.session.user.scriptId
	    });
	} else {
		redirect(response, "Please log in first", "/");
	}
};

var getUserGreasemonkeyScript = function(request, response) {
	var site = request.param('site').toString();//this can error out for now, site should be required
	var userTokenLine = idDropIn + request.session.user.scriptId + "';\n";
    sendFile(response, site+"_script.js", scriptFileDict[site].prefix + userTokenLine + scriptFileDict[site].suffix);
};

var userCommentGet = function(request, response) {
	var userScriptId = request.param('userScriptId');
	var site = request.param('website');
	var siteUserId = request.param('userId');
	commentController.get(userScriptId, site, siteUserId, function(err, commentList) {
		if(err) return renderError(err, response);
		response.json(commentList);
	});
};

var getCommentGroup = function(request, response) {
  //app.get('/userData/:userId/:website/get?idList=test', routes.addComment);
  console.log("processing params:"+JSON.stringify(request.params));
  console.log("processing query:"+JSON.stringify(request.query));
  //*
  var userScriptId = request.param('userScriptId');
  var site = request.param('website');
  var idList = [].concat(request.param('idList'));
  //*/
  commentController.getCommentGroup(userScriptId, site, idList, function(err, result) {
    if(err) {console.log("err on batchget...");return response.json({'err':err});}
    console.log("returning comment group of size:"+result.length);
    response.json({'data':result});
  });
};

var addComment = function(request, response) {
  //app.get('/userData/:userId/:website/:articleId/:username/:userId/:commentId/?comment=test', routes.addComment);
  console.log("processing params:"+JSON.stringify(request.params));
  console.log("processing query:"+JSON.stringify(request.query));
  /*
  var userScriptId = request.param('userScriptId');
  var site = request.param('website');
  var articleId = request.param('articleId');
  var siteUserId = request.param('userId');
  var siteUsername = request.param('username');
  var commentId = request.param('commentId');
  var commentText = request.query.comment || "none";
  */
  var theComment = {
      'userScriptId' : request.param('userScriptId'),
      site : request.param('website'),
      articleId : request.param('articleId'),
      siteUserId : request.param('userId'),
      siteUsername : request.param('username'),
      commentId : request.param('commentId'),
      createdOn : new Date(),
      userCommentText : request.query.comment || "none"
  };
  commentController.save(theComment, function(err, result) {
    if(err) return renderError(err, response);
    response.writeHead(200, {'Content-Type': 'text/plain'});
      response.write("Comment saved.");
      response.end();
  });
};

var removeComment = function(request, response) {
  var commentId = request.param('id');
  commentController.removeById(commentId, function(err, result) {
    if(err) return renderError(err, response);
    response.writeHead(200, {'Content-Type': 'text/plain'});
      response.write("Comment removed.");
      response.end();
  });
};

/*Misc*/
var redirect = function(response, aMessage, toPage) {
    response.render(__dirname+'/views/redirect', {
        title:"Redirecting...",
        redirectTo:toPage,
        msg:aMessage
    });
};

var signupGet = function(request, response) {
    response.render(__dirname+"/views/signup", 
        {'title':'Sign up!'
        }
    );
};

var generateToken = function(cb) {
  crypto.randomBytes(36, function (err, bytes) {
    cb(err, bytes.toString('hex'));
  });
};

var sendActivationEmail = function(userEmail, cb) {
  generateToken(function(err, activationCode) {
    /*
    console.log("sending activation email w/topic:"+EMAIL_SIGNUP_STRING);
    sendMsg(EMAIL_SIGNUP_STRING, JSON.stringify({
        email:userEmail,
        activationCode:activationCode
      })
    );
    */
    send_signup_email(userEmail, activationCode, function(err, response) {
      if(err) console.log("error sending email:"+err);
      cb(err, activationCode);
    });
  });
};

var activateGet = function(request, response) {
  var token = request.param('token');
  userController.getByActivationCode(token, function(err, user) {
    if(err) return renderError(err, response);
    if(!user) return renderError({message:"No user found with id:"+token}, response);
    var fields = {'activationCode':null};
    userController.findAndUpdate(user.email, fields, function(err, result) {
      if(err) return renderError(err, response);
      request.session.name=user.email;
      request.session.user=user;
      request.session.auth=true;
      redirect(response, "Thanks for activating!", 'profile');
    });
  });
};

var signupPost = function(request, response) {
  var email = request.body['user']['email'];
  var pass = request.body['user']['pass'];
  var pass1 = request.body['user']['pass1'];
  try {
    check(email,"Please enter a valid email.").isEmail();
    if (pass==pass1) {
      userController.getPassHash(pass, function(err, hash) {
        if(err) return renderError(err, response);
        else userController.getByEmail(email, function(err, userResult) {
          if(err) return renderError(err, response);
          else if(userResult) {
            console.log("result:"+JSON.stringify(userResult));
            if(userResult.activationCode) {//resend the token
              sendActivationEmail(email, function(err, token) {
                if(err) return renderError(err, response);
                userController.findAndUpdate(email, {"activationCode":token}, function(err) {
                  if(err) return renderError(err, response);
                  redirect(response, "Check your email for the activation link.", 'profile');
                });
              });
            } else {//address already registered
              return renderError({'message':"Email already exists. Please try another one or login."}, response);
            }
          } else {
            generateToken(function (err, scriptCode) {
              sendActivationEmail(email, function(err, activationCode) {
                if(err) return renderError(err, response);
          		  var userToSave = {
          		      'email':email
          			  , 'password':hash
          			  , 'createdOn':new Date()
          			  , 'scriptId':scriptCode
          			  , 'activationCode':activationCode
          		  };
          		  userController.save(userToSave, function(err) {
          			  if(err) return renderError(err, response);
          			  else {
//          				  request.session.name=email;
//          				  request.session.user=userToSave;
//          				  request.session.auth=true;
          				  redirect(response, "Check your email for the activation link.", 'profile');
          			  }
          		  });
          	  });
            });
          }
      	});
      });
    } else return renderError({'message':"User passwords did not match!"}, response);
  } catch (e) {
    console.log(e.message);
    signupGet(request, response);
  }
};

var loginPost = function(request, response) {
  var userEmail = request.body['login']['email'];
  var userPass = request.body['login']['pass'];
  var originURL = request.body['login']['url'];
  
  userController.getByEmail(userEmail, function(err, user) {
    if(err) return renderError(err, response);
    else {
      if(user) {
        if(user.activationCode) return redirect(response, "Please check your email for activation link or re-register.", '');
        else if (user['password']) {
          userController.verifyPass(userPass, user['password'], function(err, pwResult) {
            if(err) return renderError(err, response);
            else if(pwResult) {
              console.log(userEmail + " has logged in.");
              request.session.name=userEmail;
              request.session.user=user;
              request.session.auth=true;
              response.redirect(originURL);
              //redirect(response, "Logged in successfully!", originURL);
            } else {
            	redirect(response, "Password or username did not match!", originURL);
            }
          });
        }
      }
      else {
      	redirect(response, "Password or username did not match!", originURL);
      }
    }
  });
};

var logoutGet = function(request, response) {
    request.session.auth=false;
    request.session.name=null;
    request.session.user = null;
    request.session.destroy(function(err) {
        if(err) console.warn("Error in logoutHandler.session.destroy!");
        response.redirect('home');
    });
};

//misc / file section

var fileUploadGetHandler = function(request, response) {
    var pathname = url.parse(request.url).pathname;
    var path = __dirname+request.url;
    fs.readFile(path, "utf8", function(err, data) {
        if(err) {processError("fileUploadHandler-readFile error: ", err, response);}
        else {
            if(err) console.log("fileUploadHandler-memcached.set error: "+err);
            else sendFile(response, pathname, data);
        }
    });
};

function sendFile(response, path, data) {
    var type = content.getContentTypeFromPath(path);
    response.header("Content-type", type);
    response.send(data);
};

var processError = function(errstring, err, response) {
    console.log("Processing error: " + errstring + err);
    renderError(err, response);
};

var renderError = function(err,res) {
    res.writeHead(500, {'Content-Type': 'text/plain'});
    console.log("Error info: " + JSON.stringify(err));
    res.write("Internal server error occurred:");
    res.write("\n\tError message: "+err.message);
    res.end();
};

exports.fileUploadGetHandler = fileUploadGetHandler;
exports.index = index;
exports.sockets = sockets;
exports.signupGet = signupGet;
exports.signupPost = signupPost;
exports.logoutGet = logoutGet;
exports.loginPost = loginPost;
exports.activateGet = activateGet;
exports.addComment = addComment;
exports.removeComment = removeComment;
exports.profileGet = profileGet;
exports.userCommentGet = userCommentGet;
exports.getUserGreasemonkeyScript = getUserGreasemonkeyScript;
exports.getCommentGroup = getCommentGroup;

exports.setDataMux = setDataMux;
//exports.setRedisClient = setRedisClient;
//exports.setAMQP = setAMQP;
exports.setStdlib = setStdlib;
