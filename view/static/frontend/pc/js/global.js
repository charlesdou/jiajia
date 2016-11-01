$(function(){
	var ie6=!-[1,]&&!window.XMLHttpRequest;

	$(".header .headerRight li").hover(
		function(){
			$(this).addClass("cur");
		},
		function(){
			$(this).removeClass("cur");
		}
	)

	if($(".newsList .globalArrowBtn").length > 0){
		$(".newsList .globalArrowBtn").on("click",function(){
			if($(this).parents(".jobTxt").hasClass("cur")){
				$(this).parents(".jobTxt").removeClass("cur");
			}else{
				$(this).parents(".jobTxt").addClass("cur");
			}
		})
	}
	
	if($(".global_form .txt").length > 0){
		$(".global_form .txt").bind("focus",function(){
			$(this).parent(".global_form").addClass("global_form_focus");
		})
		$(".global_form .txt").bind("blur",function(){
			$(this).parent(".global_form").removeClass("global_form_focus");
		})
	}

	if($(".tab-plugin").length > 0){
		$(".tab-plugin").each(function(){
			var pluginTabArr = $(this).find(".tab-plugin-tab"),pluginConArr = $(this).find(".tab-plugin-con");
			pluginTabArr.bind("click",function(){
				pluginConArr.css({"display":"none"});
				pluginTabArr.removeClass("cur");
				pluginConArr.eq(pluginTabArr.index($(this))).css({"display":"block"});
				$(this).addClass("cur");
			})
		})
	}

	if($(".global_input input[defaultTxt]").length > 0){
		$(".global_input input[defaultTxt]").each(function(){
			$(this).bind("focus",function(){
				if($(this).val() == $(this).attr("defaultTxt")){
					$(this).val("");
					$(this).css({"color":"#333"});
				}
			})
			$(this).bind("blur",function(){
				if($(this).val() == "" || $(this).val() == $(this).attr("defaultTxt")){
					$(this).css({"color":"#999"});
					$(this).val($(this).attr("defaultTxt"));
				}
			})
		})
	}

	if($(".global_area textarea[defaultTxt]").length > 0){
		$(".global_area textarea[defaultTxt]").each(function(){
			$(this).bind("focus",function(){
				if($(this).val() == $(this).attr("defaultTxt")){
					$(this).val("");
					$(this).css({"color":"#333"});
				}
			})
			$(this).bind("blur",function(){
				if($(this).val() == "" || $(this).val() == $(this).attr("defaultTxt")){
					$(this).css({"color":"#999"});
					$(this).val($(this).attr("defaultTxt"));
				}
			})
		})
	}



})