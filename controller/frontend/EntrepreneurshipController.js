var util=require("util")
var async=require("async")
var _=require("underscore")
var _s=require("underscore.string")
var ObjectID=require("mongodb").ObjectID
$load("MyUtil.js")
var path=require("path")
var arrRoutes=[
    ["post","","$auth","$form",submitEntrepreneurship],
    ["put",":proposal_id","$auth",examineEntrepreneurship],
    ["get","","$auth","$form",listEntrepreneurship],
    ["get",":proposal_id","$auth",entrepreneurshipDetails],
    ["post","instructor","$auth","$form",submitEntrepreneurshipInstructor],
    ["get","instructor",listEntrepreneurshipInstructor],
    ["get","instructor/:instructor_id","$auth",entrepreneurshipInstructorDetails],
    ["post",":entrepreneurship_id/applicant","$auth",participateEntrepreneurship]
]

function EntrepreneurshipController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}
util.inherits(EntrepreneurshipController,Controller)
//提交创业发布
function submitEntrepreneurship(req,res,next){
    $dao["entrepreneurship"]["submitEntrepreneurship"](req.cid,req.body,_.bind(res.reply,res))
}
function examineEntrepreneurship(req,res,next){
    $dao["entrepreneurship"]["examineEntrepreneurship"]([{_id:new ObjectID(req.params['proposal_id'])},req.body],_.bind(res.reply,res))
}
//查询所有创业信息
function listEntrepreneurship(req,res,next){
    $dao["entrepreneurship"]["listEntrepreneurship"](_.bind(res.reply,res))
}
//创业详情页接口
function entrepreneurshipDetails(req,res,next){
	if(req.params['proposal_id']=='instructor'){
		next()
		return;
	}
    $dao["entrepreneurship"]["entrepreneurshipDetails"]({_id:new ObjectID(req.params['proposal_id'])},_.bind(res.reply,res))
}

function submitEntrepreneurshipInstructor(req,res,next){
    $dao["entrepreneurship"]["submitEntrepreneurshipInstructor"](req.cid,req.body,_.bind(res.reply,res))
}
function listEntrepreneurshipInstructor(req,res,next){
    $dao["entrepreneurship"]["listEntrepreneurshipInstructor"](_.bind(res.reply,res))
}
function entrepreneurshipInstructorDetails(req,res,next){
    $dao["entrepreneurship"]["entrepreneurshipInstructorDetails"]({_id:new ObjectID(req.params['instructor_id'])},_.bind(res.reply,res))
}
//申请合伙人接口
function participateEntrepreneurship(req,res,next){
    var entreneurshipId = new ObjectID(req.params.entrepreneurship_id);
    $dao["entrepreneurship"]["participateEntrepreneurship"](req.cid,req.body,entreneurshipId,_.bind(res.reply,res))
}



module.exports=new EntrepreneurshipController(arrRoutes,"entrepreneurship","entrepreneurship","")