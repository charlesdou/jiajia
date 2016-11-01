$(function($){
	$(".textareaCon .textarea").each(function(){
		$(this).bind("focus",function(){
			$(this).siblings(".sPlaceholder").css("display","none");
		})
		$(this).bind("blur",function(){
			if($(this).text() == ""){
				$(this).siblings(".sPlaceholder").css("display","block");
			}
		})
	})

})