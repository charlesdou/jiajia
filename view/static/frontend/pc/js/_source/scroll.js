(function($){    
  $.fn.extend({
    scrollPlugin:function(options){
      var _this = $(this);
      _this.defaults = {
          arrowBtn:true,
          autoPlay:true,
          stepNum: 0,
          leftArrowBtnClass:"leftBtn",
          rightArrowBtnClass:"rightBtn",
          conChildrenClassName:"con",
          animateTime:1000,
          autoPlayTime:3000,
          animateStyle:["left",""]
      };
      _this.options = $.extend(_this.defaults, options);
      _this.scrollConObj = _this.find("."+_this.options.conChildrenClassName);
      _this.hasStepNum = 0;
      _this.allStepNum = _this.options.animateStyle[0] == "left" ? _this.scrollConObj.width() : _this.scrollConObj.height();
      _this.autoPlayTimeId;
      _this.animation = false;
      _this.animateDirection = 1;
      _this.scrollConHtml = _this.scrollConObj.html();
      _this.scrollConObj.html(_this.scrollConHtml + _this.scrollConHtml);
      
      var _next = function(){
        if(!_this.animation){
          _this.animateDirection = 1;
          if(_this.hasStepNum <= - _this.allStepNum){
            _this.hasStepNum = _this.hasStepNum + _this.allStepNum;
            _this.options.animateStyle[0] == "left" ? _this.scrollConObj.css("marginLeft",_this.hasStepNum) : _this.scrollConObj.css("marginTop",_this.hasStepNum);
          }
          _scrollAnimation();
        }
      }

      var _prev = function(){
        if(!_this.animation){
          _this.animateDirection = -1;
          if( _this.hasStepNum >= - _this.options.stepNum){
            _this.hasStepNum = _this.hasStepNum - _this.allStepNum;
            _this.options.animateStyle[0] == "left" ? _this.scrollConObj.css("marginLeft",_this.hasStepNum) : _this.scrollConObj.css("marginTop",_this.hasStepNum);
          }
          _scrollAnimation();
        }
      }

      var _startAutoPlay = function(){
        clearTimeout(_this.autoPlayTimeId);
        _this.autoPlayTimeId = setInterval(_next,_this.options.autoPlayTime);
      }

      var _stopAutoPlay = function(){
        clearTimeout(_this.autoPlayTimeId);
      }

      var _scrollAnimation = function(){
        _this.animation = true;
        if(_this.options.animateStyle[0] == "left"){
          _this.scrollConObj.animate({marginLeft:_this.hasStepNum-(_this.animateDirection*_this.options.stepNum)},{ duration: _this.options.animateTime, easing: _this.options.animateStyle[1], complete: _animateEnd});
        }else if(_this.options.animateStyle[0] == "top"){
          _this.scrollConObj.animate({marginTop:_this.hasStepNum-(_this.animateDirection*_this.options.stepNum)},{ duration: _this.options.animateTime, easing: _this.options.animateStyle[1], complete: _animateEnd});
        }
      }

      var _animateEnd = function(){
        _this.animation = false;
        _this.hasStepNum = _this.hasStepNum-(_this.animateDirection*_this.options.stepNum);
      }

      var _reinit = function(changeOptions){
        clearTimeout(_this.autoPlayTimeId);
        _this.options = $.extend(_this.options, changeOptions);
        _this.hasStepNum = 0;
        _this.allStepNum = _this.options.animateStyle[0] == "left" ? _this.scrollConObj.width()/2 : _this.scrollConObj.height()/2;
        _this.scrollConObj.stop();
        if(_this.options.animateStyle[0] == "left"){
          _this.scrollConObj.css("marginLeft","0");
        }else if(_this.options.animateStyle[0] == "top"){
          _this.scrollConObj.css("marginTop","0");
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

      if(_this.options.autoPlay){
        _startAutoPlay();
        _this.bind("mouseout",function(){
          _startAutoPlay();
        })
        _this.bind("mouseover",function(){
          _stopAutoPlay();
        })
      }

      if(_this.options.arrowBtn){
        _this.find("."+_this.options.leftArrowBtnClass).bind("click",function(){_prev();});
        _this.find("."+_this.options.rightArrowBtnClass).bind("click",function(){_next();});
      }

      return _this;

    }
  })    
})(jQuery);