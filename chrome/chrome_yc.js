// ==UserScript==
// @name          YCombinator User Tracker 
// @include       /^https?://news\.ycombinator\.com/item\?id=.*$/
// @grant         none
// @namespace     reputation.herokuapp.com
// @version       1.0.0
// ==/UserScript==

var baseURL = "https://reputation.herokuapp.com";

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
      console.log("success:"+JSON.stringfify(response));
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
    console.log("sending user rep data to url:"+url);
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
/*
delete url should include 'id:<comment_id>'
var per_comment_template = "
<div class='comments_about_user_id_<% local_user_id %> <% comment_id %>'>
    <a href='#' class='<% comment_id %>'
    onClick='return deleteUserReputationData(<% delete_url %>)'</a> : <% comment_text %>
<div>";
var opts = {
    comment_id: '',
    comment_text: '',
    local_user_id: '',
    delete_url: '',
}
_.template(per_comment_template, opts)
//*/
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
    return sendDataURL = "https://reputation.herokuapp.com/userData/".concat(
        commentProperties.userScriptId,"/",
        commentProperties.site,"/",
        commentProperties.articleId,"/",
        commentProperties.siteUsername,"/",
        commentProperties.siteUserId,"/",
        commentProperties.commentId,restAction
    );
}

function getSendDataURL(user_script_id, commentProperties, methodAction) {
    var restAction = methodAction || "/add";
    return "https://reputation.herokuapp.com/userData/".concat(
        user_script_id,"/",
        commentProperties.curDomain,"/",
        commentProperties.articleId,"/",
        commentProperties.userName,"/",
        commentProperties.userId,"/",
        commentProperties.commentId,
        restAction);
}
function getGetDataURL(user_script_id, commentProperties) {
  return "https://reputation.herokuapp.com/userComments/".concat(
    user_script_id,"/",
    commentProperties.curDomain,"/",
    commentProperties.userId,"/get?callback=userReputationDataCallback"
  );
}
function getFormHTMLPrefix(user_script_id, commentProperties) {
  return "<div id='user_rep_tracker_div' class='userId_"+commentProperties.userId+"'>"
    + "<form name='input' method='get' onsubmit='return sendUserReputationData(\""
    + getSendDataURL(user_script_id, commentProperties) + "\", "
    + "this.userComment.value" + ", \""
    + commentProperties.userId + "\");' "
    + "class='commentSubmitForms'>";
};
function getFormHTMLSuffix(user_script_id, commentProperties) {
  return "<input type='text' name='userComment'>"
    +"<input type='submit' value='Submit'>"
    +"<br><a href='#' class='getFor_"+commentProperties.userId+"' "
    +"onClick='return getUserReputationData(\""
    +getGetDataURL(user_script_id, commentProperties)
    +"\",\""+commentProperties.curDomain//site,script,user params not actually used
    +"\",\""+user_script_id
    +"\",\""+commentProperties.userId
    +"\");'>Check Your Comments on "+commentProperties.userName+"</a><br>"
    +"</form>"
    +"</div>";
};
function getFormHTML(user_script_id, commentProperties) {
  var sendDataURL = getSendDataURL(user_script_id, commentProperties);
  var getDataURL = getGetDataURL(user_script_id, commentProperties);
  var inputs = "".concat("<input type='hidden' name='site' value='"+ commentProperties.curDomain+"' />"
  , "<input type='hidden' name='articleId' value='"+ commentProperties.articleId+"' />"
  , "<input type='hidden' name='userId' value='"+ commentProperties.userId+"' />"
  , "<input type='hidden' name='userName' value='"+ commentProperties.userName+"' />"
  , "<input type='hidden' name='userScriptId' value='"+ user_script_id +"' />"
  , "<input type='hidden' name='sendDataUrl' value='"+sendDataURL+"' />"
  , "<input type='hidden' name='getDataUrl' value='"+getDataURL+"' />");
  return getFormHTMLPrefix(user_script_id, commentProperties) + inputs + getFormHTMLSuffix(user_script_id, commentProperties);
}
function insertHTML(user_script_id, aCommentNode, commentProperties) {
  aCommentNode.insert({after:getFormHTML(user_script_id, commentProperties)});
}

var initial_comment_fetch = function(id_list, base_url, user_script_id, cur_domain) {
    var init_url = base_url+"/userComments/"+user_script_id+"/"+cur_domain+"/get";
    var params = "&callback=userBatchDataCallback";
    for(var i=0,iLen=id_list.length;i<iLen;i++) {
        params+="&idList="+id_list[i];
    }
    var xhr = new XMLHttpRequest();

    xhr.open("GET", init_url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var resp = JSON.parse(xhr.responseText);
            userBatchDataCallback(resp);
        }
    }
    xhr.send(params);
};

var insert_required_scripts = function() {
    //specific to HN
    var scripts = [
        'https://ajax.googleapis.com/ajax/libs/prototype/1.7.1.0/prototype.js'
    ];
    for(var i=0,iLen=scripts.length;i<iLen;i++) {
        var script = document.createElement('script');
        script.src = scripts[i];
        document.getElementsByTagName('head')[0].appendChild(script);
    }
};

var init_static_comment_forms = function(user_script_id) {
    var idAggr={},idList=[];
    var comheads = $$("span.comhead");
    
    var parser = document.createElement('a');
    parser.href = window.location.href;
    var articleId = parser.search.split('=')[1];
    var curDomain = parser.hostname.split('.')[1];

    for(var i=0,iLen=comheads.length;i<iLen;i++) {
        var comHead = comheads[i];
        var anchors = comHead.getElementsByTagName("a");
        if(!anchors || anchors.length != 2) continue;  // skip first span/link which is user who submitted the item
        if(!anchors[0]) continue;
        var userName = anchors[0].href.split('=')[1];
        var userId = userName;
        var commentId = anchors[1].href.split('=')[1];

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
        insertHTML(user_script_id, comHead, commentProperties);
    }

    return {id_list: idList, current_domain: curDomain};
};

chrome.storage.sync.get(
    {script_id: ''},
    function(items) {
        var user_script_id = items.script_id;

        // populate the in-page id list
        // build out the html
        var init_data = init_static_comment_forms(user_script_id);
        var idList = init_data.id_list;
        var curDomain = init_data.current_domain;

        insert_required_scripts();

        //load functions onto page for use in DOM
        insertScriptText("var baseURL ='"+baseURL+"';");
        insertScriptText("var userScriptId ='"+user_script_id+"';");
        insertScriptText(insertScript.toString());
        insertScriptText(sendRequest.toString());
        insertScriptText(sendUserReputationData.toString());
        insertScriptText(getDeleteLink.toString());
        insertScriptText(deleteUserReputationData.toString());
        insertScriptText(getUserReputationData.toString());
        insertScriptText(userReputationDataCallback.toString());
        insertScriptText(getSendDataURLOnPage.toString());
        insertScriptText(userBatchDataCallback.toString());

        initial_comment_fetch(idList, baseURL, user_script_id, curDomain);
    }
);