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

const ACTIVITY_PAGESIZE=55
const REMARK_PAGESIZE=100


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
    dt_end:<DateTime>,     //活动结束时间
    status:<int> //0 待审核 1：审核失败 2：报名中  3：报名截止  4：开始  5：结束  6：被取消
    _id_check_user:<ObjectID>     //审核者ID
    failure_reason:<string>,     //审核失败原因
    applies:<int>  //default:0,   //当前报名人数
    participants:<int>  //default:0     //活动参加人数
    completes:<int>     //default:0     //活动完成人数
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
        completes:0,
        min_applies:1,
        integral:1,
        remarks:0
    }
    var objInserted=_.extend(objDefaultInserted,objActivity)
    if(objInserted["type"]==1){
        objInserted["status"]=0
    }else{
        objInserted["status"]=2
    }

    objActivityColl.insertOne(objInserted,function(err,cResult){
        if(err){
            funcCb({errcode:1000},null)
        }else{
            objInserted["_id"]=cResult.insertedId
            delete objInserted["integral"]
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
                }else if(!rResult){
                    cb({errcode:15000},null)
                }else if(rResult["_id_publish_user"].toHexString()!=userid.toHexString()){
                    cb({errcode:15001},null)
                }else if(rResult["status"]==4) {
                    cb({errcode:15002},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(lastResult,cb){
            objActivityColl.updateOne({_id:activityid},{$set:{status:6}},function(err,uResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,wResult){
        funcCb(err,wResult)
    })
}

$dao["activity"]["editActivity"]=function(userid,activityid,objUpdated,funcCb){
    req.junkfiles=[objUpdated["img_logo"],objUpdated["img_poster"]]
    async.waterfall([
        function(cb){
            objActivityColl.findOne({_id:activityid},{fields:{_id:0,_id_publish_user:1,status:1,img_logo:1,img_poster:1}},function(err,rResult){
                if(err){
                    cb({errcode:1001},null)
                }else if(!rResult){
                    cb({errcode:15000},null)
                }else if(rResult["_id_publish_user"].toHexString()!=userid.toHexString()) {
                    cb({errcode:15001},null)
                }else if(rResult["status"]==4 || rResult["status"]==6){
                    cb({errcode:15003})
                }else{
                    cb(null,rResult)
                }
            })
        },
        function(lastResult,cb){
            objActivityColl.updateOne({_id:activityid},{$set:objUpdated},function(err,uResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    req.junkfiles=[lastResult["img_logo"],lastResult["img_poster"]]
                    cb(null,null)
                }
            })
        }
    ],function(err,wResult){
        funcCb(err,wResult)
    })
}

$dao["activity"]["check"]=function(checkuserid,activityid,objCheck,funcCb){
    async.waterfall([
        function(cb){
            objActivityColl.findOne({_id:activityid},{fields:{_id:0,status:1}},function(err,rResult){
                if(err){
                    cb({errcode:1001},null)
                }else if(!rResult){
                    cb({errcode:15000},null)
                }else if(rResult["status"]!=0){
                    cb({errcode:15004},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(lastResult,cb) {
            objCheck["_id_check_user"]=checkuserid
            objActivityColl.updateOne({_id:activityid},{$set:objCheck},function(err,uResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,wResult){
        funcCb(err,wResult)
    })
}

$dao["activity"]["endEnrollment"]=function(activityid,funcCb){
    async.waterfall([
        function(cb){
            objActivityColl.findOne({_id:activityid},{_id:0,status:1},function(err,rResult){
                if(err){
                    cb({errcode:1001},null)
                }else if(!rResult){
                    cb({errcode:15000},null)
                }else if(rResult["status"]!=2){
                    cb({errcode:15005},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(lastResult,cb){
           objActivityColl.updateOne({_id:activityid},{$set:{status:3},$currentDate:{dt_end_enrollment:true}},function(err,uResult){
               if(err){
                   cb({errcode:1001},null)
               }else{
                   cb(null,null)
               }
           })
        }
    ],function(err,wResult){
        funcCb(err,wResult)
    })
}

$dao["activity"]["begin"]=function(activityid,funcCb){
    async.waterfall([
        function(cb){
            objActivityColl.findOne({_id:activityid},{_id:0,status:1},function(err,rResult){
                if(err){
                    cb({errcode:1001},null)
                }else if(!rResult){
                    cb({errcode:15000},null)
                }else if(rResult["status"]!=3){
                    cb({errcode:15006},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(lastResult,cb){
            objActivityColl.updateOne({_id:activityid},{$set:{status:4},$currentDate:{dt_begin:true}},function(err,uResult){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,wResult){
        funcCb(err,wResult)
    })
}

$dao["activity"]["end"]=function(activityid,funcCb){
    async.waterfall([
        function(cb){
            objActivityColl.findOne({_id:activityid},{_id:0,status:1},function(err,rResult){
                if(err){
                    cb({errcode:1001},null)
                }else if(!rResult){
                    cb({errcode:15000},null)
                }else if(rResult["status"]!=4){
                    cb({errcode:15007},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(lastResult,cb){
            objActivityColl.updateOne({_id:activityid},{$set:{status:5},$currentDate:{dt_end:true}},function(err,uResult){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,wResult){
        funcCb(err,wResult)
    })
}

$dao["activity"]["details"]=function(userid,activityid,funcCb){
    var objProjection={
       dt_begin:0,
       dt_end:0,
       _id_check_user:0,
       failure_reason:0,
       integral:0,
       _id_badge:0
    }

    async.parallel([
        function(cb){
            objActivityColl.findOne({_id:activityid},{fields:objProjection},function(err,rResult){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,rResult)
                }
            })
        },
        function(cb){
            objActivityEnrollmentColl.findOne({_id_activity:activityid,_id_user:userid},{fields:{_id:0,status:1}},function(err,rResult){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,rResult)
                }
            })
        }
    ],function(err,pResults){
        if(err){
            funcCb(err,null)
        }else if(!pResults[1]){
            if(pResults[0]["type"]==0){
                delete pResults["_id_publish_user"]
            }
            pResults[0]["userstatus"]=-1
            funcCb(null,pResults[0])
        }else{
            if(pResults[0]["type"]==0){
                delete pResults["_id_publish_user"]
            }
            pResults[0]["userstatus"]=pResults[1]["status"]
            funcCb(null,pResults[0])
        }
    })
}

$dao["activity"]["syncActivities"]=function(userid,obj,funcCb){
    var objOption={
        coll:"activity",
        tsName:"dt_publish",
        syncCount:ACTIVITY_PAGESIZE,
        extraFilter:{
            status:{$ne:6}
        },
        projection:{
            integral:0
        }
    }
    objOption=_.extend(objOption,obj)

    async.waterfall([
        function(cb){
            $dao["cmn"]["upOrDownGestureSync"](objOption,function(errcode,rResults){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,rResults)
                }
            })
        },
        function(lastResults,cb){
            var arrActivityIDs=_.map(lastResults,function(item){
                return item["_id"]
            })
            objActivityEnrollmentColl.find({_id_activity:{$in:arrActivityIDs},_id_user:userid}).project({_id:0,_id_activity:1,status:1}).toArray(function(err,rResults){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    var objMapUserState=_.indexBy(rResults,function(item){
                        return item["_id_activity"].toHexString()
                    })
                    for(var i in lastResults){
                        var objTmp=lastResults[i]
                        var strActivityID=objTmp["_id"].toHexString()
                        var objUserStatus=objMapUserState[strActivityID]
                        objTmp["userstatus"]=(objUserStatus && objUserStatus["status"]) || -1
                    }
                    cb(null,lastResults)
                }
            })
        }
    ],funcCb)
}

$dao["activity"]["syncRemarks"]=function(userid,activityid,obj,funcCb){
    var objOptions={
        tsName:"activity_remark",
        syncCount:REMARK_PAGESIZE,
        extraFilter:{_id_activity:activityid},
        descending:false
    }
    objOptions=_.extend(objOptions,obj)

    async.waterfall([
        function(cb){
            $dao["cmn"]["upOrDownGestureSync"](objOptions,function(errcode,rResults){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,rResults)
                }
            })
        },
        function(lastResults,cb){
            var objUserIDs={}
            var arrAllUserIDs=[]
            for(var i in lastResults){
                var objTmp=lastResults[i]
                if(objTmp["_id_user"]){
                    objUserIDs[objTmp["_id_user"].toHexString()]=1
                }
                if(objTmp["_id_to"]){
                    objUserIDs[objTmp["_id_to"].toHexString()]=1
                }
            }
            for(var strKey in objUserIDs){
                arrAllUserIDs=new ObjectID(strKey)
            }
            $dao["user"]["queryUserInfos"](arrAllUserIDs,150,function(errcode,objMapUsers){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,lastResults,objMapUsers)
                }
            })
        },
        function(arrRemarks,objMapUserInfo,cb){
            for(var i in arrRemarks){
                var objRemark=arrRemarks[i]
                if(!objRemark["_id_to"]){
                    objRemark["_id_to"]=""
                }
                var strRemarkUserID=(objRemark["_id_user"] && objRemark["_id_user"].toHexString()) || ""
                var strRemarkToID=(objRemark["_id_to"] && objRemark["_id_to"].toHexString()) || ""
                objRemark["user_nickname"]=""
                objRemark["img_user_headportrait"]=""
                objRemark["to_nickname"]=""
                objRemark["img_to_headportrait"]=""
                if(strRemarkUserID){
                    objRemark["user_nickname"]=objMapUserInfo[strRemarkUserID]["nickname"]
                    objRemark["img_user_headportrait"]=objMapUserInfo[strRemarkUserID]["img_headportrait"]
                }
                if(strRemarkToID){
                    objRemark["to_nickname"]=objMapUserInfo[strRemarkToID]["nickname"]
                    objRemark["img_to_headportrait"]=objMapUserInfo[strRemarkToID]["img_headportrait"]
                }
            }
            cb(null,arrRemarks)
        }
    ],funcCb)
}

$dao["activity"]["onePageActivities"]=function(userid,intPage,intPerpage,obj,funcCb){
    
}

$dao["activity"]["onePageRemarks"]=function(userid,intPage,intPerpage,obj,funcCb){
    
}

$dao["activity"]["onePageUsers"]=function(userid,intPage,intPerpage,obj,funcCb){
    
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
    async.waterfall([
        function(cb){
            objActivityColl.findOne({_id:activityid},{fields:{_id:0,status:1}},function(err,rResult){
                if(err){
                    cb({errcode:1001},null)
                }else if(!rResult){
                    cb({errcode:15000},null)
                }else if(rResult["status"]!=2) {
                    cb({errcode:15008},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(lastResult,cb){
            objActivityEnrollmentColl.count({_id_activity:activityid,_id_user:userid},function(err,intCount){
                if(err){
                    cb({errcode:1001},null)
                }else if(intCount>0){
                    cb({errode:15009},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(lastResult,cb){
            objActivityEnrollmentColl.insertOne({_id_activity:activityid,_id_user:userid,status:0,dt_enrollment:new Date()},function(err,cResult){
                if(err){
                    cb({errcode:1000},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(lastResult,cb){
            objActivityColl.findOneAndUpdate({_id:activityid},{$inc:{applies:1}},{projection:{_id:0,applies:1},returnOriginal:false},function(err,uResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    cb(null,uResult.value)
                }
            })
        }
    ],function(err,wResult){
        funcCb(err,wResult)
    })
}

$dao["activity"]["cancelEnroll"]=function(userid,activityid,funcCb){
    async.waterfall([
        function(cb){
            objActivityColl.findOne({_id:activityid},{fields:{_id:0,status:1}},function(err,rResult){
                if(err){
                    cb({errcode:1001},null)
                }else if(!rResult){
                    cb({errcode:15000},null)
                }else if(rResult["status"]!=2){
                    cb({errcode:15011},null)
                }else{
                    cb(null,null)
                }

            })
        },
        function(lastResult,cb){
            objActivityEnrollmentColl.findOne({_id_activity:activityid,_id_user:userid},{fields:{_id:0,status:1}},function(err,rResult){
                if(err){
                    cb({errcode:1001},null)
                }else if(!rResult){
                    cb({errcode:15010},null)
                }else if(rResult["status"]!=0){
                    cb({errcode:15012},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(lastResult,cb){
            objActivityEnrollmentColl.deleteOne({_id_activity:activityid,_id_user:userid},function(err,dResult){
                if(err){
                    cb({errcode:1003},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function (lastResult,cb) {
            objActivityColl.findOneAndUpdate({_id:activityid},{$inc:{applies:-1}},{projection:{_id:0,applies:1},returnOriginal:false},function(err,uResult){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,uResult.value)
                }
            })
        }
    ],function(err,wResult){
        funcCb(err,wResult)
    })
}

function _activityStart(activityid){
    return function(cb){
        objActivityColl.findOne({_id:activityid},{fields:{_id:0,status:1}},function(err,rResult){
            if(err){
                cb({errcode:1001},null)
            }else if(!rResult){
                cb({errcode:15000},null)
            }else if(rResult["status"]!=4){
                cb({errcode:15013},null)
            }else{
                cb(null,null)
            }
        })
    }
}

function _canSignin(userid,activityid){
    return function (lastResult,cb) {
        objActivityEnrollmentColl.findOne({_id_activity:activityid,_id_user:userid},{fields:{_id:0,status:1}},function(err,rResult){
            if(err){
                cb({errcode:1001},null)
            }else if(!rResult || rResult["status"]!=0){
                cb({errcode:15014},null)
            }else{
                cb(null,null)
            }
        })
    }
}

function _canComplement(userid,activityid){
    return function (lastResult,cb) {
        objActivityEnrollmentColl.findOne({_id_activity:activityid,_id_user:userid},{fields:{_id:0,status:1}},function(err,rResult){
            if(err){
                cb({errcode:1001},null)
            }else if(!rResult || rResult["status"]!=1){
                cb({errcode:15014},null)
            }else{
                cb(null,null)
            }
        })
    }
}

$dao["activity"]["signin"]=function(userid,activityid,funcCb){
    async.waterfall([
        _activityStart(activityid),
        _canSignin(userid,activityid),
        function(lastResult,cb){
            objActivityEnrollmentColl.updateOne({_id_activity:activityid,_id_user:userid},{$set:{status:1},$currentDate:{dt_participant:true}},function(err,uResult){
                if(err){
                   cb({errcode:1002},null)
                }else{
                   cb(null,null)
                }
            })
        },
        function(lastResult,cb){
            objActivityColl.findOneAndUpdate({_id:activityid},{$inc:{participants:1}},{projection:{_id:0,participants:1},returnOriginal:false},function(err,uResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    cb(null,uResult["value"])
                }
            })
        }
    ],function(err,wResult){
        funcCb(err,wResult)
    })
}

$dao["activity"]["complete"]=function(userid,activityid,funcCb){
    async.waterfall([
        _activityStart(activityid),
        _canComplement(userid,activityid),
        function(lastResult,cb){
            objActivityEnrollmentColl.updateOne({_id_activity:activityid,_id_user:userid},{$set:{status:2},$currentDate:{dt_complete:true}},function(err,uResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(lastResult,cb){
            objActivityColl.findOneAndUpdate({_id:activityid},{$inc:{completes:1}},{projection:{_id:0,completes:1},returnOriginal:false},function(err,uResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    cb(null,uResult["value"])
                }
            })
        }
    ],function(err,wResult){
        funcCb(err,wResult)
    })
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
function _activityExists(activityid){
    return function(cb){
        objActivityColl.count({_id:activityid},function(err,intCount){
            if(err){
                cb({errcode:1001},null)
            }else if(intCount<1){
                cb({errcode:15000},null)
            }else{
                cb(null,null)
            }
        })
    }
}

$dao["activity"]["publishRemark"]=function(userid,activityid,objRemark,funcCb){
    async.waterfall([
        _activityExists(activityid),
        function(lastResult,cb){
            objRemark["_id_user"]=userid
            objRemark["dt_publish"]=new Date()
            objRemark["_id_activity"]=activityid
            if(objRemark["_id_to"]){
                objRemark["_id_to"]=new ObjectID(objRemark["_id_to"])
            }
            objActivityRemarkColl.insertOne(objRemark,function(err,cResult){
                if(err){
                    cb({errcode:1000},null)
                }else{
                    cb(null,{_id:cResult["insertedId"]})
                }
            })
        },
        function(lastResult,cb){
            objActivityColl.findOneAndUpdate({_id:activityid},{$inc:{remarks:1}},{projection:{_id:0,remarks:1},returnOriginal:false},function(err,uResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    lastResult=_.extend(lastResult,uResult["value"])
                    cb(null,lastResult)
                }
            })
        }
    ],function(err,wResult){
        funcCb(err,wResult)
    })
}

$dao["activity"]["deleteRemark"]=function(userid,remarkid,funcCb){
    async.waterfall([
        function(cb){
            objActivityRemarkColl.findOne({_id:remarkid},{_id:0,_id_user:1,_id_activity:1},function(err,rResult){
                if(err){
                    cb({errcode:1001},null)
                }else if(!rResult || rResult["_id_user"].toHexString()!=userid.toHexString()){
                    cb({errcode:15015},null)
                }else{
                    cb(null,{_id:rResult["_id_activity"]})
                }
            })
        },
        function(lastResult,cb){
            objActivityRemarkColl.deleteOne({_id:remarkid},function(err,rResult){
                if(err){
                    cb({errcode:1003},null)
                }else{
                    cb(null,lastResult)
                }
            })
        },
        function(lastResult,cb){
            objActivityColl.findOneAndUpdate(lastResult,{$inc:{remarks:-1}},{projection:{_id:0,remarks:1},returnOriginal:false},function(err,uResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    cb(null,uResult["value"])
                }
            })
        }
    ],function(err,wResult){
        funcCb(err,wResult)
    })
}
