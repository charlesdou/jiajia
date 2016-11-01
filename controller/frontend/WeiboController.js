var util=require("util")
var async=require("async")
var _=require("underscore")
var _s=require("underscore.string")
var ObjectID=require("mongodb").ObjectID
$load("MyUtil.js")
var path=require("path")
var arrRoutes=[
    ["post","","$auth","$form",publishWeibo],
    ["delete",":weiboid","$auth",delWeibo],
    ["put","praise/:weiboid","$auth",praise],
    ["put","allegation/:weiboid","$auth",allegate],
    ["put","forward/:weiboid","$auth",forward],
    ["post","comment/:weiboid","$auth",addComment],
    ["delete","comment/:weiboid/:commentid","$auth",delComment],
    ["post","reply/:weiboid/:commentid","$auth",addReply],
    ["delete","reply/:weiboid/:commentid/:replyid","$auth",delReply],
    ["post","votepost/:weiboid","$auth","$body",votePost],
	["post","sync/:friendid","$isObjectBody","$body","$auth",syncSomeoneWeibos],
	["post","sync/details/:weiboid","$isObjectBody","$body","$auth",syncWeiboDetails],
	["post","sync/comments/:weiboid","$isObjectBody","$body","$auth",syncComments],
	["post","sync/replies/:weiboid/:commentid","$isObjectBody","$body","$auth",syncReplies],
	["post","sync","$isObjectBody","$body","$auth",syncWeibos]
]

function WeiboController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}
util.inherits(WeiboController,Controller)

function publishWeibo(req,res,next){
	var objBody=req.form
	if(!objBody || !_.isObject(objBody) || (objBody["type"]!=0 && !objBody["type"])){
		res.err(13007)
	}else{
		objBody["showloc"]=false
		if(_.isString(objBody["location"]) && objBody["location"]){
			objBody["showloc"]=true
		}
		if(objBody["type"]==0){
			$dao["weibo"]["publishWeibo"](req.cid,req.form,_.bind(res.reply,res))
		}else if(objBody["type"]==1){
			$dao["weibo"]["publishVotePost"](req.cid,req.form,_.bind(res.reply,res))
		}
	}
}

function delWeibo(req,res,next){
	$dao["weibo"]["delWeibo"](req,req.cid,req.params["weiboid"],_.bind(res.reply,res))
}

function praise(req,res,next){
	var objBody=req.body
	if(!objBody || !_.isObject(objBody) || objBody["toPraise"]==null || objBody["toPraise"]==undefined){
		res.err(13008)
	}else{
		if(objBody["toPraise"]){
			$dao["weibo"]["praise"](req.cid,req.params["weiboid"],_.bind(res.reply,res))
		}else{
			$dao["weibo"]["unpraise"](req.cid,req.params["weiboid"],_.bind(res.reply,res))
		}
	}
}

function allegate(req,res,next){
	var objBody=req.body
	if(!objBody || !_.isObject(objBody) || !objBody["reason"]){
		res.err(13009)
	}else{
		$dao["weibo"]["allegation"](req.cid,req.params["weiboid"],objBody["reason"],_.bind(res.reply,res))
	}
}

function forward(req,res,next){
	var objBody=req.body
	if(!objBody || !_.isObject(objBody) || !_.isNumber(objBody["platform"])){
		res.err(13010)
	}else{
		$dao["weibo"]["forward"](req.cid,req.params["weiboid"],objBody["platform"],_.bind(res.reply,res))
	}
}

function addComment(req,res,next){
	var objBody=req.body
	if(!objBody || !_.isObject(objBody) || !_.isString(objBody["comment"])){
		res.err(13011)
	}else{
		$dao["weibo"]["addComment"](req.cid,req.params["weiboid"],objBody["comment"],_.bind(res.reply,res))
	}
}

function delComment(req,res,next){
	$dao["weibo"]["delComment"](req.cid,req.params["weiboid"],req.params["commentid"],_.bind(res.reply,res))
}

function addReply(req,res,next){
	var objBody=req.body
	if(!objBody || !_.isObject(objBody) || !_.isString(objBody["content"])){
		res.err(13012)
	}else{
		if(!objBody["to"]){
			objBody["to"]=""
		}
		$dao["weibo"]["addReply"](req.cid,req.params["weiboid"],req.params["commentid"],objBody["content"],objBody["to"],_.bind(res.reply,res))
	}	
}

function delReply(req,res,next){
	$dao["weibo"]["delReply"](req.cid,req.params["weiboid"],req.params["commentid"],req.params["replyid"],_.bind(res.reply,res))
}

function votePost(req,res,next){
	var objBody=req.body
	if(!objBody || !_.isObject(objBody) || !_.isArray(objBody["options"]) || objBody["options"].length==0){
		res.err(13013)
	}else{
		$dao["weibo"]["votePost"](req.cid,req.params["weiboid"],objBody,_.bind(res.reply,res))
	}
}

/*
req.body:{
	dt_sync:<int>,
	maxcount:100,
	down:<bool>,
	alreadySynced:[]
}
*/
function syncWeibos(req,res,next){
	var dtSync=new Date()
	if(req.body.down===undefined || !_.isBoolean(req.body.down)){
		res.err(1052)
	}
	if(!_.isDate(req.body.dt_sync)){
		dtSync.setTime(0)
	}else{
		dtSync=req.body.dt_sync
	}
	var maxCount=parseInt(req.body.maxcount) || 100

	var arrAlreadySynced=req.body.alreadySynced || []
	$dao["weibo"]["sync"](req.cid,req.body.down,dtSync,maxCount,arrAlreadySynced,_.bind(res.reply,res))
}

/*
req.body:{
	dt_sync:<int>,
	maxcount:100,
	down:<bool>,
	alreadySynced:[]
}
*/
function syncSomeoneWeibos(req,res,next){
	var objBody=req.body
	
	if(!_.isBoolean(objBody["down"]) || (!objBody["down"] && !_.isDate(objBody["dt_sync"]))){
		res.err(1052)
	}else{
		var dt=new Date()
		dt.setTime(0)
		objBody["dt_sync"]=(_.isDate(objBody["dt_sync"]) && objBody["dt_sync"]) || dt
		objBody["alreadySynced"]=(_.isArray(objBody["alreadySynced"]) && objBody["alreadySynced"]) || []
		objBody["maxcount"]=(_.isNumber(objBody["maxcount"]) && objBody["maxcount"]) || 100
		if(objBody["alreadySynced"].length!=0){
			for(var i in objBody["alreadySynced"]){
				objBody["alreadySynced"][i]=new ObjectID(objBody["alreadySynced"][i])
			}
		}
		$dao["weibo"]["syncSomeoneWeibos"](req.cid,req.params["friendid"],objBody["down"],objBody["dt_sync"],objBody["maxcount"],objBody["alreadySynced"],_.bind(res.reply,res))
	}
}

/*
req.body:{
	dt_sync:<int>,
	maxcount:100,
	down:<bool>,
	alreadySynced:[]
}
*/
function syncWeiboDetails(req,res,next){
	var objBody=req.body

	if(!_.isBoolean(objBody["down"]) || (!objBody["down"] && !_.isDate(objBody["dt_sync"]))){
		res.err(1052)
	}else{
		var dt=new Date()
		dt.setTime(0)
		objBody["dt_sync"]=(_.isDate(objBody["dt_sync"]) && objBody["dt_sync"]) || dt
		objBody["alreadySynced"]=(_.isArray(objBody["alreadySynced"]) && objBody["alreadySynced"]) || []
		objBody["maxcount"]=(_.isNumber(objBody["maxcount"]) && objBody["maxcount"]) || 100
		if(objBody["alreadySynced"].length!=0){
			for(var i in objBody["alreadySynced"]){
				objBody["alreadySynced"][i]=new ObjectID(objBody["alreadySynced"][i])
			}
		}
		$dao["weibo"]["details"](req.cid,req.params["weiboid"],objBody["down"],objBody["dt_sync"],objBody["maxcount"],objBody["alreadySynced"],_.bind(res.reply,res))
	}
}

/*
req.body:{
	dt_sync:<int>,
	maxcount:100,
	down:<bool>,
	alreadySynced:[]
}
*/
function syncComments(req,res,next){
	var objBody=req.body
	
	if(!_.isBoolean(objBody["down"]) || (!objBody["down"] && !_.isDate(objBody["dt_sync"]))){
		res.err(1052)
	}else{
		var dt=new Date()
		dt.setTime(0)
		objBody["dt_sync"]=(_.isDate(objBody["dt_sync"]) && objBody["dt_sync"]) || dt
		objBody["alreadySynced"]=(_.isArray(objBody["alreadySynced"]) && objBody["alreadySynced"]) || []
		objBody["maxcount"]=(_.isNumber(objBody["maxcount"]) && objBody["maxcount"]) || 100
		if(objBody["alreadySynced"].length!=0){
			for(var i in objBody["alreadySynced"]){
				objBody["alreadySynced"][i]=new ObjectID(objBody["alreadySynced"][i])
			}
		}
		$dao["weibo"]["syncComment"](req.cid,req.params.weiboid,objBody["down"],objBody["dt_sync"],objBody["maxcount"],objBody["alreadySynced"],_.bind(res.reply,res))
	}
}

/*
req.body:{
	dt_sync:<int>,
	maxcount:100,
	down:<bool>,
	alreadySynced:[]
}
*/
function syncReplies(req,res,next){
	var objBody=req.body
	
	if(!_.isBoolean(objBody["down"]) || (!objBody["down"] && !_.isDate(objBody["dt_sync"]))){
		res.err(1052)
	}else{
		var dt=new Date()
		dt.setTime(0)
		objBody["dt_sync"]=(_.isDate(objBody["dt_sync"]) && objBody["dt_sync"]) || dt
		objBody["alreadySynced"]=(_.isArray(objBody["alreadySynced"]) && objBody["alreadySynced"]) || []
		objBody["maxcount"]=(_.isNumber(objBody["maxcount"]) && objBody["maxcount"]) || 100
		if(objBody["alreadySynced"].length!=0){
			for(var i in objBody["alreadySynced"]){
				objBody["alreadySynced"][i]=new ObjectID(objBody["alreadySynced"][i])
			}
		}
		$dao["weibo"]["syncReply"](req.cid,req.params.weiboid,req.params.commentid,objBody["down"],objBody["dt_sync"],objBody["maxcount"],objBody["alreadySynced"],_.bind(res.reply,res))
	}
}

module.exports=new WeiboController(arrRoutes,"weibo","weibo","")