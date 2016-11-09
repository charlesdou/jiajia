var util=require("util")
var async=require("async")
var _=require("underscore")
var _s=require("underscore.string")
var ObjectID=require("mongodb").ObjectID
$load("MyUtil.js")
var path=require("path")
var arrRoutes=[
    ["post","","$auth","$form","$isObjectBody",publishActivity],
    ["put",":_id_activity","$auth","$form","$isObjectBody","$params",updateActivity],
    ["delete",":_id_activity","$auth","$params",cancelActivity],
    ["post","enrollment/:_id_activity","$auth","$params",activityEnrollment],
    ["delete","enrollment/:_id_activity","$auth","$params",cancelEnrollment],
    ["put","signin/:_id_activity","$auth","$params",activitySignin],
    ["put","complement/:_id_activity","$auth","$params",activityComplete],
    ["post","remark/:_id_activity","$auth","$isObjectBody","$body","$params",publishRemark],
    ["delete","remark/:_id_remark","$auth","$params",deleteRemark],
    ["post","sync","$auth","$isObjectBody","$body",syncActivities],
    ["get","details/:_id_activity","$auth","$params",details],
    ["post","sync/remarks/:_id_activity","$auth","$isObjectBody","$body","$params",syncRemarks]
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

function activityEnrollment(req,res,next){
    $dao["activity"]["enroll"](req.ocid,req.params["_id_activity"],_.bind(res.reply,res))
}

function cancelEnrollment(req,res,next){
    $dao["activity"]["cancelEnroll"](req.ocid,req.params["_id_activity"],_.bind(res.reply,res))
}

function activitySignin(req,res,next){
    $dao["activity"]["signin"](req.ocid,req.params["_id_activity"],_.bind(res.reply,res))
}

function activityComplete(req,res,next){
    $dao["activity"]["complete"](req.ocid,req.params["_id_activity"],_.bind(res.reply,res))
}

function publishRemark(req,res,next){
    $dao["activity"]["publishRemark"](req.ocid,req.params["_id_activity"],req.body,_.bind(res.reply,res))
}

function deleteRemark(req,res,next){
    $dao["activity"]["deleteRemark"](req.ocid,req.params["_id_remark"],_.bind(res.reply,res))
}

function syncActivities(req,res,next){
    $dao["activity"]["syncActivities"](req.ocid,req.body,_.bind(res.reply,res))
}

function details(req,res,next){
    $dao["activity"]["details"](req.ocid,req.params["_id_activity"],_.bind(res.reply,res))
}

function syncRemarks(req,res,next){
    $dao["activity"]["syncRemarks"](req.ocid,req.params["_id_activity"],req.body,_.bind(res.reply,res))
}

module.exports=new ActivityController(arrRoutes,"activity","activity","")