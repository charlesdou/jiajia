(function($){    
  $.fn.extend({
    showPopWinPlugin:function(){
      var _this = $(this);
      _this.parent(".popWinMask").show();
      _this.show();
      $(window).bind("resize",function(){
        setMarginTop();
      });
      _this.find(".popClose").bind("click",function(){
        _this.parent(".popWinMask").hide();
        _this.hide();
      });
      if(!-[1,]&&!window.XMLHttpRequest){
        _this.parent(".popWinMask").css({"height": $("body").height() - $(window).height() > 0 ? parseInt($("body").height()) : parseInt($(window).height())});
        setMarginTopIE6();
        $(window).bind("scroll",function(){
          setMarginTopIE6();
        });  
      }else{
        setMarginTop();
      }
      function setMarginTop(){
        _this.css("margin-top",-(parseInt(_this.css("padding-top") + _this.css("padding-bottom")) + _this.height())/2);
      }
      function setMarginTopIE6(){
        _this.css("margin-top", document.body.scrollTop || document.documentElement.scrollTop  + ($(window).height() - _this.height())/2);
      }
    }
  })    
})(jQuery);