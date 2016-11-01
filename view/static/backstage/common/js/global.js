$(function($) {
	var globalLeftNavIcon = $('#globalLeftNavIcon'),globalLeftNav = $('#globalLeftNav'),main = $('.main'),globalLeftNavLi;
  	globalLeftNav.delegate('.sNav','click',function(){
  		globalLeftNavLi = $(this).parent('li');
		if(globalLeftNavLi.hasClass('open')){
			globalLeftNavLi.removeClass('open');
		}else{
			globalLeftNavLi.addClass('open');
		}
		return false;
	})
  	globalLeftNavIcon.bind('click',function(){
	  	if(globalLeftNav.css('display')=='none'){
	  		globalLeftNav.css({'display':'block'});
	  		main.css({'width':'85%'});
	  	}else{
	  		globalLeftNav.css({'display':'none'});
	  		main.css({'width':'100%'});
	  	}
  	})
});