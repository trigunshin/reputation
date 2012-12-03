// ==UserScript==
// @name          User Tracker
// @include       http://seekingalpha.com/article/*
// @grant         none
// ==/UserScript==
var startTime = (new Date()).getTime();
function log(msg) {
  var milliseconds = (new Date()).getTime() - startTime;
  window.setTimeout(function () {
    throw( new Error('hue: ' + msg, "") );
  });
}
function insertScript(script_url) {
    var script_tag = document.createElement('script');
    script_tag.type = "text/javascript";
    script_tag.src = script_url;
    document.getElementsByTagName('head')[0].appendChild(script_tag);
}
function insertScriptText(scriptText) {
  var script_tag = document.createElement('script');
  script_tag.type = "text/javascript";
  
  var script = document.createTextNode(scriptText);
  script_tag.appendChild(script);
  
  document.getElementsByTagName('head')[0].appendChild(script_tag);	
}

function sendRequest(requestURL, requestType, params, cb) {
  new Ajax.Request(requestURL, {
    method:requestType,
    parameters:params,
    onCreate: function(response) {
      if (response.request.isSameOrigin()) return;
      var t = response.transport; 
      t.setRequestHeader = t.setRequestHeader.wrap(function(original, k, v) { 
        if (/^(accept|accept-language|content-language)$/i.test(k))
          return original(k, v);
        if (/^content-type$/i.test(k) && /^(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)(;.+)?$/i.test(v)) 
          return original(k, v);
        return;
      });
    },
    onSuccess: function(response) {
      log("success:"+response);
      if(cb) cb(null, response);
    },
    onFailure: function(response) {
      log("failed:"+response);
      if(cb) cb(response);
    }
  });
  return false;
}
function sendUserReputationData(url, userCommentText) {
  sendRequest(url, 'get', {comment:userCommentText}, function(err, transport) {
    if(err) {log("error sending data...");return;}
    log("successfully sent user data");
  });
  return false;
};
function getUserReputationData(site, scriptId, userId) {
  sendRequest(url, 'get', null, function(transport) {
    if(err) {log("error sending data...");return;}
    log("sucessfully got user data");
  });
  return false;
};

insertScriptText(sendRequest.toString());
insertScriptText(sendUserReputationData.toString());
insertScriptText(getUserReputationData.toString());

var formHTML_1 = " \
<div id='user_rep_tracker_div'>\
<form name='input' method='get' onsubmit='return sendUserReputationData(this.senddataurl.value, this.userComment.value);' class='commentSubmitForms'> \
";
var formHTML_2 = " \
<input type='text' name='userComment'> \
<input type='submit' value='Submit'> \
<br><a href='#' onClick='return getUserReputationData(this.site.value, this.scriptId.value, this.userId.value);'>Check</a><br> \
</form> \
</div>";
function getFormHTML(commentProperties) {
  var sendDataURL = "http://reputation.herokuapp.com/userData/".concat(
	userScriptId,"/",
    commentProperties.curDomain,"/",
    commentProperties.articleId,"/",
    commentProperties.userName,"/",
    commentProperties.userId,"/",
    commentProperties.commentId,"/add"
  );
  var getDataURL = "http://reputation.herokuapp.com/userComments/".concat(
    userScriptId,"/",
    commentProperties.userScriptId,"/",
    commentProperties.curDomain,"/",
    commentProperties.userId,"/get"
  );
  var inputs = "";
  inputs.concat("<input type='hidden' name='site' value='"+curDomain+"' />");
  inputs.concat("<input type='hidden' name='articleId' value='"+articleId+"' />");
  inputs.concat("<input type='hidden' name='userId' value='"+userId+"' />");
  inputs.concat("<input type='hidden' name='userName' value='"+userName+"' />");
  inputs.concat("<input type='hidden' name='userScriptId' value='"+userScriptId+"' />");
  inputs.concat("<input type='hidden' name='senddataurl' value='"+sendDataURL+"' />");
  inputs.concat("<input type='hidden' name='getdataurl' value='"+getDataURL+"' />");
  return formHTML_1 + inputs + formHTML_2;
}
function insertHTML(aCommentNode, commentProperties) {
  aCommentNode.insert({bottom:getFormHTML(commentProperties)});
}

var afterDomInsert = function(cb) {
  return function() {
    var curDomain = document.domain.split('.')[0];
    var articleId = window.location.href.match(/[\d]+/);
    var elements = $$("div.com_info");
    for(var i=0,iLen=elements.length;i<iLen;i++) {
      elements[i].select("a.commenter_name").each(function(node) {
        var userName = node.readAttribute('fullname');
        var match = node.readAttribute('onmouseover').match(/[\d]+/g);
        var userId = match[0];
        var commentId = match[1];
        var commentText="test";
        var commentProperties = {
          curDomain:curDomain,
          articleId:articleId,
          userName:userName,
          userId:userId,
          commentId:commentId
        };

        insertHTML(elements[i], commentProperties);//technically this could run >1 times...
      });
    }
    cb();
  };
};
var injectComments = function(forceAll, onComplete) {
  log("injected forceAll");
  self.get_real_comments(true, afterDomInsert(onComplete));
  self.get_real_comments = function(){log("already loaded them all!");};
};
self.get_real_comments = self.get_ajax_comments;
self.get_ajax_comments = injectComments;

var injectActions = function() {
  log("calling add_comment_actions");
  self.inj_comment_actions();
//updatePage(forceAll=true)
//continue_loading_comments();
  self.continue_loading_comments();
};
self.inj_comment_actions = self.add_comment_actions;
self.add_comment_actions = injectActions;

document.observe('dom:loaded', function() {
});