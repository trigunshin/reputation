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

document.observe('dom:loaded', function(){
//log("prototypes");
});
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
  self.get_real_comments(true, afterDomInsert(onComplete));
  self.get_real_comments = function(){log("already loaded them all!")};
  //log("isUpdating:"+self.isUpdating);
  //self.isUpdating = false;
};
self.get_ajax_comments = injectComments;
