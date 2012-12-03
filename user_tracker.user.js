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


function sendRequest(requestURL, userComment) {
  new Ajax.Request(requestURL, {
    method:'get',
    parameters:{comment:userComment},
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
    },
    onFailure: function(response) {
      log("failed:"+response);
    }
  });
  return false;
}
insertScriptText(sendRequest.toString());
var formHTML_1 = " \
<div id='user_tracker_div'>\
<form name='input' method='get' onsubmit='return sendRequest(this.dataurl.value, this.userComment.value);' class='commentSubmitForms'> \
";
var formHTML_2 = " \
<input type='text' name='userComment'> \
<input type='submit' value='Submit'> \
</form> \
<br><a href='#' onClick='return getUserReputationData();'>Check</a><br> \
</div>";
function getFormHTML(commentProperties) {
  var dataURL = "http://reputation.herokuapp.com/userData/".concat(
	userScriptId,"/",
    commentProperties.curDomain,"/",
    commentProperties.articleId,"/",
    commentProperties.userName,"/",
    commentProperties.userId,"/",
    commentProperties.commentId,"/add"
  );
  var urlInput = "<input type='hidden' name='dataurl' value='"+dataURL+"' />";
  return formHTML_1 + urlInput + formHTML_2;
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