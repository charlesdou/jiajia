$(function($){
	var aGetCode = $(".aGetCode"),hasGetCode = false,timeNum = 60,timeId;

	aGetCode.bind("touchend",function(){
		if(!hasGetCode){
			countdown();
		}
	})

	function countdown(){
		clearInterval(timeId);
		hasGetCode = true;
		timeId = setInterval(go,1000);
	}

	function go(){
		timeNum --;
		if(timeNum == 0){
			aGetCode.text("获取验证码");
			clearInterval(timeId);
			hasGetCode = false;
			timeNum = 60;
		}else{
			aGetCode.text(timeNum + "s");
		}
	}

	$(".aShowPassWord").bind("touchend",function(){

		if($(this).parent(".sInput").hasClass("cur")){
			$(this).parent(".sInput").removeClass("cur");
			$(this).siblings(".inputTxt").attr("type","password");
		}else{
			$(this).parent(".sInput").addClass("cur");
			$(this).siblings(".inputTxt").attr("type","text");
		}
	})

})



