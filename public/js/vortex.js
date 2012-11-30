$(document).ready(function() {
    var selector = $('input#loginBaseUrl');
    if(selector[0]) {
        selector[0].value = window.location.pathname;
    }
    $(function() {
        $("a.fav_link").click(function() {
            var anchor = $(this);
            var id = anchor.attr("id");
            
            if(anchor.hasClass("starred")) {
                $.post("/favorites/remove?ticker="+id, {id: id}, function(resp) {
                    anchor.removeClass("starred").find("img").attr("src", "/imgs/dark_star.png");
                    $("#fav_li_"+id).remove();
                });
            }
            else {
                $.post("/favorites/add?ticker="+id, {id: id}, function(resp) {
                    anchor.addClass("starred");
                    $("#favImg").attr("src", "/imgs/bright_star.png");
                    $("ul#fav_ul").append('<li id="fav_li_'+id+'"></li>');
                    $("li#fav_li_"+id).append('<a href="/overview/'+id+'">'+id+'</a>');
                });
            }
            return false;
        });
    });
});
