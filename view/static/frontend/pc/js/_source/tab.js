(function($){    
  $.fn.extend({
    setTabPlugin:function(options){
      var _this = $(this);
      _this.defaults = {
          startNum:1,
          tabClassName:"tabList",
          conClassName:"conList",
          selectClass:"cur",
          conChildrenClassName:"con",
          autoPlay:true,
          autoPlayTime:3000,
          funType:"mouseenter",
          delayTime:200,
          tabTagName:"i"
      }
      _this.options = $.extend(_this.defaults, options);
      _this.tabTagArr = _this.find("."+_this.options.tabClassName).children(_this.options.tabTagName),
      _this.tabConArr = _this.find("."+_this.options.conClassName).children("."+_this.options.conChildrenClassName),
      _this.tabAllNum = _this.tabTagArr.length>=_this.tabConArr.length?_this.tabConArr.length:_this.tabTagArr.length,
      _this.curNum = _this.options.startNum - 1 >= _this.tabAllNum ? _this.tabAllNum - 1 : _this.options.startNum - 1,
      _this.delayTimeId,
      _this.autoPlayTimeId,
      _this.tempNum = _this.curNum,
      _this.prevNum,
      _this.eventStyle;

      var _next = function(){
        _this.tempNum = _this.curNum;
        _this.curNum++;
        if(_this.curNum >= _this.tabAllNum){
          _this.curNum = 0;
        }
        _dataShow();
      }

      var _startAutoPlay = function(){
        clearTimeout(_this.autoPlayTimeId);
        _this.eventStyle = "autoPlay";
        _this.autoPlayTimeId = setInterval(_next,_this.options.autoPlayTime);
      }

      var _stopAutoPlay = function(){
        clearTimeout(_this.autoPlayTimeId);
      }

      var _dataShow = function(){
        _this.tabTagArr.removeClass(_this.options.selectClass);
        _this.tabConArr.hide();
        _this.tabTagArr.eq(_this.curNum).addClass(_this.options.selectClass);
        _this.tabConArr.eq(_this.curNum).show();
        _this.prevNum = _this.tempNum;
        if(Boolean(_this.options.callbackFun)){
          _this.options.callbackFun(_this.curNum,_this.prevNum,_this.eventStyle);
        }
      }

      _dataShow();
      for(var i=0;i<_this.tabAllNum;i++){
        _this.tabTagArr.eq(i).bind(_this.options.funType,function(){
          _this.eventStyle = _this.options.funType;
          _this.tempNum = _this.curNum;
          _this.curNum = _this.tabTagArr.index($(this));
          if(_this.options.funType == "mouseenter"||_this.options.funType == "mouseover"){
            clearTimeout(_this.delayTimeId);
            _this.delayTimeId = setTimeout(_dataShow,_this.options.delayTime);
          }else{
            _dataShow();
          }
        })
        if(_this.options.funType == "mouseenter"||_this.options.funType == "mouseover"){
          _this.tabTagArr.eq(i).bind("mouseout",function(){
            clearTimeout(_this.delayTimeId);
          })
        }
      }

      if(_this.options.autoPlay){
        _startAutoPlay();
        _this.bind("mouseout",function(){
          _startAutoPlay();
        })
        _this.bind("mouseenter",function(){
          _stopAutoPlay();
        })
      }


    }
  })    
})(jQuery);