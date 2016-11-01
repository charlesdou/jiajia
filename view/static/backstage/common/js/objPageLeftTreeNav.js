$(function($) {
	var leftTreeNavNum = 0,treeNavHtml ="",levelNum = 0,goNextTreeNav = true,htmlObjArr = [[$objPageLeftTreeNav,$('#globalLeftNav .leftNavList')]],nextHtmlObjArr = [],nextHtmlObjArrLength = 0,leftTreeNavEnd = false;

	var globalLeftNavIcon = $('#globalLeftNavIcon'),globalLeftNav = $('#globalLeftNav'),main = $('.main'),globalLeftNavLi;

	function setLeftTreeNav(){
		htmlObjArr = nextHtmlObjArr;
		nextHtmlObjArr = [];
		levelNum++;
		for(var i=0;i<nextHtmlObjArrLength;i++){
			if(i == nextHtmlObjArrLength -1){
				goNextTreeNav = true;
			}
			if(levelNum < 2){
				fillLeftNavHtml(htmlObjArr[i][0][htmlObjArr[i][2]].submenu,htmlObjArr[i][1].children("li").eq(htmlObjArr[i][2]));
			}else{
				fillLeftNavHtml(htmlObjArr[i][0][htmlObjArr[i][2]].submenu,htmlObjArr[i][1].children("ul").children("li").eq(htmlObjArr[i][2]));
			}
		}
	}
	
	function fillLeftNavHtml(dataObj,htmlObj){
		treeNavHtml = "";
		leftTreeNavNum = dataObj.length;
		for(var i=0;i<leftTreeNavNum;i++){
			if(dataObj[i].submenu == undefined){
				if(dataObj[i].icon == undefined){
					treeNavHtml += '<li><a href="'+dataObj[i].href+'" target="_self" class="aNav"><em>'+dataObj[i].title+'</em></a></li>';
				}else{
					treeNavHtml += '<li><a href="'+dataObj[i].href+'" target="_self" class="aNav"><i class="'+dataObj[i].icon+'"></i><em>'+dataObj[i].title+'</em></a></li>';
				}
			}else{
				nextHtmlObjArr.push([dataObj,htmlObj,i]);
				if(dataObj[i].icon == undefined){
					treeNavHtml += '<li><span class="sNav"><em>'+dataObj[i].title+'</em><i class="fa fa-angle-down"></i></span></li>';
				}else{
					treeNavHtml += '<li><span class="sNav"><i class="'+dataObj[i].icon+'"></i><em>'+dataObj[i].title+'</em><i class="fa fa-angle-down"></i></span></li>';
				}
			}
			if(i == leftTreeNavNum-1){
				leftTreeNavEnd = true;
			}else{
				leftTreeNavEnd = false;
			}
		}
		if(levelNum > 0){
			treeNavHtml = '<ul class="clearfix">' + treeNavHtml + '</ul>';
		}
		htmlObj.html(htmlObj.html() + treeNavHtml);
		if(goNextTreeNav&&leftTreeNavEnd&&nextHtmlObjArr[0] == null){
			leftNavSelected($strCurrentPath);
		}
		if(goNextTreeNav && nextHtmlObjArr[0] != null){
			nextHtmlObjArrLength = nextHtmlObjArr.length;
			goNextTreeNav = false;
			setLeftTreeNav();
		}
	}

	function leftNavSelected(href){
		var _this =  $(".aNav[href='" + href + "']");
		if(_this.length != 0){
			_this.parents("li").addClass("open");
		}
	}

	fillLeftNavHtml(htmlObjArr[0][0],htmlObjArr[0][1]);

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