//var stripeConf = require("./conf/stripeConf");
var check = require('validator').check;
var requestLib = require("request");
var querystring = require("querystring"),
    content = require("./content")['ext'],
    url = require("url"),
    fs = require("fs"),
    crypto = require("crypto");

/*handle injections*/
var dbmux = require("./db/dbmux");
var stdlib;
var redisClient;
function setStdlib(aStdlib) {
    stdlib = aStdlib;
    //dbmux.setStdlib(stdlib);
};
function setRedisClient(aRedisClient) {
    redisClient = aRedisClient;
    dbmux.setRedisClient(aRedisClient);
};

var userController = require("./controllers/users");
userController.setDBMux(dbmux);
var commentController = require("./controllers/comments");
commentController.setDBMux(dbmux);

var scriptFilePrefix, scriptFileSuffix, scriptSplitToken = "// ==/UserScript==\n";
var idDropIn = "var userScriptId = '";
fs.readFile("./user_tracker.user.js", "utf8", function(err, data) {
    if(err) {console.warn("readFile error: ", err);}
    var commentIndex = data.indexOf(scriptSplitToken);
    scriptFilePrefix = data.substring(0, commentIndex + scriptSplitToken.length);
    scriptFileSuffix = data.substring(commentIndex + scriptSplitToken.length);
});

/* Route Handlers */
var index = function(request, response) {
    response.render(__dirname+"/views/index", {
        title:"So it begins."
    });
};

var profileGet = function(request, response) {
    response.render(__dirname+"/views/profile", {
        title:"So it begins.",
        scriptId:request.session.user.scriptId
    });
};

var getUserGreasemonkeyScript = function(request, response) {
	var userTokenLine = idDropIn + request.session.user.scriptId + "';\n";
    sendFile(response, "script.js", scriptFilePrefix + userTokenLine + scriptFileSuffix);
};
//userScriptId

var userCommentGet = function(request, response) {
	var userScriptId = request.param('userScriptId');
	var site = request.param('website');
	var siteUserId = request.param('userId');
	commentController.get(userScriptId, site, siteUserId, function(err, commentList) {
		if(err) return renderError(err, response);
		response.writeHead(200, {'Content-Type': 'application/javasript'});
	    //response.write("Comment gotten.\n");
		response.write("alert("+JSON.stringify(commentList)+");");
	    response.end();
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

var signupPost = function(request, response) {
    var email = request.body['user']['email'];
    var pass = request.body['user']['pass'];
    var pass1 = request.body['user']['pass1'];
    try {
        check(email,"Please enter a valid email.").isEmail();
        if (pass==pass1) {
            userController.getPassHash(pass, function(err, hash) {
                if(err) return renderError(err, response);
                else userController.get(email, function(err, userResult) {
                    if(err) return renderError(err, response);
                    else if(userResult)
                        return renderError({'message':"Email already exists. Please try another one or login."}, response);
                    else {
                    	crypto.randomBytes(24, function (err, bytes) {
                    		  var userToSave = {'email':email
                    			  , 'password':hash
                    			  , 'createdOn':new Date()
                    			  , 'scriptId':encodeURIComponent(bytes.toString('base64'))
                    		  };
                    		  userController.save(userToSave, function(err) {
                    			  if(err) return renderError(err, response);
                    			  else {
                    				  request.session.name=email;
                    				  request.session.user=userToSave;
                    				  request.session.auth=true;
                    				  response.redirect("home");
                    			  }
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
    
    userController.get(userEmail, function(err, user) {
        if(err) return renderError(err, response);
        else {
            if(user && user['password']) {
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
exports.signupGet = signupGet;
exports.signupPost = signupPost;
exports.logoutGet = logoutGet;
exports.loginPost = loginPost;
exports.addComment = addComment;
exports.profileGet = profileGet;
exports.userCommentGet = userCommentGet;
exports.getUserGreasemonkeyScript = getUserGreasemonkeyScript;

exports.setRedisClient = setRedisClient;
exports.setStdlib = setStdlib;
