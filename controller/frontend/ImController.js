var util=require("util")
var async=require("async")
var _=require("underscore")
var _s=require("underscore.string")
var ObjectID=require("mongodb").ObjectID
$load("MyUtil.js")
var path=require("path")
var arrRoutes=[
    ["post","friend/:friendid","$auth","$imToken",addFriendToList],
    ["delete","friend/:friendid","$auth","$imToken",deleteFriendFromList],
    ["put","friend/remarkinfo/:friendid","$isObjectBody","$auth","$imToken",updateRemarkInfo],
    ["put","friend/star/:friendid","$isObjectBody","$auth",setFriendStar],
    ["put","friend/top/:friendid","$isObjectBody","$auth",setFriendTop],
    ["put","friend/nondisturb/:friendid","$isObjectBody","$auth",setNonDisturb],
    ["post","group","$isObjectBody","$auth","$imToken",addGroup],
    ["put","group/:groupid/headportrait","$auth","$form",updateGroupHeadPortrait],
    ["put","group/:groupid","$isObjectBody","$auth","$imToken",updateGroup],
    ["delete","group/:groupid","$auth","$imToken",deleteGroup],
    ["get","group/:groupid","$auth",queryGroupInfo],
    ["put","group/:groupid/owner/:ownerid","$auth","$imToken",transferGroupOwner],
    ["post","group/:groupid/users/","$isObjectBody","$auth","$imToken",addUsersToGroup],
    ["delete","group/:groupid/users","$isObjectBody","$auth","$imToken",deleteUsersFromGroup],
    ["delete","group/:groupid/users/leave","$auth","$imToken",leaveFromGroup],
    ["get","friend/:friendid","$auth",queryOneFriendDetail],
    ["get","contacts","$auth",syncContacts],
    ["get","searchfriend","$auth",searchFriend],
    ["put","friend/weibovisible/:friendid","$isObjectBody","$auth",setWeiboVisible],
    ["put","friend/weiboallowed/:friendid","$isObjectBody","$auth",setWeiboAllowed]
]

function ImController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}
util.inherits(ImController,Controller)


function addFriendToList(req,res,next){
	$dao["im"]["addFriend"](req.imToken,req.cid,req.params["friendid"],_.bind(res.reply,res))
}

function deleteFriendFromList(req,res,next){
	$dao["im"]["deleteFriend"](req.imToken,req.cid,req.params["friendid"],_.bind(res.reply,res))
}

function updateRemarkInfo(req,res,next){
  var objBody=req.body
  var obj={
      remarkname:"",
      phones:[],
      labels:[],
      more_description:""
  }
  obj=_.extend(obj,objBody)
  $dao["im"]["updateRemarkInfo"](req.cid,req.params["friendid"],obj,_.bind(res.reply,res))
}

function setFriendStar(req,res,next){
  if(!_.isBoolean(req.body["isStarred"])){
    res.err(1053)
    return
  }
  $dao["im"]["starFriend"](req.cid,req.params["friendid"],req.body["isStarred"],_.bind(res.reply,res))
}

function setFriendTop(req,res,next){
  if(!_.isBoolean(req.body["isTopped"])){
    res.err(1053)
    return
  }
	$dao["im"]["topFriend"](req.cid,req.params["friendid"],req.body["isTopped"],_.bind(res.reply,res))
}

function setNonDisturb(req,res,next){
  if(!_.isBoolean(req.body["isNonDisturb"])){
    res.err(1053)
    return
  }
	$dao["im"]["nonDisturb"](req.cid,req.params["friendid"],req.body["isNonDisturb"],_.bind(res.reply,res))
}

function addGroup(req,res,next){
   if(!req.body.groupname){
    res.err(1053)
    return
   }
   $dao["im"]["addGroup"](req.imToken,req.cid,req.body,_.bind(res.reply,res))
}

function updateGroup(req,res,next){
   $dao["im"]["updateGroup"](req.imToken,req.cid,req.params.groupid,req.body,_.bind(res.reply,res))
}

function deleteGroup(req,res,next){
   $dao["im"]["deleteGroup"](req.imToken,req.cid,req.params.groupid,_.bind(res.reply,res))
}

function queryGroupInfo(req,res,next){
   $dao["im"]["groupDetail"](req.params.groupid,_.bind(res.reply,res))
}

function transferGroupOwner(req,res,next){
   $dao["im"]["transferGroupOwner"](req.imToken,req.cid,req.params.groupid,req.params.ownerid,_.bind(res.reply,res))
}

function addUsersToGroup(req,res,next){
   if(!_.isArray(req.body["users"]) || req.body.users.length==0){
    res.err(1053)
    return
   }
   $dao["im"]["addUsersToGroup"](req.imToken,req.cid,req.params.groupid,req.body.users,_.bind(res.reply,res))
}

function deleteUsersFromGroup(req,res,next){
    if(!_.isArray(req.body["users"]) || req.body.users.length==0){
      res.err(1053)
      return
    }
    $dao["im"]["deleteUsersFromGroup"](req.imToken,req.cid,req.params.groupid,req.body.users,_.bind(res.reply,res))
}

function leaveFromGroup(req,res,next){
    $dao["im"]["leaveFromGroup"](req.imToken,req.cid,req.params.groupid,_.bind(res.reply,res))
}

function queryOneFriendDetail(req,res,next){
    $dao["im"]["queryFriendDetail"](req.cid,req.params.friendid,_.bind(res.reply,res))
}

function syncContacts(req,res,next){
  $dao["im"]["synContacts"](req.cid,_.bind(res.reply,res))
}

function updateGroupHeadPortrait(req,res,next){
    $dao["im"]["updateGroupHeadPortrait"](req.cid,req.params.groupid,req.form,_.bind(res.reply,res))
}

function searchFriend(req,res,next){
  if(!req || !req.query || (!_.isString(req.query.key) && !_.isNumber(req.query.key))){
    res.err(1054)
    return
  }
  var searchKey=req.query.key.toString()
  $dao["im"]["searchFriend"](searchKey,_.bind(res.reply,res))
}

function setWeiboVisible(req,res,next){
  if(!_.isBoolean(req.body["notVisitWeibo"])){
    res.err(1054)
    return
  }else{
    $dao["im"]["weiboVisible"](req.cid,req.params.friendid,req.body["notVisitWeibo"],_.bind(res.reply,res))
  }
}

function setWeiboAllowed(req,res,next){
  if(!_.isBoolean(req.body["notAllowedVisitWeibo"])){
    res.err(1054)
    return
  }else{
    $dao["im"]["weiboAllowed"](req.cid,req.params.friendid,req.body["notAllowedVisitWeibo"],_.bind(res.reply,res))
  }
}

module.exports=new ImController(arrRoutes,"","im","im")