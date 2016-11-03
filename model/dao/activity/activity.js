var _=require("underscore")
var async=require("async")
var util=require("util")
var ObjectID=require("mongodb").ObjectID
var Timestamp=require("mongodb").Timestamp
$load("FileManager.js")
$load("MyUtil.js")
var _s=require("underscore.string")
var objActivityColl=$objMongoColls["maindb"]["activity"]
var objActivityEnrollmentColl=$objMongoColls["maindb"]["activity_enrollment"]
var objActivityRemarkColl=$objMongoColls["maindb"]["activity_remark"]

/*
 activity:
 {
 _id:<ObjectID>,
 type:<int>, //0 后台发步 1 企业发布
 _id_publish_user:<ObjectID>     //发布者ID
 title:<string>,     //标题
 img_logo:<string>,     //logo
 img_poster：<string>,     //海报
 description:<string>,     //内容
 dt_publish:<Datetime>,     //发布时间
 dt_end_enrollment:<Datetime>，     //报名截止日期
 dt_begin:<DateTime>,     //活动开始时间
 dt_end:<DateTime>,     //互动结束时间
 status:<int> //0 审核中 1：审核失败 2：报名中  3：报名截止  4：开始  5：结束
 _id_check_user:<ObjectID>     //审核者ID
 failure_reason:<string>,     //审核失败原因
 applies:<int>  //default:0,   //当前报名人数
 participants:<int>  //default:0     //活动参加人数
 min_applies:<int>   //default:1     //活动最小报名人数
 integral:<int>      //default:1
 _id_badge:<ObjectID>
 remarks:<int>    //default:0
 }

 indexes:
 [
 {"type":1},
 {"title":1},
 {"_id_publish_user":1}
 {"dt_publish":1},
 {"dt_publish":-1},
 {"dt_begin":1},
 {"dt_begin":-1},
 {"dt_end":1},
 {"dt_end":-1},
 {"status":1}
 ]

 */

/*
 badge:
 {
 _id:<ObjectID>,
 type:"活动徽章",
 name:"",
 dt_create:<Datetime>,
 binding:{
 "collection":"activity",
 "_id":<ObjectID>
 }
 }
 */

$dao["activity"]["publishActivity"]=function(userid,objActivity,funcCb){
    var objDefaultInserted={
        type:0,
        _id_publish_user:userid,
        title:"",
        img_logo:"",
        img_poster:"",
        description:"",
        dt_publish:new Date(),
        applies:0,
        participants:0,
        min_applies:1,
        integral:1,
        remarks:0
    }
    var objInserted=_.extend(objDefaultInserted,objActivity)
    if(objInserted["type"==1]){
        objInserted["status"]=0
    }else{
        objInserted["status"]=2
    }

    objActivityColl.insertOne(objInserted,function(err,cResult){
        if(err){
            funcCb({errcode:1000},null)
        }else{
            objInserted["_id"]=cResult.insertedId
            funcCb(null,objInserted)
        }
    })
}

$dao["activity"]["cancelActivity"]=function(userid,activityid,funcCb){
    async.waterfall([
        function(cb){
            objActivityColl.findOne({_id:activityid},{fields:{_id:0,_id_publish_user:1,status:1}},function(err,rResult){
                if(err){
                    cb({errcode:1001},null)
                }else if(rResult){
                    cb({errcode:15000},null)
                }else if(rResult["_id_publish_user"].toHexString()!=userid.toHexString()){
                    cb({errcode:15001},null)
                }else if(rResult["status"]) {
                }else{
                    cb(null,null)
                }
            })
        },
        function(lastResult,cb){

        }
    ],function(err,wResult){
        funcCb(err,wResult)
    })
}

$dao["activity"]["editActivity"]=function(userid,activityid,objUpdated,funcCb){

}

$dao["activity"]["check"]=function(checkuserid,activityid,objCheck,funcCb){

}

$dao["activity"]["endEnrollment"]=function(activityid,funcCb){

}

$dao["activity"]["begin"]=function(activityid,dtStartTime,funcCb){

}

$dao["activity"]["end"]=function(activityid,funcCb){

}

/*
 activity_enrollment:
 {
 _id:<ObjectID>,
 _id_activity:<ObjectID>,
 _id_user:<ObjectID>，
 status:     //0 已报名  1 已签到   2 完成活动
 dt_enrollment:<Datetime>,   //报名时间
 dt_participant:<Datetime>   //签到时间
 dt_complete:<Datetime>     //活动完成时间
 }

 indexes:[
 {"_id_activity":1},
 {"_id_user":1},
 {"_id_activity":1,"_id_user":1},
 {"status":1}
 {"dt_enrollment":1},
 {"dt_paricipant":1},
 {"dt_complete":1},
 {"dt_enrollment":-1},
 {"dt_paricipant":-1},
 {"dt_complete":-1}
 ]
 */
$dao["activity"]["enroll"]=function(userid,activityid,funcCb){

}

$dao["activity"]["cancelEnroll"]=function(userid,enrollid,funcCb){

}

$dao["activity"]["signin"]=function(userid,activityid,funcCb){

}

$dao["activity"]["complete"]=function(userid,activityid,funcCb){

}

/*
 activity_remark:
 {
 _id:<ObjectID>,
 _id_activity:<ObjectID>,
 _id_user:<ObjectID>,
 _id_to:<ObjectID>,
 dt_publish:<Datetime>,
 content:<string>
 }

 indexes:
 [
 {"_id_activity":1},
 {"_id_user":1},
 {"_id_activity":1,"_id_user":1},
 {"dt_publish":1},
 {"dt_publish":-1}
 ]
 */
$dao["activity"]["publishRemark"]=function(userid,activityid,objRemark,funcCb){

}

$dao["activity"]["deleteRemark"]=function(userid,remarkid,funcCb){

}
