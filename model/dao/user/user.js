/**
 * Created by doucharles1 on 16/3/11.
 */
var _=require("underscore")
var async=require("async")
var util=require("util")
var ObjectID=require("mongodb").ObjectID
var Timestamp=require("mongodb").Timestamp
var IM=$load("IM.js")
$load("FileManager.js")

var objUserColl=$objMongoColls["maindb"]["user"]
var objContactColl=$objMongoColls["im"]["contacts"]
var objGroupUserColl=$objMongoColls["im"]["group_user"]

/*
{
    img_headportrait:<string>,
    nickname:<string>,
    signature:<string>,
    firstname:<string>,
    lastname:<string>,
    birthday:<int>,
    sex:<int>,      0 男 1 女
    university:<string>,
    majority:<string>,
    degree:<int>,     0 大专 1 本科 2 研究生
    moto:<string>,
    permission_level:<int>, 0 普通 1 认证 2 企业 3 超级
    province:<string>,
    qq:<string>,
    email:<string>,
    blog:<string>,
    address:<string>
}
 */

$dao["user"]["updateProfile"]=function(req,strUserID,objUserInfo,funcCb){
    var intBirthday=objUserInfo["birthday"]
    var intYear=parseInt(intBirthday/10000)
    var objDateNow=new Date()
    var intYearNow=objDateNow.getFullYear()
    objUserInfo["age"]=intYearNow-intYear
    var strNickName= req.user["nickname"] || ""
    objUserInfo["nickname"]=objUserInfo["nickname"] || req.user["nickname"] || ""

    delete objUserInfo["dt_registration"]
    delete objUserInfo["dt_lastLogin"]

    async.series([
        function(cb){
            objUserColl.updateOne({_id:strUserID},{$set:objUserInfo},function(err,updateResult){
                if(err){
                    cb(1002,null)
                }else{
                    var newCacheObj= _.extend(req.user,objUserInfo)
                    $dao["cmn"]["updateUserProfileByID"](req.cid,newCacheObj,function(errcode){
                        if(errcode!=0){
                            cb({errcode:errcode},null)
                        }else{
                            cb(null,null)
                        }
                    })
                }
            })
        },
        function(cb){
            if(strNickName!=objUserInfo["nickname"]){
                IM.updateUserNickName(req.imToken,req.cid,objUserInfo["nickname"],function(errcode){
                    if(errcode!=0){
                        cb({errcode:errcode},null)
                    }else{{
                        cb(null,null)
                    }}
                })
            }else{
                cb(null,null)
            }
        }
    ],function(err,result){
        if(err){
            funcCb(1002,null)
        }else{
            funcCb(0,null)
        }
    })
}

$dao["user"]["authentication"]=function(req,objAuthInfo,funcCb){
    if(!req.user["name"]){
        req.junkfiles=[objAuthInfo["img_identification_card1"],objAuthInfo["img_identification_card2"]]
        funcCb(10000)
        return
    }
    if(!objAuthInfo["img_identification_card1"]){
        funcCb(10001)
        return
    }
    if(!objAuthInfo["img_identification_card2"]){
        funcCb(10002)
        return
    }
    if(!objAuthInfo["identification_code"]){
        req.junkfiles=[objAuthInfo["img_identification_card1"],objAuthInfo["img_identification_card2"]]
        funcCb(10007)
        return
    }

    //0:尚未认证 1:认证审核中 2:认证通过 3:认证失败
    objAuthInfo["authentication_state"]=1
    objAuthInfo["identification_code"]=objAuthInfo["identification_code"].toString()
    objUserColl.findOne({_id:req.ocid},{fields:{authentication_state:1}},function(err,rResult){
        if(err){
            req.junkfiles=[objAuthInfo["img_identification_card1"],objAuthInfo["img_identification_card2"]]
            funcCb(1001,null)
        }else if(!rResult){
            req.junkfiles=[objAuthInfo["img_identification_card1"],objAuthInfo["img_identification_card2"]]
            funcCb(1010,null)
        }else if(rResult["authentication_state"]==1){
            req.junkfiles=[objAuthInfo["img_identification_card1"],objAuthInfo["img_identification_card2"]]
            funcCb(10010,null)
        }else if(rResult["authentication_state"]==2){
            req.junkfiles=[objAuthInfo["img_identification_card1"],objAuthInfo["img_identification_card2"]]
            funcCb(10011,null)
        }else{
            objUserColl.updateOne({_id:req.ocid},{$set:objAuthInfo},function(err,objResult){
                if(err){
                    req.junkfiles=[objAuthInfo["img_identification_card1"],objAuthInfo["img_identification_card2"]]
                    funcCb(1002,null)
                }else{
                    var newCacheObj= _.extend(req.user,objAuthInfo)
                    $dao["cmn"]["updateUserProfileByID"](req.cid,newCacheObj,function(errcode){
                        funcCb(errcode)
                    })
                }
            })
        }
    })
}

$dao["user"]["authPass"]=function(req,funcCb){
    var objUpdate={}
    var objTmp={}
    var adminid=req.cid

    if(req.body.pass==true){
        objUpdate["$set"]={"authentication_state":2,"permission_level":1}
        objTmp={"authentication_state":2,"permission_level":1}
        objUpdate["$unset"]={auth_failure_reason:""}
    }else{
        if(!req.body.reason){
            funcCb(10004)
            return
        }
        objUpdate["$set"]={"authentication_state":3,"permission_level":0}
        objTmp={"authentication_state":3,"permission_level":0}
        objUpdate["$set"]={"auth_failure_reason":req.body.reason}
        objTmp["auth_failure_reason"]=req.body.reason
    }
    objUpdate["$set"]["check_administrator"]=adminid
    objUserColl.findOneAndUpdate(
        {
            _id:req.params.id,
            $or:[{check_administrator:{$exists:false}},{check_administrator:adminid}]
        },
        objUpdate,
        {
            returnOriginal:false
        },
        function(err,objUpdated){
            if(err){
                funcCb(1002)
            }else{
                $dao["cmn"]["updateUserProfileByID"](req.params.id,objUpdated,function(errcode){
                    funcCb(errcode)
                })
            }
        }
    )
}

$dao["user"]["grantIntegral"]=function(strUserID,integral,funcCb){
    objUserColl.findOneAndUpdate({_id:strUserID},{$inc:{integral:integral}},{returnOriginal:false},function(err,objUser){
        if(err){
            funcCb(1001)
        }else{
            $dao["cmn"]["updateUserProfileByID"](strUserID,objUser,function(errcode){
                funcCb(errcode)
            })
        }
    })
}

$dao["user"]["grantBadge"]=function(strUserID,objBadgeID,funcCb){
    var objNow=new Date()
    objUserColl.updateOne({_id:strUserID},{$push:{badges:{id:objBadgeID,dt_achieve:objNow}}},function(err,objResult){
        if(err){
            funcCb(1002)
        }else{
            funcCb(0)
        }
    })
}

$dao["user"]["updateHeadportrait"]=function(req,strUserID,oldImgUrl,objImg,funcCb){
    objUserColl.updateOne({_id:strUserID},{$set:objImg},function(err,objResult){
        if(err){
            req.junkfiles=[objImg["img_headportrait"]]
            funcCb(1002,null)
        }else{
            var newCacheObj=_.extend(req.user,objImg)
            $dao["cmn"]["updateUserProfileByID"](req.cid,newCacheObj,function(errcode){
                if(errcode==0){
                    if(oldImgUrl){
                        req.junkfiles=[oldImgUrl]
                    }
                    funcCb(0,objImg)
                }else{
                    req.junkfiles=[objImg["img_headportrait"]]
                    funcCb(errcode,null)
                }
            })
        }
    })
}

$dao["user"]["queryUserInfos"]=function(arrUserIDs,maxEveryTime,funcCb){
    var arrArrUserIDs=$cmn["myutil"]["splitArrays"](arrUserIDs,maxEveryTime)

    async.concat(arrArrUserIDs,function(arrOne,cb){
        objUserColl.find({_id:{$in:arrOne}}).project({nickname:1,img_headportrait:1}).toArray(function(err,arrResults){
            if(err){
                cb({errcode:1001},null)
            }else{
                cb(null,arrResults)
            }
        })
    },function(err,concatResults){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            var objMapUserID_UserInfo=_.indexBy(concatResults,function(item){
                return item["_id"].toHexString()
            })
            funcCb(0,objMapUserID_UserInfo)
        }
    })
}