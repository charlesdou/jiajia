(function($){    
  $.fn.extend({
    slideFocusPlugin:function(options){
      var _this = $(this);
      _this.defaults = {
          startNum:1,
          tabNum:false,
          arrowBtn:false,
          autoPlay:true,
          leftArrowBtnClass:"leftBtn",
          rightArrowBtnClass:"rightBtn",
          tabClassName:"tabList",
          conClassName:"conList",
          conChildrenClassName:"con",
          selectClass:"cur",
          funType:"mouseenter",
          animateTime:1000,
          autoPlayTime:3000,
          delayTime:200,
          zIndex:10,
          animateStyle:["left",""],
          tabTagName:"i",
          tabTagElement:"number"
      }
      _this.options = $.extend(_this.defaults, options);
      _this.tabTagArr;
      _this.tabTagHtml = "";
      _this.tabConArr = _this.find("."+_this.options.conClassName).children("."+_this.options.conChildrenClassName);
      _this.tabAllNum = _this.tabConArr.length;
      _this.nextNum = _this.options.startNum - 1 >= _this.tabAllNum ? _this.tabAllNum - 1 : _this.options.startNum - 1;
      _this.prevNum = 0;
      _this.tempNum = 0;
      _this.hasNextPlay = false;
      _this.delayTimeId;
      _this.autoPlayTimeId;
      _this.animation = false;
      _this.animateDirection = 1;

      var _next = function(){
        if(!_this.animation){
          _this.animateDirection = 1;
          _this.prevNum = _this.nextNum;
          if(_this.nextNum == _this.tabAllNum - 1){
            _this.nextNum = 0;
          }else{
            _this.nextNum ++;
          }
          _slide();
        }
      }

      var _prev = function(){
        if(!_this.animation){
          _this.animateDirection = -1;
          _this.prevNum = _this.nextNum;
          if(_this.nextNum == 0){
            _this.nextNum = _this.tabAllNum - 1;
          }else{
            _this.nextNum --;
          }
          _slide();
        }
      }

      var _go = function(){
        _this.animateDirection = 1;
        if(!_this.animation){
          _this.prevNum = _this.nextNum;
          _this.nextNum = _this.tempNum;
          if(_this.prevNum != _this.nextNum){
            _slide();
          }
        }else{
          _this.hasNextPlay = true;
        }
      }

      var _startAutoPlay = function(){
        clearTimeout(_this.autoPlayTimeId);
        _this.autoPlayTimeId = setInterval(_next,_this.options.autoPlayTime);
      }

      var _stopAutoPlay = function(){
        clearTimeout(_this.autoPlayTimeId);
      }

      var _slide = function(){
        _this.animation = true;
        _this.tabTagArr.eq(_this.prevNum).removeClass(_this.options.selectClass);
        _this.tabTagArr.eq(_this.nextNum).addClass(_this.options.selectClass);
        _this.tabConArr.eq(_this.nextNum).css({"z-index":_this.options.zIndex,"display":"block"});
        _this.tabConArr.eq(_this.prevNum).css({"z-index":_this.options.zIndex - 1});
        _this.tabConArr.eq(_this.nextNum).css(_this.options.animateStyle[0],_this.animateDirection * _this.options.stepNum);
        if(_this.options.animateStyle[0] == "left"){
          _this.tabConArr.eq(_this.nextNum).animate({left:0},{ duration: _this.options.animateTime, easing: _this.options.animateStyle[1]});
          _this.tabConArr.eq(_this.prevNum).animate({left:-(_this.animateDirection*_this.options.stepNum)},{ duration: _this.options.animateTime + 1, easing: _this.options.animateStyle[1], complete: _animateEnd});
        }else if(_this.options.animateStyle[0] == "top"){
          _this.tabConArr.eq(_this.nextNum).animate({top:0},{ duration: _this.options.animateTime, easing: _this.options.animateStyle[1]});
          _this.tabConArr.eq(_this.prevNum).animate({top:-(_this.animateDirection*_this.options.stepNum)},{ duration: _this.options.animateTime + 1, easing: _this.options.animateStyle[1], complete: _animateEnd});
        }else if(_this.options.animateStyle[0] == "fade"){
          _this.tabConArr.eq(_this.nextNum).css("display","none");
          _this.tabConArr.eq(_this.prevNum).fadeOut(_this.options.animateTime);
          _this.tabConArr.eq(_this.nextNum).fadeIn(_this.options.animateTime,function(){
            _animateEnd();
          });
        }
      }

      var _animateEnd = function(){
        _this.animation = false;
        _this.tabConArr.eq(_this.prevNum).css({"z-index":_this.options.zIndex - 2,"display":"none"});
        if(Boolean(_this.options.callbackFun)){
          _this.options.callbackFun(_this.nextNum,_this.prevNum);
        }
        if(_this.hasNextPlay && _this.nextNum != _this.tempNum){
          _this.hasNextPlay = false;
          _this.prevNum = _this.nextNum;
          _this.nextNum = _this.tempNum;
          _slide();
        }
      }

      var _reinit = function(changeOptions){
        clearTimeout(_this.autoPlayTimeId);
        _this.options = $.extend(_this.options, changeOptions);

        if(_this.options.animateStyle[0] == "left"){
          _this.tabConArr.eq(_this.prevNum).css({"left":-(_this.animateDirection*_this.options.stepNum),"display":"none"});
          _this.tabConArr.eq(_this.nextNum).css({"left":"0","display":"block"});
        }else if(_this.options.animateStyle[0] == "top"){
          _this.tabConArr.eq(_this.prevNum).css({"top":-(_this.animateDirection*_this.options.stepNum),"display":"none"});
          _this.tabConArr.eq(_this.nextNum).css({"top":"0","display":"block"});
        }

        if(_this.options.autoPlay){
          _startAutoPlay();
        }
      }

      _this.reinit = function(changeOptions){
        _reinit(changeOptions);
      }

      _this.next = function(){
        _next();
      }

      _this.prev = function(){
        _prev();
      }

      if(!_this.options.tabNum){
        for(var i=1;i<=_this.tabAllNum;i++){
          if(_this.options.tabTagElement == "number"){
            _this.tabTagHtml += "<i>"+ i + "</i>";
          }else{
            _this.tabTagHtml += "<i>"+ _this.options.tabTagElement + "</i>";
          }
          
        }
        _this.find("."+_this.options.tabClassName).html(_this.tabTagHtml);
        _this.tabTagArr = _this.find("."+_this.options.tabClassName).children();
      }else{
        _this.tabTagArr = _this.find("."+_this.options.tabClassName).children(_this.options.tabTagName);
      }
      
      _this.tabTagArr.bind(_this.options.funType,function(){
        _this.tempNum = _this.tabTagArr.index($(this));
        if(_this.options.funType == "mouseover"  || _this.options.funType == "mouseenter"){
          clearTimeout(_this.delayTimeId);
          _this.delayTimeId = setTimeout(_go,_this.options.delayTime);
        }else{
          _go();
        }
      })

      if(_this.options.funType == "mouseover" || _this.options.funType == "mouseenter"){
        _this.tabTagArr.bind("mouseout",function(){
          _this.hasNextPlay = false;
          clearTimeout(_this.delayTimeId);
        })
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

      if(_this.options.arrowBtn){
        _this.find("."+_this.options.leftArrowBtnClass).bind("click",function(){_prev();});
        _this.find("."+_this.options.rightArrowBtnClass).bind("click",function(){_next();});
      }
      _this.tabTagArr.eq(_this.nextNum).addClass(_this.options.selectClass);
      _this.tabConArr.eq(_this.nextNum).css({"z-index":_this.options.zIndex,"display":"block"});

      return _this;

    }
  })    
})(jQuery);