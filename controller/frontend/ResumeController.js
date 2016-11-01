/**
 * Created by doucharles1 on 16/3/18.
 */
var async=require("async")
var _=require("underscore")
var util=require("util")
$load("FileManager.js")
var ObjectID=require("mongodb").ObjectID

var arrRoutes=[
    ["post","","$auth","$user",produceResume],
    ["put",":resumeid/headportrait","$auth","$user","$form",headImg],
    ["put",":resumeid/selfdescription","$isObjectBody","$auth",selfDescription],
    ["put",":resumeid/expectation","$isObjectBody","$auth",workexpectation],
    ["post",":resumeid/:attribute","$isObjectBody","$auth",insertOthers],
    ["put",":resumeid/:attribute/:id","$isObjectBody","$auth",updateOthers],
    ["delete",":resumeid/:attribute/:id","$auth",deleteOthers],
    ["get",":resumeid/details","$auth",queryDetails],
    ["get","","$auth",queryAllResumes],
    ["delete",":resumeid","$auth",delResume],
    ["put",":resumeid/basic","$isObjectBody","$auth",updateBasic]
]

function ResumeController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}

util.inherits(ResumeController,Controller)

function produceResume(req,res,next){
    $dao["resume"]["produceResume"](req.user,_.bind(res.reply,res))
}

function headImg(req,res,next){
    var objID=new ObjectID(req.params.resumeid)
    var strOldImgPath=req.user["img_headportrait"]
    $dao["resume"]["updateResumeImg"](objID,strOldImgPath,req.form,_.bind(res.reply,res))
}

function selfDescription(req,res,next){
    if(!req.body["selfdescription"]){
        res.err(1053)
        return
    }
    var objID=new ObjectID(req.params.resumeid)
    $dao["resume"]["updateSelfDescription"](req,objID,req.body,_.bind(res.reply,res))
}

function insertOthers(req,res,next){
    var objID=new ObjectID(req.params.resumeid)
    $dao["resume"]["insertArrayAttrbute"](req,objID,req.body,_.bind(res.reply,res))
}

function updateOthers(req,res,next){
    var objID=new ObjectID(req.params.resumeid)
    $dao["resume"]["updateArrayAttribute"](req,objID,req.body,_.bind(res.reply,res))
}

function deleteOthers(req,res,next){
    var objID=new ObjectID(req.params.resumeid)
    $dao["resume"]["deleteArrayAttribute"](req,objID,_.bind(res.reply,res))
}

function queryDetails(req,res,next) {
    var objID = new ObjectID(req.params.resumeid)
    var userid = req.params.id || req.cid
    $dao["resume"]["queryResumeInfo"](objID, _.bind(res.reply,res))
}

function workexpectation(req,res,next){
    var objID=new ObjectID(req.params.resumeid)
    $dao["resume"]["updateExpectation"](req,objID,req.body,_.bind(res.reply,res))
}

function queryAllResumes(req,res,next){
    var strUserID=req.ocid
    $dao["resume"].queryAllResumes(strUserID,_.bind(res.reply,res))
}

function delResume(req,res,next){
    $dao["resume"]["delResume"](req.cid,req.params["resumeid"],_.bind(res.reply,res))
}

function updateBasic(req,res,next){
    $dao["resume"]["updateBasic"](req.params.resumeid,req.body,_.bind(res.reply,res))
}

module.exports=new ResumeController(arrRoutes,"user/resume","user")






