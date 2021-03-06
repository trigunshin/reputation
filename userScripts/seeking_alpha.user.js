// ==UserScript==
// @name          SeekingAlpha User Tracker 
// @include       http://seekingalpha.com/article/*
// @grant         none
// @namespace     reputation.herokuapp.com
// @version       1.0.0
// ==/UserScript==
var startTime = (new Date()).getTime();
var baseURL = "http://reputation.herokuapp.com";
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
      console.log("success:"+response);
      if(cb) cb(null, response);
    },
    onFailure: function(response) {
      console.log("failed:"+JSON.stringify(response));
      if(cb) cb(response);
    }
  });
  return false;
}
function sendUserReputationData(url, userCommentText, siteUserId) {
  sendRequest(url, 'get', {comment:userCommentText}, function(err, transport) {
    if(err) {console.log("error sending data...");return;}
    $$("a.getFor_"+siteUserId)[0].click();
  });
  return false;
};
function deleteUserReputationData(url, params) {
  sendRequest(url, 'DELETE', params, function(err, transport) {
    if(err) {return console.log("error sending data...");}
    $$("div."+params.id).each(function(item) {
      item.remove();
    });
  });
  return false;
};
function getUserReputationData(url, site, scriptId, userId) {
  insertScript(url);
  return false;
};
function getDeleteLink(userCommentObj) {
  var ret = "<a href='#' ";
  ret = ret + "class='"+userCommentObj['_id']+"' ";
  var delUrl = getSendDataURLOnPage(userCommentObj, "/remove");
  var params = {id:userCommentObj['_id']};
  ret = ret + "onClick='return deleteUserReputationData(\""
    + delUrl
    +"\", "+JSON.stringify(params)+")'>";
  ret = ret + "Delete</a>";
  return ret;
};
function userReputationDataCallback(responseArray) {
  if(!responseArray || !responseArray.length) return false;
  responseArray = [].concat(responseArray);
  var localSiteUserId = responseArray[0].siteUserId;

  var commentDivs = $$(".comments_about_user_id_"+localSiteUserId);
  for(var i=0,iLen = commentDivs.length;i<iLen;i++) {
    commentDivs[i].remove();
  }
  var commentDivs = $$(".userId_"+localSiteUserId);
  for(var j=0,jLen = commentDivs.length;j<jLen;j++) {
    for(var i=0,iLen=responseArray.length;i<iLen;i++) {
      var tmp = "<div class='comments_about_user_id_" 
        + responseArray[i].siteUserId
        + " " + responseArray[i]['_id'] + "'>"
        + getDeleteLink(responseArray[i]) + ": "
        + responseArray[i].userCommentText
        + "</div>";
      commentDivs[j].insert({bottom:tmp});
    }
    commentDivs[j].insert({bottom:"<hr class='comments_about_user_id_"+localSiteUserId+"'>"});
  }
  
};
function getSendDataURLOnPage(commentProperties, methodAction) {
  var restAction = methodAction || "/add";
  return sendDataURL = baseURL+"/userData/".concat(
    commentProperties.userScriptId,"/",
    commentProperties.site,"/",
    commentProperties.articleId,"/",
    commentProperties.siteUsername,"/",
    commentProperties.siteUserId,"/",
    commentProperties.commentId,restAction
  );
}
function userBatchDataCallback(data) {
  var responseArray = data.data;
  var userCommentMap={},userIdList=[];
  if(!responseArray || !responseArray.length) return false;
  responseArray = [].concat(responseArray);
  for(var i=0,iLen=responseArray.length;i<iLen;i++) {
    //bucket by id
    var cur = responseArray[i];
    if(!userCommentMap[cur.siteUserId]) {
      userIdList.push(cur.siteUserId);
      userCommentMap[cur.siteUserId]=[cur];
    } else userCommentMap[cur.siteUserId].push(cur);
  }
  //then for each id, do the removal/inserts
  for(var i=0,iLen=userIdList.length;i<iLen;i++) {
    var curId = userIdList[i];
    //remove existing comments
    var commentDivs = $$(".comments_about_user_id_"+curId);
    for(var j=0,jLen = commentDivs.length;j<jLen;j++) {
      commentDivs[j].remove();
    }
    //append acquired comments
    var commentDivs = $$(".userId_"+curId);
    for(var j=0,jLen = commentDivs.length;j<jLen;j++) {
      var curUserComments = userCommentMap[curId];
      for(var z=0,zLen=curUserComments.length;z<zLen;z++) {
        var tmp = "<div class='comments_about_user_id_" 
          + curUserComments[z].siteUserId
          + " " + curUserComments[z]['_id'] + "'>"
          + getDeleteLink(curUserComments[z]) + ": "
          + curUserComments[z].userCommentText
          + "</div>";
        commentDivs[j].insert({bottom:tmp});
      }
      commentDivs[j].insert({bottom:"<hr class='comments_about_user_id_"+curId+"'>"});
    }
  }
};
//load functions onto page for use in DOM
insertScriptText("var baseURL ='"+baseURL+"';");
insertScriptText(userBatchDataCallback.toString());
insertScriptText(insertScript.toString());
insertScriptText(sendRequest.toString());
insertScriptText(sendUserReputationData.toString());
insertScriptText(getDeleteLink.toString());
insertScriptText(deleteUserReputationData.toString());
insertScriptText(getUserReputationData.toString());
insertScriptText(userReputationDataCallback.toString());
insertScriptText(getSendDataURLOnPage.toString());

function getSendDataURL(commentProperties, methodAction) {
  var restAction = methodAction || "/add";
  return sendDataURL = baseURL+"/userData/".concat(
  userScriptId,"/",
    commentProperties.curDomain,"/",
    commentProperties.articleId,"/",
    commentProperties.userName,"/",
    commentProperties.userId,"/",
    commentProperties.commentId,restAction
  );
}
function getGetDataURL(commentProperties) {
  return baseURL+"/userComments/".concat(
    userScriptId,"/",
    commentProperties.curDomain,"/",
    commentProperties.userId,"/get?callback= userReputationDataCallback"
  );
}
function getFormHTMLPrefix(commentProperties) {
  return "<div id='user_rep_tracker_div' class='userId_"+commentProperties.userId+"'>"
    + "<form name='input' method='get' onsubmit='return sendUserReputationData(\""
    + getSendDataURL(commentProperties) + "\", "
    + "this.userComment.value" + ", \""
    + commentProperties.userId + "\");' "
    + "class='commentSubmitForms'>";
    
};
function getFormHTMLSuffix(commentProperties) {
  return "<input type='text' name='userComment'>"
    +"<input type='submit' value='Submit'>"
    +"<br><a href='#' class='getFor_"+commentProperties.userId+"' "
    +"onClick='return getUserReputationData(\""
    +getGetDataURL(commentProperties)
    +"\",\""+commentProperties.curDomain
    +"\",\""+userScriptId
    +"\",\""+commentProperties.userId
    +"\");'>Check Your Comments on "+commentProperties.userName+"</a><br>"
    +"</form>"
    +"</div>";
};
function getFormHTML(commentProperties) {
  var sendDataURL = getSendDataURL(commentProperties);
  var getDataURL = getGetDataURL(commentProperties);
  var inputs = "".concat("<input type='hidden' name='site' value='"+ commentProperties.curDomain+"' />"
  , "<input type='hidden' name='articleId' value='"+ commentProperties.articleId+"' />"
  , "<input type='hidden' name='userId' value='"+ commentProperties.userId+"' />"
  , "<input type='hidden' name='userName' value='"+ commentProperties.userName+"' />"
  , "<input type='hidden' name='userScriptId' value='"+ userScriptId+"' />"
  , "<input type='hidden' name='sendDataUrl' value='"+sendDataURL+"' />"
  , "<input type='hidden' name='getDataUrl' value='"+getDataURL+"' />");
  return getFormHTMLPrefix(commentProperties) + inputs + getFormHTMLSuffix(commentProperties);
}
function insertHTML(aCommentNode, commentProperties) {
  aCommentNode.insert({after:getFormHTML(commentProperties)});
}
var doInitialLoad = function(url,idList) {
  var submitURL = url;
  log(idList);
  for(var i=0,iLen=idList.length;i<iLen;i++) {
    submitURL+="&idList="+idList[i];
  }
  insertScript(submitURL);
};
var commonClassName = "rep_visited_class";
var commentSelector = "div.com_info:not(."+commonClassName+")";
var idAggr={},idList=[];
var afterDomInsert = function(cb) {
  return function() {
    var curDomain = document.domain.split('.')[0];
    var articleId = window.location.href.match(/[\d]+/);
    var elements = $$(commentSelector);
    for(var i=0,iLen=elements.length;i<iLen;i++) {
      elements[i].select("a.commenter_name").each(function(node) {
        var userName = node.readAttribute('fullname');
        var match = node.readAttribute('onmouseover').match(/[\d]+/g);
        var userId = match[0];
        var commentId = match[1];
        var commentProperties = {
          curDomain:curDomain,
          articleId:articleId,
          userName:userName,
          userId:userId,
          commentId:commentId
        };
        if(!idAggr[userId]) {
          idAggr[userId]=1;
          idList.push(userId);
        }
        insertHTML(elements[i].parentNode.firstElementChild, commentProperties);//technically this could run >1 times...
        elements[i].addClassName(commonClassName);
      });
    }
    console.log("idLen:"+idList.length);
    doInitialLoad(baseURL+"/userComments/"+userScriptId+"/"+curDomain+"/get?callback=userBatchDataCallback",idList);
    if(cb) cb();
  };
};
var injectComments = function(forceAll, onComplete) {
  self.get_real_comments(true, afterDomInsert(onComplete));
  self.get_real_comments = function() {
    //log("already loaded them all!");
  };
};
self.get_real_comments = self.get_ajax_comments;
self.get_ajax_comments = injectComments;

var injectActions = function() {
  self.inj_comment_actions();
  self.continue_loading_comments();
};
self.inj_comment_actions = self.add_comment_actions;
self.add_comment_actions = injectActions;


self.getComComplete = SA.Pages.Article.getCommentsComplete;
var injectComComplete = function(response) {
  self.getComComplete(response);
  afterDomInsert()();
};
SA.Pages.Article.getCommentsComplete = injectComComplete;

document.observe('dom:loaded', function() {;});