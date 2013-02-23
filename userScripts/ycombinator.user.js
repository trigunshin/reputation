// ==UserScript==
// @name          YCombinator User Tracker 
// @include       http://news.ycombinator.com/item?id=*
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
  return sendDataURL = "http://reputation.herokuapp.com/userData/".concat(
    commentProperties.userScriptId,"/",
    commentProperties.site,"/",
    commentProperties.articleId,"/",
    commentProperties.siteUsername,"/",
    commentProperties.siteUserId,"/",
    commentProperties.commentId,restAction
  );
}
//load functions onto page for use in DOM
insertScriptText("var baseURL ='"+baseURL+"';");
insertScriptText(insertScript.toString());
insertScriptText(sendRequest.toString());
insertScriptText(sendUserReputationData.toString());
insertScriptText(getDeleteLink.toString());
insertScriptText(deleteUserReputationData.toString());
insertScriptText(getUserReputationData.toString());
insertScriptText(userReputationDataCallback.toString());
insertScriptText(getSendDataURLOnPage.toString());
insertScriptText(userBatchDataCallback.toString());


function getSendDataURL(commentProperties, methodAction) {
  var restAction = methodAction || "/add";
  return sendDataURL = "http://reputation.herokuapp.com/userData/".concat(
  userScriptId,"/",
    commentProperties.curDomain,"/",
    commentProperties.articleId,"/",
    commentProperties.userName,"/",
    commentProperties.userId,"/",
    commentProperties.commentId,restAction
  );
}
function getGetDataURL(commentProperties) {
  return "http://reputation.herokuapp.com/userComments/".concat(
    userScriptId,"/",
    commentProperties.curDomain,"/",
    commentProperties.userId,"/get?callback=userReputationDataCallback"
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
    +"\",\""+commentProperties.curDomain//site,script,user params not actually used
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

//specific to HN
var scripts = [
    'https://ajax.googleapis.com/ajax/libs/prototype/1.7.1.0/prototype.js'
];
for (i in scripts) {
    var script = document.createElement('script');
    script.src = scripts[i];
    document.getElementsByTagName('head')[0].appendChild(script);
}
var idAggr={},idList=[];
window.addEventListener('load', function(event) {
  $ = unsafeWindow['window'].$;
  $$ = unsafeWindow['window'].$$;
  var comheads = $$("span.comhead");
  var articleId = window.location.href.split('=')[1];
  var curDomain = document.domain.split('.')[1];
  for(var i=0,iLen=comheads.length;i<iLen;i++) {
    var comHead = comheads[i];
    anchors = comHead.select("a");
    if(!anchors[0]) continue;
    var userName = anchors[0].readAttribute('href').split('=')[1];
    var userId = userName;
    var commentId = anchors[1].readAttribute('href').split('=')[1];
    
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
    insertHTML(comHead, commentProperties);
  }
  doInitialLoad(baseURL+"/userComments/"+userScriptId+"/"+curDomain+"/get?callback=userBatchDataCallback",idList);
  document.observe('dom:loaded', function() {});
});