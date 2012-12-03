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
  //alert("hue.url:"+requestURL);
  //alert("hue.comment:"+userComment);
  //'http://reputation.herokuapp.com/'
  new Ajax.Request(requestURL, {
  //new Ajax.Request('http://reputation.herokuapp.com/', {
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
        // yada yada yada
        alert("success:"+response);
    },
    onFailure: function(response) {
        // yada yada yada
    	alert("failed:"+response);
    }
  });
  return false;
}
//<form name='input' method='get' onsubmit="+requestOnClickString+" class='commentSubmitForms'> \
//<form name='input' method='get' onsubmit='return sendRequest();' class='commentSubmitForms'> \
insertScriptText(sendRequest.toString());
//var requestOnClickString = "(" + sendRequest + ")();";
var formHTML_1 = " \
<form name='input' method='get' onsubmit='return sendRequest(this.dataurl.value, this.userComment.value);' class='commentSubmitForms'> \
";
var formHTML_2 = " \
<input type='text' name='userComment'> \
<input type='submit' value='Submit'> \
</form> \
";
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
function insertForm(aCommentNode, commentProperties) {
  aCommentNode.insert({bottom:getFormHTML(commentProperties)});
}

self.get_real_comments = self.get_ajax_comments;
var afterDomInsert = function(cb) {
  return function() {
    var curDomain = document.domain.split('.')[0];
    var articleId = window.location.href.match(/[\d]+/);
    var elements = $$("div.com_info");
    //log("curSite:"+curDomain);
    //log("articleId:"+articleId);
    //log("comment count:"+elements.length);
    for(var i=0,iLen=elements.length;i<iLen;i++) {
      elements[i].select("a.commenter_name").each(function(node) {
        var userName = node.readAttribute('fullname');
        var match = node.readAttribute('onmouseover').match(/[\d]+/g);
        var userId = match[0];
        var commentId = match[1];
        var commentText="test";
        //log("\tusername:"+userName);
        //log("\tuserid:"+userId);
        //log("\tcommentid:"+commentId);
        //log("\tcomment text:"+commentText);
        var commentProperties = {
          curDomain:curDomain,
          articleId:articleId,
          userName:userName,
          userId:userId,
          commentId:commentId
        };

        insertForm(elements[i], commentProperties);//technically this could run >1 times...
        //var someURL = "//www.tradeslow.com/userData/".concat(curDomain,"/",articleId,"/",userName,"/",userId,"/",commentId,"/?comment=",commentText);
        //log("srcURL:"+someURL);
        //insertScript(someURL);
      });
    }
    cb();
  };
};
var injectComments = function(forceAll, onComplete) {
  log("injected forceAll");
  log("onComplete:"+onComplete);
  //self.UserClickedContinue = true;
  self.get_real_comments(true, afterDomInsert(onComplete));
  self.get_real_comments = function(){log("already loaded them all!");};
};
self.get_ajax_comments = injectComments;
document.observe('dom:loaded', function() {
  //log("prototypes");
});
//log("calling injects…");
//self.get_real_comments(true, function(){;});

//log("add actions:"+self.add_comment_actions);
var inj_comment_actions = self.add_comment_actions;
var injectActions = function() {
  log("calling add_comment_actions");
  inj_comment_actions();
  log("trying to force comments now…");
  //self.get_real_comments(true, function(){;});
//
//continue_loading_comments();
//updatePage(forceAll=true)
//
  self.continue_loading_comments();
};
self.add_comment_actions = injectActions;