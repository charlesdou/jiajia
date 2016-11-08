var util=require("util")
var async=require("async")
var _=require("underscore")
var _s=require("underscore.string")
var ObjectID=require("mongodb").ObjectID
$load("MyUtil.js")
var path=require("path")
var arrRoutes=[
    ["post","","$auth","$form","$isObjectBody","$body",publishActivity],
    ["put",":_id_activity","$auth","$form","$isObjectBody","$body","$params",updateActivity],
    ["delete",":_id_activity","$auth","$params",cancelActivity],
    ["put","audit/:_id_activity","$auth","$isObjectBody","$body","$params",checkActivity],
    ["put","begin/:_id_activity","$auth","$params",beginActivity],
    ["put","end/:_id_activity","$auth","$params",endActivity],
    ["put","endenroll/:_id_activity","$auth","$params",endEnroll],
    ["post","sync","$auth","$isObjectBody","$body",syncActivities],
    ["get","details/:_id_activity","$auth","$params",details],
    ["post","sync/remarks/:_id_activity","$auth","$isObjectBody","$body","$params",syncRemarks],
    ["post","sync/users/:_id_activity","$auth","$isObjectBody","$body","$params",syncUsers]
]

function ActivityController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}
util.inherits(ActivityController,Controller)

function publishActivity(req,res,next){
	$dao["activity"]["publishActivity"](req.ocid,req.body,_.bind(res.reply,res))
}

function updateActivity(req,res,next){
	$dao["activity"]["editActivity"](req.ocid,req.params["_id_activity"],req.body,_.bind(res.reply,res))
}

function cancelActivity(req,res,next){
	$dao["activity"]["cancelActivity"](req.ocid,req.params["_id_activity"],_.bind(res.reply,res))
}

function checkActivity(req,res,next){
	$dao["activity"]["check"](req.ocid,req.params["_id_activity"],req.body,_.bind(res.reply,res))
}

function beginActivity(req,res,next){
	$dao["activity"]["begin"](req.params["_id_activity"],_.bind(res.reply,res))
}

function endActivity(req,res,next){
	$dao["activity"]["end"](req.params["_id_activity"],_.bind(res.reply,res))
}

function endEnroll(req,res,next){
	$dao["activity"]["endEnrollment"](req.params["_id_activity"],_.bind(res.reply,res))
}

function syncActivities(req,res,next){
	$dao["activity"]["onePageActivities"](req.ocid,req.body["page"],req.body["perpage"],req.body,_.bind(res.reply,res))
}

function details(req,res,next){
	$dao["activity"]["details"](req.ocid,req.params["_id_activity"],_.bind(res.reply,res))
}

function syncRemarks(req,res,next){
	$dao["activity"]["onePageRemarks"](req.ocid,req.params["_id_activity"],req.body["page"],req.body["perpage"],req.body,_.bind(res.reply,res))
}

function syncUsers(req,res,next){
	$dao["activity"]["onePageUsers"](req.ocid,req.body["page"],req.body["perpage"],req.body,_.bind(res.reply,res))
}

module.exports=new ActivityController(arrRoutes,"activity","activity","")