(function($){    
  $.fn.extend({
    scrollingPlugin:function(options){
      var _this = $(this);
      _this.defaults = {
          arrowBtn:true,
          leftArrowBtnClass:"leftBtn",
          rightArrowBtnClass:"rightBtn",
          conChildrenClassName:"con",
          animateStyle:"left",
          stepNum:1,
          direction:1
      }
      _this.options = $.extend(_this.defaults, options);
      _this.scrollConObj = _this.find("."+_this.options.conChildrenClassName);
      _this.marginNum = 0;
      _this.allStepNum = _this.options.animateStyle == "left" ? _this.scrollConObj.width() : _this.scrollConObj.height();
      _this.autoPlayTimeId;
      _this.animation = false;
      _this.animateDirection = _this.options.direction;
      _this.scrollConHtml = _this.scrollConObj.html();
      _this.scrollConObj.html(_this.scrollConHtml + _this.scrollConHtml);
      
      var _next = function(){
        _this.animateDirection = 1;
      }

      var _prev = function(){
        _this.animateDirection = -1;
      }

      var _startAutoPlay = function(){
        clearTimeout(_this.autoPlayTimeId);
        _this.autoPlayTimeId = setInterval(_scrollAnimation,10);
      }

      var _stopAutoPlay = function(){
        clearTimeout(_this.autoPlayTimeId);
      }

      var _scrollAnimation = function(){
        if(_this.animateDirection == 1){
          _this.marginNum += _this.options.stepNum;
          if(_this.marginNum >= _this.allStepNum){
            _this.marginNum  = _this.marginNum - _this.allStepNum;
          }
        }else if(_this.animateDirection == -1){
          _this.marginNum -= _this.options.stepNum;
          if(_this.marginNum <= 0){
            _this.marginNum  = _this.allStepNum - _this.marginNum;
          }
        }
        if(_this.options.animateStyle == "left"){
          _this.scrollConObj.css("margin-left",-_this.marginNum);
        }else if(_this.options.animateStyle == "top"){
          _this.scrollConObj.css("margin-top",-_this.marginNum);
        }
      }

      var _reinit = function(changeOptions){
        clearTimeout(_this.autoPlayTimeId);
        _this.options = $.extend(_this.options, changeOptions);
        _this.marginNum = 0;
        _this.allStepNum = _this.options.animateStyle == "left" ? _this.scrollConObj.width()/2 : _this.scrollConObj.height()/2;
        if(_this.options.animateStyle == "left"){
          _this.scrollConObj.css("margin-left",-_this.marginNum);
        }else if(_this.options.animateStyle == "top"){
          _this.scrollConObj.css("margin-top",-_this.marginNum);
        }
        _startAutoPlay();
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

      _startAutoPlay();
      _this.bind("mouseout",function(){
        _startAutoPlay();
      })
      _this.bind("mouseover",function(){
        _stopAutoPlay();
      })

      if(_this.options.arrowBtn){
        _this.find("."+_this.options.leftArrowBtnClass).bind("click",function(){_prev();});
        _this.find("."+_this.options.rightArrowBtnClass).bind("click",function(){_next();});
      }

      return _this;

    }
  })    
})(jQuery);