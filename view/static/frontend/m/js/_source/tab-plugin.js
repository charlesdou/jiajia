$(function(){
  if($(".tab-plugin").length > 0){
    $(".tab-plugin").each(function(){
      var pluginTabArr = $(this).find(".tab-plugin-tab"),pluginConArr = $(this).find(".tab-plugin-con");
      pluginTabArr.bind("touchend",function(){
        pluginConArr.css({"display":"none"});
        pluginTabArr.removeClass("cur");
        pluginConArr.eq(pluginTabArr.index($(this))).css({"display":"block"});
        $(this).addClass("cur");
      })
    })
  }
})