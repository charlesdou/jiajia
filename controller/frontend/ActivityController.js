var util=require("util")
var async=require("async")
var _=require("underscore")
var _s=require("underscore.string")
var ObjectID=require("mongodb").ObjectID
$load("MyUtil.js")
var path=require("path")
var arrRoutes=[
    ["post","","$auth","$form","$isObjectBody","$body",publishActivity],
    ["put",":_id_activity","$auth","$form","$isObjectBody","$body",updateActivity],
    ["delete",":_id_activity","$auth",cancelActivity],
    ["put","enrollment/:_id_activity","$auth",activityEnrollment],
    ["delete","enrollment/:_id_activity","$auth",cancelEnrollment],
    ["put","signin/:_id_activity","$auth",activitySignin],
    ["put","complement/:_id_activity","$auth",activityComplete],
    ["post","remarks/:_id_activity","$auth","$isObjectBody","$body",publishRemark],
    ["delete","remarks/:_id_remark","$auth",deleteRemark]
]

function ActivityController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}
util.inherits(ActivityController,Controller)

function publishActivity(req,res,next){
    $dao["activity"]["publishActivity"](req.oid,req.body,_.bind(res,res.reply))
}

function updateActivity(req,res,next){
}

function cancelActivity(req,res,next){

}

function activityEnrollment(req,res,next){

}

function cancelEnrollment(req,res,next){

}

function activitySignin(req,res,next){

}

function activityComplete(req,res,next){

}

function publishRemark(req,res,next){

}

function deleteRemark(req,res,next){

}

module.exports=new ActivityController(arrRoutes,"activity","activity","")