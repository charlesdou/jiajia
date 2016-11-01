var _=require("underscore")
var async=require("async")
var util=require("util")
var ObjectID=require("mongodb").ObjectID
var Timestamp=require("mongodb").Timestamp
$load("FileManager.js")
$load("MyUtil.js")
var _s=require("underscore.string")
var objWeiboColl=$objMongoColls["maindb"]["weibo"]
var objContactsColl=$objMongoColls["im"]["contacts"]
var objGroupsColl=$objMongoColls["im"]["groups"]
var objPraiseColl=$objMongoColls["maindb"]["praise"]
var objAllegationColl=$objMongoColls["maindb"]["allegation"]
var objForwardColl=$objMongoColls["maindb"]["forward"]
var objCommentColl=$objMongoColls["maindb"]["comment"]
var objVotePostColl=$objMongoColls["maindb"]["vote_post"]
var objUserColl=$objMongoColls["maindb"]["user"]
var objWeiboOptionColl=$objMongoColls["maindb"]["weibo_option"]
var objReplyColl=$objMongoColls["maindb"]["reply"]

/*
 图文微博(weibo):
 {
 	_id:<ObjectID>,   //微博ID（主键）
 	subject:<string>,  //微博正文
 	img_multi_weibos:<string/url>, //微博图片（多张),
 	publish_user:<ObjectID>,   //发布者ID,
 	dt_publish:<Datetime>,     //发布时间
 	loc_publish:[<double>,<double>],          //发布位置，[x,y]，坐标
 	showloc:<bool>,          //是否显示发布微博时候的位置
 	to:[<string>,...]        //微博@的对象，可以包含多个groupid或者多个friendid
 	type:0               //微博类型 0 图文微博   1 投票贴
 	praises:<int>,           //获赞数量，
 	allegations:<int>          //被举报数量
 	forwards:<int>      //被转发数量,
 	comments:<int>     //被评论数量,
 	dt_sync:<Datetime>
 }
 */

$dao["weibo"]["publishWeibo"]=function(strUserID,objWeiboInfo,funcCb){
	objWeiboInfo["praises"]=0
	objWeiboInfo["allegations"]=0
	objWeiboInfo["forwards"]=0
	objWeiboInfo["dt_publish"]=new Date()
	objWeiboInfo["publish_user"]=new ObjectID(strUserID)
	objWeiboInfo["comments"]=0
	objWeiboInfo["dt_sync"]=objWeiboInfo["dt_publish"]
	objWeiboInfo["location"]=objWeiboInfo["location"] || ""
	objWeiboInfo["to"]=(_.isArray(objWeiboInfo) && objWeiboInfo["to"]) || []
	for(var i in objWeiboInfo["to"]){
		objWeiboInfo["to"][i]=new ObjectID(objWeiboInfo["to"][i])
	}

	objWeiboColl.insertOne(objWeiboInfo,function(err,insertResult){
		if(err){
			req.junkfiles=[objWeiboInfo["img_multi_weibos"]]
			funcCb(1000,null)
		}else{
			funcCb(0,{_id:insertResult["insertedId"]})
		}
	})
}

/*
 投票贴(weibo):
 {
 	_id:<ObjectID>      //投票贴ID（主键）
 	subject:<string>, //投票主题
 	img_multi_weibos:<string/url>,
 	publish_user:<string>,
 	dt_publish:<int>,
 	location:[<double,double>],
 	showloc:<bool>,
 	to:[<string>,...],
 	type:1,
 	maxchoose:<int>         //最多可以让用户选择多少个选项,简投就默认为1,
 	praises:<int>,           //获赞数量，
 	allegations:<int>，          //被举报数量
 	forwards:<int>,          //被转发数量
	comments:<int>           //被评论数量
	dt_sync:<Datetime>
 }

 投票贴选项(weibo_option)
 {
 	_id:<ObjectID>     //选项ID(主键),
 	_id_weibo:<ObjectID>      //微博ID
 	text:<string>     //正文
 	img_option:<string>     //图片url
 	count:<int>     //当前选择数量
 }

 index:
 {_id_weibo:1}
 */

$dao["weibo"]["publishVotePost"]=function(strUserID,objVotePost,funcCb){
	objVotePost["dt_publish"]=new Date()
	objVotePost["dt_sync"]=objVotePost["dt_publish"]
	objVotePost["maxchoose"]= objVotePost["maxchoose"] || 1
	if(objVotePost["maxchoose"]<1){
		objVotePost["maxchoose"]=1
	}
	objVotePost["praises"]=0
	objVotePost["allegations"]=0
	objVotePost["forwards"]=0
	objVotePost["comments"]=0

	var arrWeiboOptions=[]
	for(var strKey in objVotePost){
		var value=objVotePost[strKey]
		var regKey=/(.*)_options_(\d+)/
		var arrTmp=regKey.exec(strKey)
		if(arrTmp && arrTmp.length==3){
			var index=parseInt(arrTmp[2])
			if(!arrWeiboOptions[index]){
				arrWeiboOptions[index]={}
			}
			arrWeiboOptions[index][arrTmp[1]]=value
			delete objVotePost[strKey]
		}
	}
	objVotePost["publish_user"]=new ObjectID(strUserID)
	objVotePost["location"]=objVotePost["location"] || ""
	for(var i in objVotePost["to"]){
		objVotePost["to"][i]=new ObjectID(objVotePost["to"][i])
	}

	objWeiboColl.insertOne(objVotePost,function(err,insertResult){
		if(err){
			req.junkfiles=[]
			if(objVotePost["img_multi_weibos"].length!=0){
				req.junkfiles=req.junkfiles.concat(objVotePost["img_multi_weibos"])
			}
			for(var i in arrWeiboOptions){
				if(arrWeiboOptions[i]["img_option"]!=""){
					req.junkfiles.push(arrWeiboOptions[i]["img_option"])
				}
			}
			funcCb(1000,null)
		}else{
			var arrTmps=[]
			for(var i in arrWeiboOptions){
				arrWeiboOptions[i]["_id"]=new ObjectID()
				arrTmps.push(arrWeiboOptions[i]["_id"])
				arrWeiboOptions[i]["_id_weibo"]=insertResult["insertedId"]
				arrWeiboOptions[i]["count"]=0
			}
			objWeiboOptionColl.insertMany(arrWeiboOptions,function(err,cResult){
				if(err){
					for(var i in arrWeiboOptions){
						if(arrWeiboOptions[i]["img_option"]!="") {
							req.junkfiles.push(arrWeiboOptions[i]["img_option"])
						}
					}
					funcCb(1000,null)
				}else{
					funcCb(0,{_id:insertResult["insertedId"],options:arrTmps})
				}
			})
		}
	})
}

function _achieveAllJunkfiles(req,objWeiboID){
	req.junkfiles=[]
	return function(funcCb){
		objWeiboColl.findOne({_id:objWeiboID},{fields:{img_multi_weibos:1,type:1}},function(err,rResult){
			if(err){
				funcCb({errcode:1001},null)
			}else{
				req.junkfiles=rResult["img_multi_weibos"]
				if(rResult["type"]==1){
					objWeiboOptionColl.find({_id_weibo:objWeiboID},{fields:{_id:0,img_option:1}}).toArray(function(err,rResults){
						if(err){
							funcCb({errcode:1001},null)
						}else{
							for(var i in rResults){
								req.junkfiles.push(rResults[i]["img_option"])
							}
							funcCb(null,null)
						}
					})
				}else{
					funcCb(null,null)
				}
			}
		})
	}
}

function _delRepliesOfWeibo(objWeiboID){
	return function(funcCb){
		objCommentColl.find({_id_weibo:objWeiboID},{fields:{_id:1}}).toArray(function(err,rResults){
			if(err){
				funcCb({errcode:1001},null)
			}else{
				var arrIDs=[]
				for(var i in rResults){
					arrIDs.push(rResults[i]["_id"])
				}
				if(arrIDs.length!=0){
					objReplyColl.deleteMany({_id_comment:{$in:arrIDs}},function(err,dResult){
						if(err){
							funcCb({errcode:1003},null)
						}else{
						funcCb(null,null)
						}
					})
				}else{
					funcCb(null,null)
				}
			}
		})
	}
}
$dao["weibo"]["delWeibo"]=function(req,strUserID,strWeiboID,funcCb){
	var objWeiboID=new ObjectID(strWeiboID)
	async.series([
		_achieveAllJunkfiles(req,objWeiboID),
		_delRepliesOfWeibo(objWeiboID),
		function(cb){
			async.parallel([
				function(cb1){
					objPraiseColl.deleteMany({_id_weibo:objWeiboID},function(err,dResult){
						if(err){
							cb1({errcode:1003},null)
						}else{
							cb1(null,null)
						}
					})
				},
				function(cb1){
					objAllegationColl.deleteMany({_id_weibo:objWeiboID},function(err,dResult){
						if(err){
							cb1({errcode:1003},null)
						}else{
							cb1(null,null)
						}
					})
				},
				function(cb1){
					objForwardColl.deleteMany({_id_weibo:objWeiboID},function(err,dResult){
						if(err){
							cb1({errcode:1003},null)
						}else{
							cb1(null,null)
						}
					})
				},
				function(cb1){
					objCommentColl.deleteMany({_id_weibo:objWeiboID},function(err,dResult){
						if(err){
							cb1({errcode:1003},null)
						}else{
							cb1(null,null)
						}
					})
				},
				function(cb1){
					objWeiboOptionColl.deleteMany({_id_weibo:objWeiboID},function(err,dResult){
						if(err){
							cb1({errcode:1003},null)
						}else{
							cb1(null,null)
						}
					})
				}
			],function(err,parallelResults){
				if(err){
					cb({errcode:err["errcode"]},null)
				}else{
					objWeiboColl.deleteOne({_id:objWeiboID},function(err,dResult){
						if(err){
							cb({errcode:1003},null)
						}else{
							cb(null,null)
						}
					})
				}
			})
		}
	],function(err,seriesResults){
		funcCb(err,null)
	})
}



/*投票详情(vote_post)：
{
	_id:<ObjectID>,      //投票详情ID（主键）
	_id_weibo:<ObjectID>,         //投票贴ID
	owner:<ObjectID>,     //博主ID
	options:[<ObjectID>,...],        //投票选项ID
	user:<ObjectID>          //投票者ID,
	dt_vote:<int>               //投票时间
}

index:
{_id_weibo:1,user:1}
{dt_vote:1}
{_id_weibo:1,dt_vote:1}
*/
function _cleanLastVotePost(objVotePost){
	return function(funcCb){
		async.series([
			function(cb){
				objWeiboColl.findOne({_id:objVotePost["_id_weibo"]},{fields:{_id:0,publish_user:1,maxchoose:1}},function(err,rResult){
					if(err){
						cb({errcode:1001},null)
					}else if(!rResult){
						cb({errcode:13000},null)
					}else if(rResult["maxchoose"]<objVotePost["options"].length){
						cb({errcode:13017},null)
					}else{
						objVotePost["owner"]=rResult["publish_user"]
						cb(null,null)
					}
				})
			},
			function(cb){
				objVotePostColl.findOneAndDelete({_id_weibo:objVotePost["_id_weibo"],user:objVotePost["user"]},{projection:{_id:0,options:1}},function(err,dResult){
					if(err){
						cb({errcode:1003},null)
					}else{
						if(dResult && dResult.value){
							var arrOptions=dResult.value.options
							if(arrOptions && _.isArray(arrOptions) && arrOptions.length!=0){
								objWeiboOptionColl.updateMany({_id:{$in:arrOptions}},{$inc:{count:-1}},function(err,delResult){
									if(err){
										cb({errcode:1002},null)
									}else{
										cb(null,null)
									}
								})
							}else{
								cb(null,null)
							}
						}else{
							cb(null,null)
						}
					}
				})
			}
		],function(err,seriesResult){
			if(err){
				funcCb(err["errcode"],null)
			}else{
				funcCb(null,null)
			}
		})
	}
}

function _votePost(objVotePost){
	return function(funcCb){
		objVotePost["dt_vote"]=new Date()
		objVotePostColl.insertOne(objVotePost,function(err,cResult){
			if(err){
				funcCb({errcode:1000},null)
			}else{
				objWeiboOptionColl.updateMany({_id:{$in:objVotePost["options"]}},{$inc:{count:1}},function(err,uResult){
					if(err){
						funcCb({errcode:1002},null)
					}else{
						funcCb(null,null)
					}
				})
			}
		})
	}
}

$dao["weibo"]["votePost"]=function(strUserID,strWeiboID,objWeibo,funcCb){
	var objWeiboID=new ObjectID(strWeiboID)
	objWeibo["_id_weibo"]=objWeiboID
	objWeibo["user"]=new ObjectID(strUserID)
	for(var i in objWeibo["options"]){
		var objTmpID=objWeibo["options"][i]
		objWeibo["options"][i]=new ObjectID(objTmpID)
	}
	async.series([
		_cleanLastVotePost(objWeibo),
		_votePost(objWeibo),
		function(cb){
			objWeiboColl.updateOne({_id:objWeiboID},{$currentDate:{dt_sync:true}},function(err,uResult){
				if(err){
					cb({errcode:1003},null)
				}else{
					cb(null,null)
				}
			})
		},
		function(cb){
			objWeiboOptionColl.find({_id_weibo:objWeiboID},{fields:{count:1}}).toArray(function(err,rResults){
				if(err){
					cb({errcode:1001},null)
				}else{
					cb(null,rResults)
				}
			})
		}
	],function(err,objSeries){
		funcCb(err,objSeries[3])
	})
}

/*
点赞(praise)：
{
	_id:<ObjectID>,      //点赞ID    （主键）
	_id_weibo:<ObjectID>, //微博ID,
	owner:<ObjectID>,     //博主ID
	user:<ObjectID>,        //点赞者ID
	dt_praise:<Datetime>    
}

index:
{_id_weibo:1,user:1},
{dt_prase:1},
{user:1,dt_prase:-1}
*/
$dao["weibo"]["praise"]=function(strUserID,strWeiboID,funcCb){
	var objUserID=new ObjectID(strUserID)
	var objWeiboID=new ObjectID(strWeiboID)
	var objPraise={_id_weibo:objWeiboID,user:objUserID}
	async.waterfall([
		function(cb){
			objWeiboColl.findOne({_id:objWeiboID},{fields:{_id:0,publish_user:1}},function(err,queryResult){
				if(err){
					cb({errcode:1001},null)
				}else if(!queryResult){
					cb({errcode:13000},null)
				}else{
					objPraise["owner"]=queryResult["publish_user"]
					cb(null,objPraise)
				}
			})
		},
		function(praise,cb){
			objPraiseColl.count({_id_weibo:objWeiboID,user:objUserID},function(err,queryResult){
				if(err){
					cb({errcode:1001},null)
				}else if(queryResult>=1){
					cb({errcode:13001},null)
				}else{
					cb(null,praise)
				}
			})
		},
		function(praise,cb){
			praise["dt_praise"]=new Date()
			objPraiseColl.insertOne(praise,function(err,insertResult){
				if(err){
					cb({errcode:1000},null)
				}else{
					praise["_id"]=insertResult["insertedId"]
					cb(null,praise)
				}
			})
		},
		function(praise,cb){
			objWeiboColl.findOneAndUpdate({_id:objWeiboID},{$inc:{praises:1},$currentDate:{dt_sync:true}},{projection:{praises:1},returnOriginal:false},function(err,updateResult){
				if(err){
					cb({errcode:1002},null)
				}else{
					cb(null,updateResult.value)
				}
			})
		}
	],function(err,waterfallResult){
		funcCb(err,waterfallResult)
	})
}

$dao["weibo"]["unpraise"]=function(strUserID,strWeiboID,funcCb){
	var objUserID=new ObjectID(strUserID)
	var objWeiboID=new ObjectID(strWeiboID)
	async.series([
		function(cb){
			objPraiseColl.count({_id_weibo:objWeiboID,user:objUserID},function(err,count){
				if(err){
					cb({errcode:1001},null)
				}else if(count<1){
					cb({errcode:13002},null)
				}else{
					cb(null,null)
				}
			})
		},
		function(cb){
			objWeiboColl.count({_id:objWeiboID},function(err,count){
				if(err){
					cb({errcode:1001},null)
				}else if(count<1){
					cb({errcode:13000},null)
				}else{
					cb(null,null)
				}
			})
		},
		function(cb){
			objPraiseColl.deleteOne({_id_weibo:objWeiboID,user:objUserID},function(err,delResult){
				if(err){
					cb({errcode:1003},null)
				}else{
					cb(null,null)
				}
			})
		},
		function(cb){
			objWeiboColl.findOneAndUpdate({_id:objWeiboID},{$inc:{praises:-1},$currentDate:{dt_sync:true}},{projection:{praises:1},returnOriginal:false},function(err,updateResult){
				if(err){
					cb({errcode:1002},null)
				}else{
					cb(null,updateResult.value)
				}
			})
		}
	],function(err,waterfallResult){
		funcCb(err,waterfallResult[3])
	})
}


/*举报(allegation)：
{
	_id:<ObjectID>,    //举报ID    （主键）
	_id_weibo:<ObjectID>，     //被举报的微博ID，
	owner:<ObjectID>,     //博主ID
	user:<ObjectID>,     //举报者ID
	dt_allegation:<Datetime>, //举报时间
	reason:<string>     //举报理由
}

index:
{_id_weibo:1,user:1},
{dt_allegation:1},
{user:1,dt_allegation:-1}
*/

$dao["weibo"]["allegation"]=function(strUserID,strWeiboID,strReason,funcCb){
	var objWeiboID=new ObjectID(strWeiboID)
	var objUserID=new ObjectID(strUserID)
	var objWeiboAllegation={_id_weibo:objWeiboID,user:objUserID,reason:strReason}

	async.series([
		function(cb){
			objWeiboColl.findOne({_id:objWeiboID},{fields:{_id:0,publish_user:1}},function(err,queryResult){
				if(err){
					cb({errcode:1001},null)
				}else if(!queryResult){
					cb({errcode:13000},null)
				}else{
					objWeiboAllegation["owner"]=queryResult["publish_user"]
					cb(null,null)
				}
			})
		},
		function(cb){
			objAllegationColl.count({_id_weibo:objWeiboID,user:objUserID},function(err,count){
				if(err){
					cb({errcode:1001},null)
				}else if(count>=1){
					cb({errcode:13003},null)
				}else{
					cb(null,null)
				}
			})
		},
		function(cb){
			objWeiboAllegation["dt_allegation"]=new Date()
			objAllegationColl.insertOne(objWeiboAllegation,function(err,cResult){
				if(err){
					cb({errcode:1001},null)
				}else{
					cb(null,null)
				}
			})
		},
		function(cb){
			objWeiboColl.findOneAndUpdate({_id:objWeiboID},{$inc:{allegations:1},$currentDate:{dt_sync:true}},{projection:{allegations:1},returnOriginal:false},function(err,uResult){
				if(err){
					cb({errcode:1002},null)
				}else{
					cb(null,uResult.value)
				}
			})
		}
	],function(err,seriesResult){
		funcCb(err,seriesResult[3])
	})
}

/*转发(forward)：
{
	_id:<ObjectID>,    //举报ID    （主键）
	_id_weibo:<ObjectID>，     //被举报的微博ID，
	owner:<ObjectID>,     //博主ID
	user:<ObjectID>,     //举报者ID
	dt_forward:<Datetime>, //举报时间
	platform:<int>     //0 微信好友 1 微信朋友圈 2 QQ好友 3 QQ空间 4 新浪微博
}

index:
{_id_weibo:1},
{_id_weibo:1,dt_forward:1}
{_id_weibo:1,user:1},
{_id_weibo:1,user:1,platform:1}
{dt_forward:1},
{user:1,dt_forward:-1}
*/

$dao["weibo"]["forward"]=function(strUserID,strWeiboID,intPlatform,funcCb){
	var objWeiboID=new ObjectID(strWeiboID)
	var objUserID=new ObjectID(strUserID)
	var objForward={_id_weibo:objWeiboID,user:objUserID,platform:intPlatform}
	async.series([
		function(cb){
			objWeiboColl.findOne({_id:objWeiboID},{fields:{_id:0,publish_user:1}},function(err,rResult){
				if(err){
					cb({errcode:1001},null)
				}else if(!rResult){
					cb({errcode:13000},null)
				}else{
					objForward["owner"]=rResult["publish_user"]
					cb(null,null)
				}
			})
		},
		function(cb){
			objForward["dt_forward"]=new Date()
			objForwardColl.insertOne(objForward,function(err,cResult){
				if(err){
					cb({errcode:1000},null)
				}else{
					cb(null,null)
				}
			})
		},
		function(cb){
			objWeiboColl.findOneAndUpdate({_id:objWeiboID},{$inc:{forwards:1},$currentDate:{dt_sync:true}},{projection:{forwards:1},returnOriginal:false},function(err,uResult){
				if(err){
					cb({errcode:1002},null)
				}else{
					cb(null,uResult.value)
				}
			})
		}
	],function(err,seriesResult){
		funcCb(err,seriesResult[2])
	})
}

/*
评论(comment)：
{
	_id:<ObjectID>,    //评论ID    （主键）
	_id_weibo:<ObjectID>,     //被评论微博ID
	owner:<ObjectID>,     //博主ID
	user:<ObjectID>,     //评论者ID
	dt_comment:<Datetime>,     //评论时间   
	comment:<string>     //评论内容
	newest_replies:[
		{
			_id_reply:<objectID>,
			user:<ObjectID>,
			content:<string>,
			to:<ObjectID>,
			dt_reply:<Datetime>
		},
		...
	],
	reply_count:<int>     //该评论的当前品论总数  
}

index:
{_id_weibo:1,user:1},
{dt_comment:-1},
{_id_weibo:1,dt_comment:-1}
*/

$dao["weibo"]["addComment"]=function(strUserID,strWeiboID,strComment,funcCb){
	var objWeiboID=new ObjectID(strWeiboID)
	var objUserID=new ObjectID(strUserID)
	var objComment={_id_weibo:objWeiboID,user:objUserID,comment:strComment,newest_replies:[],reply_count:0}
	async.series([
		function(cb){
			objWeiboColl.findOne({_id:objWeiboID},{fields:{_id:0,publish_user:1}},function(err,rResult){
				if(err){
					cb({errcode:1001},null)
				}else if(!rResult){
					cb({errcode:13000},null)
				}else{
					objComment["owner"]=rResult["publish_user"]
					cb(null,null)
				}
			})
		},
		function(cb){
			objComment["dt_comment"]=new Date()
			objCommentColl.insertOne(objComment,function(err,cResult){
				if(err){
					cb({errcode:1000},null)
				}else{
					cb(null,cResult["insertedId"])
				}
			})
		},
		function(cb){
			objWeiboColl.findOneAndUpdate({_id:objWeiboID},{$inc:{comments:1},$currentDate:{dt_sync:true}},{projection:{comments:1},returnOriginal:false},function(err,uResult){
				if(err){
					cb({errcode:1002},null)
				}else{
					cb(null,uResult.value)
				}
			})
		}
	],function(err,seriesResult){
		funcCb(err,{_id:seriesResult[1],weibo:seriesResult[2]})
	})
}

$dao["weibo"]["delComment"]=function(strUserID,strWeiboID,strCommentID,funcCb){
	var objUserID=new ObjectID(strUserID)
	var objCommentID=new ObjectID(strCommentID)
	var objWeiboID=new ObjectID(strWeiboID)
	async.series([
		function(cb){
			objWeiboColl.count({_id:objWeiboID},function(err,count){
				if(err){
					cb({errcode:1001},null)
				}else if(count<1){
					cb({errcode:13000},null)
				}else{
					cb(null,null)
				}
			})
		},
		function(cb){
			objCommentColl.findOne({_id:objCommentID},{_id_weibo:1,user:1},function(err,rResult){
				if(err){
					cb({errcode:1001},null)
				}else if(!rResult){
					cb({errcode:13006},null)
				}else{
					if(rResult["user"].toHexString()!=strUserID){
						cb({errcode:13004},null)
					}else if(strWeiboID!=rResult["_id_weibo"].toHexString()){
						cb({errcode:13005},null)
					}else{
						cb(null,null)
					}
				}
			})
		},
		function(cb){
			objReplyColl.deleteMany({_id_comment:objCommentID},function (err,dResult) {
				if(err){
					cb({errcode:1003},null)
				}else{
					cb(null,null)
				}
			})
		},
		function(cb){
			objCommentColl.deleteOne({_id:objCommentID},function(err,dResult){
				if(err){
					cb({errcode:1003},null)
				}else{
					cb(null,null)
				}
			})
		},
		function(cb){
			objWeiboColl.findOneAndUpdate({_id:objWeiboID},{$inc:{comments:-1},$currentDate:{dt_sync:true}},{projection:{comments:1},returnOriginal:false},function(err,rResult){
				if(err){
					cb({errcode:1002},null)
				}else{
					cb(null,rResult.value)
				}
			})
		}
	],function(err,seriesResult){
		funcCb(err,seriesResult[4])
	})
}


/*
回复(reply)
{
	_id:<ObjectID>,     回复ID（主键）
	_id_comment:<ObjectID>,      评论ID
	owner:<ObjectID>,     评论者ID
	user:<ObjectID>,     回复者ID
	content:<string>   回复内容
	to:<ObjectID>        @对象
	dt_reply:<Datetime>      回复时间     
}

index:
{_id_comment:1,user:1}
{dt_reply:1}
{_id_comment:1,user:1,dt_reply:1}
*/

$dao["weibo"]["addReply"]=function(strUserID,strWeiboID,strCommentID,strReply,strToWho,funcCb){
	var objUserID=new ObjectID(strUserID)
	var objWeiboID=new ObjectID(strWeiboID)
	var objCommentID=new ObjectID(strCommentID)
	var objReply={_id_comment:objCommentID,user:objUserID,content:strReply}
	async.series([
		function(cb){
			objWeiboColl.count({_id:objWeiboID},function(err,intCount){
				if(err){
					cb({errcode:1001},null)
				}else if(intCount<1){
					cb({errcode:13000},null)
				}else{
					cb(null,null)
				}
			})
		},
		function(cb){
			objCommentColl.findOne({_id:objCommentID},{_id:0,user:1,newest_replies:1},function(err,rResult){
				if(err){
					cb({errcode:1001},null)
				}else if(!rResult){
					cb({errcode:13006},null)
				}else{
					objReply["owner"]=rResult["user"]
					if(strToWho && _.isString(strToWho)){
						objReply["to"]=new ObjectID(strToWho)
					}else {
						objReply["to"] = rResult["user"]
					}
					cb(null,rResult["newest_replies"])
				}
			})
		},
		function(cb){
			objReply["dt_reply"]=new Date()
			objReplyColl.insertOne(objReply,function(err,cResult){
				if(err){
					cb({errcode:1000},null)
				}else{
					cb(null,cResult["insertedId"])
				}
			})
		}
	],function (err,seriesResults) {
		var arrNewestReply=seriesResults[1]
		var insertedID=seriesResults[2]
		var objTmp={_id_reply:insertedID,user:objUserID,content:strReply,to:objReply["to"],dt_reply:objReply["dt_reply"]}
		arrNewestReply.unshift(objTmp)
		if(arrNewestReply.length>2){
			arrNewestReply.pop()
		}
		objCommentColl.updateOne({_id:objCommentID},{$set:{newest_replies:arrNewestReply},$inc:{reply_count:1}},function(err,uResult){
			if(err){
				funcCb({errcode:1002},null)
			}else{
				funcCb(null,{_id:insertedID})
			}
		})
	})
}

$dao["weibo"]["delReply"]=function(strUserID,strWeiboID,strCommentID,strReplyID,funcCb){
	var objUserID=new ObjectID(strUserID)
	var objWeiboID=new ObjectID(strWeiboID)
	var objCommentID=new ObjectID(strCommentID)
	var objReplyID=new ObjectID(strReplyID)
	var arrNewestReplies=[]
	async.series([
		function(cb){
			objWeiboColl.count({_id:objWeiboID},function(err,intCount){
				if(err){
					cb({errcode:1001},null)
				}else if(intCount<1){
					cb({errcode:13000},null)
				}else{
					cb(null,null)
				}
			})
		},
		function(cb){
			objCommentColl.count({_id:objCommentID},function(err,intCount){
				if(err){
					cb({errcode:1001},null)
				}else if(intCount<1){
					cb({errcode:13006},null)
				}else{
					cb(null,null)
				}
			})
		},
		function(cb){
			objReplyColl.deleteOne({_id:objReplyID},function(err,dResult){
				if(err){
					cb({errcode:1003},null)
				}else{
					cb(null,null)
				}
			})
		},
		function(cb){
			objReplyColl.find({_id_comment:objCommentID}).project({_id_comment:0,owner:0}).sort({dt_reply:-1}).limit(2).toArray(function(err,rResults){
				if(err){
					cb({errcode:1001},null)
				}else{
					arrNewestReplies=rResults || []
					cb(null,null)
				}
			})
		},
		function(cb){
			var arrFinals=[]
			for(var i in arrNewestReplies){
				var tmp=arrNewestReplies[i]
				var obj={_id_reply:tmp["_id"],user:tmp["user"],content:tmp["content"],to:tmp["to"],dt_reply:tmp["dt_reply"]}
				arrFinals.push(obj)
			}
			objCommentColl.updateOne({_id:objCommentID},{$set:{newest_replies:arrFinals},$inc:{reply_count:-1}},function(err,uResult){
				if(err){
					cb({errcode:1002},null)
				}else{
					cb(null,null)
				}
			})
		}
	],function(err,seriesResults){
		funcCb(err,null)
	})
}

function _queryPraiseAndAllegations(objUserID,arrWeiIDs,funcCb){
	async.parallel([
		function(cb){
			objPraiseColl.find({_id_weibo:{$in:arrWeiIDs},user:objUserID}).project({_id:0,_id_weibo:1}).toArray(function(err,rResults){
				if(err){
					cb({errcode:1001},null)
				}else{
					var objMapPraise={}
					for(var i in rResults){
						objMapPraise[rResults[i]["_id_weibo"].toHexString()]=1
					}
					cb(null,objMapPraise)
				}
			})
		},
		function(cb){
			objAllegationColl.find({_id_weibo:{$in:arrWeiIDs},user:objUserID}).project({_id:0,_id_weibo:1}).toArray(function(err,rResults){
				if(err){
					cb({errcode:1001},null)
				}else{
					var objMapAllegations={}
					for(var i in rResults){
						objMapAllegations[rResults[i]["_id_weibo"].toHexString()]=1
					}
					cb(null,objMapAllegations)
				}
			})
		}
	],function(err,parallelResults){
		if(err){
			funcCb(err["errcode"],null)
		}else{
			funcCb(0,{praises:parallelResults[0],allegations:parallelResults[1]})
		}
	})
}

$dao["weibo"]["sync"]=function(strUserID,isDown,dtTs,maxCount,alreadySynced,funcCb){
	var objUserID=new ObjectID(strUserID)
	for(var i in alreadySynced){
		var tmp=new ObjectID(alreadySynced[i])
		alreadySynced[i]=tmp
	}
	async.waterfall([
		function(cb){
			var objSyncOptions={
				coll:"weibo",
				down:isDown,
				tsName:"dt_publish",
				dt:dtTs,
				syncCount:maxCount,
				alreadySynced:alreadySynced
			}
			$dao["cmn"]["upOrDownGestureSync"](objSyncOptions,function(err,rResults){
				if(err!=0){
					cb({errcode:err},null)
				}else{
					cb(null,rResults)
				}
			})
		},
		function(weibos,cb){
			var arrVotePostsID=[]
			for(var i in weibos){
				var tmp=weibos[i]
				if(tmp["type"]==1){
					arrVotePostsID.push(tmp["_id"])
				}
			}
			var objUserMap={}
			objUserMap[strUserID]=1
			for(var j in weibos){
				var tmp=weibos[j]["publish_user"].toHexString()
				objUserMap[tmp]=1
			}
			var arrUserIDs=_.keys(objUserMap)
			var arrAllWeiboIDs=_.map(weibos,function(value){
				return value["_id"]
			})
			async.parallel([
				function(cb1){
					objWeiboOptionColl.find({_id_weibo:{$in:arrVotePostsID}}).toArray(function(err,rResults){
						if(err){
							cb1({errcode:1001},null)
						}else{
							cb1(null,rResults)
						}
					})
				},
				function(cb1){
					var arrUserObjIDs=[]
					for(var i in arrUserIDs){
						arrUserObjIDs.push(new ObjectID(arrUserIDs[i]))
					}
					objUserColl.find({_id:{$in:arrUserObjIDs}}).project({nickname:1,img_headportrait:1}).toArray(function(err,rResults){
						if(err){
							cb1({errcode:1001},null)
						}else{
							cb1(null,rResults)
						}
					})
				},
				function(cb1){
					_queryPraiseAndAllegations(objUserID,arrAllWeiboIDs,function(err,objResult){
						if(err){
							cb1({errcode:err},null)
						}else{
							cb1(null,objResult)
						}
					})
				}
			],function(err,parallelResults){
				if(err){
					cb({errcode:1001},null)
				}else{
					var votePostOptions=parallelResults[0]
					var userInfo=parallelResults[1]

					var objMapUserID_UserInfo=_.indexBy(userInfo,function(objUser){
						return objUser["_id"].toHexString()
					})
					var objMapVotePostID_Options=_.groupBy(votePostOptions,function(objOption){
						return objOption["_id_weibo"].toHexString()
					})
					for(var i in weibos){
						var tmp=weibos[i]
						var userid=tmp["publish_user"].toHexString()
						var strWeiboID=tmp["_id"].toHexString()
						tmp["nickname"]=objMapUserID_UserInfo[userid]["nickname"]
						tmp["img_headportrait"]=objMapUserID_UserInfo[userid]["img_headportrait"]
						if(tmp["type"]==1){
							tmp["options"]=objMapVotePostID_Options[strWeiboID]
							for(var k in tmp["options"]){
								var tmp2=tmp["options"][k]
								delete tmp2["_id_weibo"]
							}
						}
					}
					var objPraiseAndAllegationsMap=parallelResults[2]
					for(var i in weibos){
						var tmp=weibos[i]
						var strID=weibos[i]["_id"].toHexString()
						if(objPraiseAndAllegationsMap["praises"][strID]){
							tmp["isPraisedByMe"]=true
						}else{
							tmp["isPraisedByMe"]=false
						}
						if(objPraiseAndAllegationsMap["allegations"][strID]){
							tmp["isAllegatedByMe"]=true
						}else{
							tmp["isAllegatedByMe"]=false
						}
					}
					cb(null,weibos)
				}
			})
		}
	],funcCb)
}

$dao["weibo"]["details"]=function(strUserID,strWeiboID,isDown,dt_sync,maxCount,alreadySynced,funcCb){
	var objUserID=new ObjectID(strUserID)
	var objWeiboID=new ObjectID(strWeiboID)
	async.waterfall([
		function(cb){
			objWeiboColl.findOne({_id:objWeiboID},function(err,objWeibo){
				if(err){
					cb({errcode:1001},null)
				}else if(!objWeibo){
					cb({errcode:13000},null)
				}else{
					if(objWeibo["type"]==1){
						objWeiboOptionColl.find({_id_weibo:objWeibo["_id"]}).project({_id_weibo:0}).toArray(function(err,rResults){
							if(err){
								cb({errcode:1001},null)
							}else{
								objWeibo["options"]=rResults
								cb(null,objWeibo)
							}
						})
					}else{
						cb(null,objWeibo)
					}
				}
			})
		},
		function(objWeibo,cb){
			var objSyncOption={
				down:isDown,
				coll:"comment",
				tsName:"dt_comment",
				dt:dt_sync,
				alreadySynced:alreadySynced,
				extraFilter:{_id_weibo:objWeiboID},
				projection:{_id_weibo:0,owner:0},
				syncCount:maxCount
			}
			$dao["cmn"]["upOrDownGestureSync"](objSyncOption,function(err,rResults){
				if(err){
					cb({errcode:1001},null)
				}else{
					objWeibo["comments"]=rResults
					cb(null,objWeibo)
				}
			})
		},
		function(objWeibo,cb){
			var arrUserIDs=[]
			var arrComments=objWeibo["comments"]
			var objMapUserID={}
			objMapUserID[strUserID]=1
			for(var i in arrComments) {
				var tmp = arrComments[i]
				objMapUserID[tmp["user"].toHexString()] = 1
				if (tmp["newest_replies"] && tmp["newest_replies"][0]) {
					objMapUserID[tmp["newest_replies"][0]["user"].toHexString()] = 1
					objMapUserID[tmp["newest_replies"][0]["to"].toHexString()] = 1
				}
				if (tmp["newest_replies"] && tmp["newest_replies"][1]) {
					objMapUserID[tmp["newest_replies"][1]["user"].toHexString()] = 1
					objMapUserID[tmp["newest_replies"][1]["to"].toHexString()] = 1
				}
			}
			arrUserIDs=_.keys(objMapUserID)
			var arrObjUserIDs=[]
			for(var i in arrUserIDs){
				arrObjUserIDs.push(new ObjectID(arrUserIDs[i]))
			}
			objUserColl.find({_id:{$in:arrObjUserIDs}}).project({nickname:1,img_headportrait:1}).toArray(function(err,rResults){
				if(err){
					cb({errcode:1001},null)
				}else{
					var objMapUserID_UserInfo=_.indexBy(rResults,function(obj){
						return obj["_id"].toHexString()
					})
					for(var j in arrComments){
						var tmp=arrComments[j]
						tmp["nickname"]=objMapUserID_UserInfo[tmp["user"].toHexString()]["nickname"]
						tmp["img_headportrait"]=objMapUserID_UserInfo[tmp["user"].toHexString()]["img_headportrait"]
						if(tmp["newest_replies"] && tmp["newest_replies"][0]){
							var strUser1=tmp["newest_replies"][0]["user"].toHexString()
							var strTo1=tmp["newest_replies"][0]["to"].toHexString()
							tmp["newest_replies"][0]["user_nickname"]=objMapUserID_UserInfo[strUser1]["nickname"]
							tmp["newest_replies"][0]["user_img_headportrait"]=objMapUserID_UserInfo[strUser1]["img_headportrait"]
							tmp["newest_replies"][0]["to_nickname"]=objMapUserID_UserInfo[strTo1]["nickname"]
							tmp["newest_replies"][0]["to_img_headportrait"]=objMapUserID_UserInfo[strTo1]["img_headportrait"]
						}
						if(tmp["newest_replies"] && tmp["newest_replies"][1]){
							var strUser2=tmp["newest_replies"][1]["user"].toHexString()
							var strTo2=tmp["newest_replies"][1]["to"].toHexString()
							tmp["newest_replies"][1]["user_nickname"]=objMapUserID_UserInfo[strUser2]["nickname"]
							tmp["newest_replies"][1]["user_img_headportrait"]=objMapUserID_UserInfo[strUser2]["img_headportrait"]
							tmp["newest_replies"][1]["to_nickname"]=objMapUserID_UserInfo[strTo2]["nickname"]
							tmp["newest_replies"][1]["to_img_headportrait"]=objMapUserID_UserInfo[strTo2]["img_headportrait"]
						}
					}
					objWeibo["nickname"]=objMapUserID_UserInfo[strUserID]["nickname"]
					objWeibo["img_headportrait"]=objMapUserID_UserInfo[strUserID]["img_headportrait"]
					cb(null,objWeibo)
				}
			})
		}
    ],funcCb)
}

$dao["weibo"]["syncComment"]=function(strUserID,strWeiboID,isDown,dt_sync,maxCount,alreadySynced,funcCb){
	var objWeiboID=new ObjectID(strWeiboID)
	var objSyncOption={
		down:isDown,
		coll:"comment",
		tsName:"dt_comment",
		dt:dt_sync,
		alreadySynced:alreadySynced,
		extraFilter:{_id_weibo:objWeiboID},
		projection:{_id_weibo:0,owner:0},
		syncCount:maxCount
	}

	async.waterfall([
		function(cb){
			objWeiboColl.findOne({_id:objWeiboID},{_id:0,publish_user:1},function(err,objWeibo) {
				if (err) {
					cb({errcode: 1001}, null)
				} else if (!objWeibo) {
					cb({errcode: 13000}, null)
				} else {
					cb(null, objWeibo["publish_user"])
				}
			})
		},
		function(lastResult,cb){
			$dao["cmn"]["upOrDownGestureSync"](objSyncOption,function(err,rResults){
				if(err){
					cb({errcode:1001},null)
				}else{
					cb(null,rResults)
				}
			})
		},
		function(arrComments,cb){
			var arrUserIDs=[]
			var objMapUserID={}
			objMapUserID[strUserID]=1
			for(var i in arrComments){
				var tmp=arrComments[i]
				if(tmp["newest_replies"] && tmp["newest_replies"][0]){
					objMapUserID[tmp["newest_replies"][0]["user"].toHexString()]=1
					objMapUserID[tmp["newest_replies"][0]["to"].toHexString()]=1
				}
				if(tmp["newest_replies"] && tmp["newest_replies"][1]){
					objMapUserID[tmp["newest_replies"][1]["user"].toHexString()]=1
					objMapUserID[tmp["newest_replies"][1]["to"].toHexString()]=1
				}
				objMapUserID[tmp["user"].toHexString()]=1
			}
			arrUserIDs=_.keys(objMapUserID)
			var arrObjUserIDs=[]
			for(var i in arrUserIDs){
				arrObjUserIDs.push(new ObjectID(arrUserIDs[i]))
			}
			objUserColl.find({_id:{$in:arrObjUserIDs}}).project({nickname:1,img_headportrait:1}).toArray(function(err,rResults){
				if(err){
					cb({errcode:1001},null)
				}else{
					var objMapUserID_UserInfo=_.indexBy(rResults,function(obj){
						return obj["_id"].toHexString()
					})
					console.log(objMapUserID_UserInfo)
					for(var j in arrComments){
						var tmp=arrComments[j]
						tmp["nickname"]=objMapUserID_UserInfo[tmp["user"].toHexString()]["nickname"]
						tmp["img_headportrait"]=objMapUserID_UserInfo[tmp["user"].toHexString()]["img_headportrait"]
						for(var k in tmp["newest_replies"]){
							var tmp2=tmp["newest_replies"][k]
							var strUser=tmp2["user"].toHexString()
							var strTo=tmp2["to"].toHexString()
							tmp2["user_nickname"]=objMapUserID_UserInfo[strUser]["nickname"]
							tmp2["user_img_headportrait"]=objMapUserID_UserInfo[strUser]["img_headportrait"]
							console.log(strTo)
							tmp2["to_nickname"]=objMapUserID_UserInfo[strTo]["nickname"]
							tmp2["to_img_headportrait"]=objMapUserID_UserInfo[strTo]["img_headportrait"]
						}
					}
					cb(null,arrComments)
				}
			})
		}
    ],funcCb)
}

$dao["weibo"]["syncSomeoneWeibos"]=function(strUserID,strFriendID,isDown,dt_sync,maxCount,alreadySynced,funcCb){
	var objFriendID=new ObjectID(strFriendID)
	var objUserID=new ObjectID(strUserID)
	var objSyncOption={
		down:isDown,
		coll:"weibo",
		tsName:"dt_publish",
		dt:dt_sync,
		alreadySynced:alreadySynced,
		extraFilter:{publish_user:objFriendID},
		syncCount:maxCount
	}

	async.waterfall([
		function(cb){
			$dao["cmn"]["upOrDownGestureSync"](objSyncOption,function(err,rResults){
				if(err){
					cb({errcode:1001},null)
				}else{
					cb(null,rResults)
				}
			})
		},
		function(arrWeibos,cb){
			var arrVotePostsIDs=[]
			for(var i in arrWeibos){
				var tmp=arrWeibos[i]
				if(tmp["type"]==1){
					arrVotePostsIDs.push(tmp["_id"])
				}
			}
			objWeiboOptionColl.find({_id_weibo:{$in:arrVotePostsIDs}}).toArray(function(err,rResults){
				if(err){
					cb({errcode:1001},null)
				}else{
					var mapObjID_VotePost=_.groupBy(rResults,function(obj){
						return obj["_id_weibo"].toHexString()
					})
					for(var j in arrWeibos){
						var tmp1=arrWeibos[j]
						tmp1["options"]=mapObjID_VotePost[tmp1["_id"].toHexString()]
						for(var k in tmp1["options"]){
							var tmp2=tmp1["options"][k]
							delete tmp2["_id_weibo"]
						}
					}
					cb(null,arrWeibos)
				}
			})
		},
		function(arrWeibos,cb){
			objUserColl.findOne({_id:new ObjectID(strFriendID)},{fields:{_id:0,nickname:1,img_headportrait:1}},function(err,objUser){
				if(err){
					cb({errcode:1001},null)
				}else if(!objUser){
					cb({errcode:1051},null)
				}else{
					var objResult={
						nickname:objUser["nickname"],
						img_headportrait:objUser["img_headportrait"],
						weibos:arrWeibos
					}
					cb(null,objResult)
				}
			})
		},
		function(objLastResult,cb){
			var arrAllWeiboIDs=_.map(objLastResult["weibos"],function(value){
				return value["_id"]
			})
			_queryPraiseAndAllegations(objUserID,arrAllWeiboIDs,function(err,objMap){
				if(err){
					cb({errcode:err},null)
				}else{
					for(var i in objLastResult["weibos"]){
						var tmp=objLastResult["weibos"][i]
						var strID=tmp["_id"].toHexString()
						if(objMap["praises"][strID]){
							tmp["isPraisedByMe"]=true
						}else{
							tmp["isPraisedByMe"]=false
						}
						if(objMap["allegations"][strID]){
							tmp["isAllegatedByMe"]=true
						}else{
							tmp["isAllegatedByMe"]=false
						}
					}
					cb(null,objLastResult)
				}
			})
		}
	],funcCb)
}

$dao["weibo"]["syncReply"]=function(strUserID,strWeiboID,strCommentID,isDown,dt_sync,maxCount,alreadySynced,funcCb){
	var objWeiboID=new ObjectID(strWeiboID)
	var objCommentID=new ObjectID(strCommentID)

	async.waterfall([
		function(cb){
			async.parallel([
				function(cb1){
					objWeiboColl.findOne({_id:objWeiboID},{fields:{_id:0,publish_user:1}},function(err,rResult){
						if(err){
							cb1({errcode:1001},null)
						}else if(!rResult){
							cb1({errcode:13000},null)
						}else{
							cb1(null,rResult["publish_user"])
						}
					})
				},
				function(cb1){
					objCommentColl.findOne({_id:objCommentID},{fields:{_id:0,_id_weibo:1,user:1}},function(err,rResult){
						if(err){
							cb1({errcode:1001},null)
						}else if(!rResult){
							cb1({errcode:13006},null)
						}else if(!rResult["_id_weibo"] || (rResult["_id_weibo"].toHexString()!=strWeiboID)){
							cb1({errcode:13005},null)
						}else{
							cb1(null,rResult["user"])
						}
					})
				},
			],function(err,parallelResults){
				if(err){
					cb(err,null)
				}else{
					cb(null,parallelResults[0],parallelResults[1])
				}
			})
		},
		function(strWeiboPubUser,strCommentPubUser,cb){
			var syncOptions={
				down:isDown,
				coll:"reply",
				tsName:"dt_reply",
				dt:dt_sync,
				alreadySynced:alreadySynced,
				syncCount:maxCount,
				extraFilter:{
					_id_comment:objCommentID
				},
				projection:{
					owner:0,
					_id_comment:0
				}
			}

			$dao["cmn"]["upOrDownGestureSync"](syncOptions,function(err,rResults){
				if(err!=0){
					cb({errcode:err},null)
				}else{
					cb(null,rResults)
				}
			})
		},
		function(arrReplies,cb){
			var objMap={}
			objMap[strUserID]=1
			for(var i in arrReplies){
				var tmp=arrReplies[i]
				objMap[tmp["user"].toHexString()]=1
				objMap[tmp["to"].toHexString()]=1
			}
			var arrUniqueIDs=_.keys(objMap)
			var arrObjIDs=[]
			for(var i in arrUniqueIDs){
				arrObjIDs.push(new ObjectID(arrUniqueIDs[i]))
			}
			objUserColl.find({_id:{$in:arrObjIDs}}).project({nickname:1,img_headportrait:1}).toArray(function(err,rResults){
				if(err){
					cb({errcode:1001},null)
				}else{
					var objMapUserID_UserInfo=_.indexBy(rResults,function(item){
						return item["_id"].toHexString()
					})
					for(var i in arrReplies){
						var tmp=arrReplies[i]
						var id1=tmp["user"].toHexString()
						var id2=tmp["to"].toHexString()
						tmp["user_nickname"]=objMapUserID_UserInfo[id1]["nickname"]
						tmp["user_img_headportrait"]=objMapUserID_UserInfo[id1]["img_headportrait"]
						tmp["to_nickname"]=objMapUserID_UserInfo[id2]["nickname"]
						tmp["to_img_headportrait"]=objMapUserID_UserInfo[id2]["img_headportrait"]
					}
				}
				cb(null,arrReplies)
			})
		}
	],funcCb)
}



