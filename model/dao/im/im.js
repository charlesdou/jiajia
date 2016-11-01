var _=require("underscore")
var async=require("async")
var util=require("util")
var ObjectID=require("mongodb").ObjectID
var Timestamp=require("mongodb").Timestamp
$load("FileManager.js")
$load("MyUtil.js")
var _s=require("underscore.string")
var IM=$load("IM.js")
var objUserColl=$objMongoColls["maindb"]["user"]
var objContactColl=$objMongoColls["im"]["contacts"]
var objBlacklistColl=$objMongoColls["im"]["blacklist"]
var objGroupColl=$objMongoColls["im"]["group"]
var objGroupUserColl=$objMongoColls["im"]["group_user"]

$dao["im"]["token"]=function(funcCb){
    var strKey=util.format("%s.3rd.im.token",$objConfig["app_name_en"])
    async.waterfall([
        function(cb){
            $redisClient.get(strKey,function(err,reply){
                if(err){
                    cb({errcode:1004},null)
                }else{
                    cb(null,reply)
                }
            })
        },
        function(token,cb){
            if(token){
                cb(null,token)
            }else{
                IM.token(function(err,obj){
                    if(err || !obj || !_.isObject(obj)){
                        cb({errcode:1026},null)
                    }else{
                        cb(null,obj)
                    }
                })
            }
        },
        function(objToken,cb){
            if(_.isString(objToken)){
                cb(null,objToken)
            }else{
                var objMulti = $redisClient.multi()
                objMulti.set(strKey, objToken["access_token"])
                objMulti.expire(strKey, objToken["expires_in"]-parseInt($objConfig["subapp"]["im"]["token_refresh_advance"]))
                objMulti.exec(function (err, reply) {
                    if (err) {
                        cb({errcode: 1018}, null)
                    } else {
                        cb(null, objToken["access_token"])
                    }
                })
            }
        }
    ],function(err,strToken){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            funcCb(0,strToken)
        }
    })
}

/*
contacts:
{
    _id:<ObjectID>,
    _id_user:<ObjectID>,
    _id_friend:<ObjectID>,
    remarkname:<string>,
    phones:[
        <string>,
        ...
    ],
    labels:[
        <string>,
        ...
    ],
    more_description:""
    isStarred:false,
    isTopped:false,
    isNonDisturb:false,
    dt_add:<DateTime>,
    dt_sync:<DateTime>,
    notVisitWeibo:false,
    notAllowedVisitWeibo:false        
}
*/

$dao["im"]["addFriend"]=function(strAccessToken,strOriginUser,strFriend,funcCb){
    var objOringinUserID=new ObjectID(strOriginUser)
    var objFriendID=new ObjectID(strFriend)
    async.waterfall([
        function(cb){
            IM.addFriend(strAccessToken,strOriginUser,strFriend,function(err,result){
                if(err!=0){
                    cb({errcode:err},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(result,cb){
            objUserColl.findOne({_id:objFriendID},{fields:{_id:0,nickname:1}},function(err,objFriend){
                if(err){
                    cb({errcocde:1001},null)
                }else{
                    if(!objFriend){
                        cb({errcode:1010},null)
                    }else{
                        cb(null,objFriend["nickname"])
                    }
                }
            })
        },
        function(strNickName,cb){
            var obj={
                _id_user:objOringinUserID,
                _id_friend:objFriendID,
                remarkname: strNickName,
                phones:[],
                labels:[],
                more_description:"",
                isStarred:false,
                isTopped:false,
                isNonDisturb:false,
                dt_add:new Date(),
                dt_sync:new Date(),
                notVisitWeibo:false,
                notAllowedVisitWeibo:false
            }
            objContactColl.insertOne(obj,function(err,result){
                if(err){
                    cb({errcode:1000},null)
                }else{
                    delete obj["_id"]
                    obj["dt_add"]=obj["dt_add"].getTime()
                    obj["dt_sync"]=obj["dt_sync"].getTime()
                    cb(null,obj)
                }
            })
        }
    ],function(err,objResult){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            funcCb(0,objResult)
        }
    })
}

$dao["im"]["deleteFriend"]=function(strAccessToken,strOriginUser,strFriend,funcCb){
    var objOringinUserID=new ObjectID(strOriginUser)
    var objFriendID=new ObjectID(strFriend)
    async.waterfall([
        function(cb){
            IM.deleteFriend(strAccessToken,strOriginUser,strFriend,function(err,objResult){
                if(err!=0){
                    cb({errcode:err},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(result,cb){
            objContactColl.deleteOne({_id_user:objOringinUserID,_id_friend:objFriendID},function(err,objResult){
                if(err){
                    cb({errcode:1003},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,objResult){
        if(err){
            funcCb(err["errcode"],null)
        }else {
            funcCb(0, null)
        }
    })
}

$dao["im"]["updateRemarkInfo"]=function(strOriginUser,strFriend,objRemarkInfo,funcCb){
    var objOringinUserID=new ObjectID(strOriginUser)
    var objFriendID=new ObjectID(strFriend)
    objContactColl.updateOne({_id_user:objOringinUserID,_id_friend:objFriendID},{$set:objRemarkInfo,$currentDate:{dt_sync:true}},function(err,result){
        if(err){
            funcCb(1002,null)
        }else{
            funcCb(0,null)
        }
    })
}

$dao["im"]["starFriend"]=function(strOriginUser,strFriend,isStarred,funcCb){
    var objOringinUserID=new ObjectID(strOriginUser)
    var objFriendID=new ObjectID(strFriend)
    objContactColl.updateOne({_id_user:objOringinUserID,_id_friend:objFriendID},{$set:{isStarred:isStarred},$currentDate:{dt_sync:true}},function(err,result){
        if(err){
            funcCb(1002,null)
        }else{
            funcCb(0,null)
        }
    })
}

$dao["im"]["topFriend"]=function(strOriginUser,strFriend,isTopped,funcCb){
    var objOringinUserID=new ObjectID(strOriginUser)
    var objFriendID=new ObjectID(strFriend)
    objContactColl.updateOne({_id_user:objOringinUserID,_id_friend:objFriendID},{$set:{isTopped:isTopped},$currentDate:{dt_sync:true}},function(err,result){
        if(err){
            funcCb(1002,null)
        }else{
            funcCb(0,null)
        }
    })
}

$dao["im"]["nonDisturb"]=function(strOriginUser,strFriend,is_Non_Disturb,funcCb){
    var objOringinUserID=new ObjectID(strOriginUser)
    var objFriendID=new ObjectID(strFriend)
    objContactColl.updateOne({_id_user:objOringinUserID,_id_friend:objFriendID},{$set:{isNonDisturb:is_Non_Disturb},$currentDate:{dt_sync:true}},function(err,result){
        if(err){
            funcCb(1002,null)
        }else{
            funcCb(0,null)
        }
    })
}

$dao["im"]["searchFriend"]=function(strFriendIDorNickName,funcCb){
    objUserColl.findOne({username:strFriendIDorNickName},{fields:{nickname:1,img_headportrait:1}},function(err,objUser){
        if(err){
            funcCb(1001,null)
        }else{
            if(objUser){
                funcCb(0,objUser)
            }else{
                objUserColl.findOne({nickname:strFriendIDorNickName},{fields:{img_headportrait:1,nickname:1}},function(err,objUser){
                    if(err){
                        funcCb(1001,null)
                    }else if(!objUser){
                        funcCb(1051,null)
                    }else{
                        funcCb(0,objUser)
                    }
                })
            }
        }
    })
}

$dao["im"]["updateHeadportrait"]=function(strUserID,strImgUrl,funcCb){
    async.parallel([
        function(cb){
            objContactColl.updateMany({_id_friend:strUserID},{$set:{friend_headportrait:strImgUrl}},function(err,objUpdated){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    cb(null,null)
                }
            })
        },function (cb) {
            objGroupUserColl.updateMany({_id_user:strUserID},{$set:{img_user_headportrait:strImgUrl}},function(err,objUpdated){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,paraResult){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            funcCb(0,null)
        }
    })
}

$dao["im"]["weiboVisible"]=function(strUserID,strFreindID,weiboVisible,funcCb){
    var objOringinUserID=new ObjectID(strUserID)
    var objFriendID=new ObjectID(strFreindID)
    objContactColl.updateOne({_id_user:objOringinUserID,_id_friend:objFriendID},{$set:{notVisitWeibo:weiboVisible}},function(err,uResult){
        if(err){
            funcCb(1001,null)
        }else{
            funcCb(0,null)
        }
    })
}

$dao["im"]["weiboAllowed"]=function(strUserID,strFreindID,weiboAllowed,funcCb){
    var objOringinUserID=new ObjectID(strUserID)
    var objFriendID=new ObjectID(strFreindID)
    objContactColl.updateOne({_id_user:objOringinUserID,_id_friend:objFriendID},{$set:{notAllowedVisitWeibo:weiboAllowed}},function(err,uResult){
        if(err){
            funcCb(1001,null)
        }else{
            funcCb(0,null)
        }
    })
}

$dao["im"]["queryFriendDetail"]=function(strOriginUser,strFriend,funcCb){
    var objOringinUserID=new ObjectID(strOriginUser)
    var objFriendID=new ObjectID(strFriend)
    objContactColl.findOne({_id_user:objOringinUserID,_id_friend:objFriendID},{fields:{_id:0,_id_user:0,_id_friend:0,dt_add:0,dt_sync:0}},function(err,objFriend){
        if(err){
            funcCb(1003,null)
        }else{
            if(!objFriend){
                objFriend={}
            }
            objUserColl.findOne({_id:objFriendID},{fields:{_id:0,nickname:1,img_headportrait:1,name:1,province:1,university:1,majority:1}},function(err,rReuslt){
                if(err){
                    funcCb(1001,null)
                }else if(!rReuslt){
                    funcCb(1010,null)
                }else{
                    objFriend=_.extend(objFriend,rReuslt)
                    funcCb(0,objFriend)
                }
            })
        }
    })
}

/*
blacklist:
{
    _id:<ObjectID>,
    _id_user:<string>,
    _id_friend:<string>,
    friend_nickname:<string>,
    friend_headportrait:<string>
}
*/

/*
group:
{
    _id:<ObjectID>,
    group_imid:<string>,
    _id_owner:<string>,
    groupname:<string>,
    desc:<string>,
    maxusers:<int>,
    members:<int>,
    dt_create:<DateTime>,
    dt_sync:<DateTime>
}

group_user:
{
    _id:<ObjectID>,
    _id_group:<ObjectID>,
    group_imid:<string>,
    _id_user:<string>
}
*/

$dao["im"]["addGroup"]=function(strAccessToken,strOriginUser,objGroupInfo,funcCb){
    objGroupInfo["img_logo"]=""
    var objUserID=new ObjectID(strOriginUser)
    var objGroupInfo2IM={}
    objGroupInfo2IM["groupname"]=objGroupInfo["groupname"]
    objGroupInfo2IM["desc"]=objGroupInfo["desc"] || ""
    objGroupInfo2IM["maxusers"]=objGroupInfo["maxusers"] || 100
    objGroupInfo2IM["owner"]=strOriginUser
    objGroupInfo2IM["public"]=false
    objGroupInfo2IM["approval"]=true

    async.waterfall([
        function(cb){
            IM.addGroup(strAccessToken,strOriginUser,objGroupInfo2IM,function(err,result){
                if(err){
                    cb({errcode:err},null)
                }else{
                    cb(null,result["data"]["groupid"])
                }
            })
        },
        function(strImGroupID,cb){
            objGroupInfo["_id_owner"]=objUserID
            objGroupInfo["group_imid"]=strImGroupID
            objGroupInfo["members"]=1
            objGroupInfo["dt_create"]=new Date()
            objGroupInfo["dt_sync"]=new Date()

            objGroupColl.insertOne(objGroupInfo,function(err,objResult){
                if(err){
                    cb({errcode:1000},null)
                }else{
                    objGroupInfo["_id"]=objResult["insertedId"]
                    cb(null,objGroupInfo)
                }
            })
        },
        function(result,cb){
            objGroupUserColl.insertOne({
                _id_group:objGroupInfo["_id"],
                group_imid:objGroupInfo["group_imid"],
                _id_user:objUserID
            },function(err,cResult){
                if(err){
                    cb({errcode:1000},null)
                }else{
                    cb(null,result)
                }
            })
        }
    ],function(err,objResult){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            delete objResult["dt_create"]
            delete objResult["dt_sync"]
            funcCb(0,{_id:objResult["_id"],group_imid:objResult["group_imid"]})
        }
    })
}

$dao["im"]["updateGroupHeadPortrait"]=function(strOriginUser,strGroupID,objImg,funcCb){
    objGroupColl.findOne({_id:new ObjectID(strGroupID)},{fields:{_id:0,img_logo:1,_id_owner:1}},function(err,objResult){
        if(err){
            funcCb(1001,null)
            $cmn["file"].delete([objImg["img_logo"]],function(errcode){
                if(errcode!=0){
                    console.log("error to delete file")
                }
            })
        }else if(!objResult) {
            funcCb(1050,null)
            $cmn["file"].delete([objImg["img_logo"]],function(errcode){
                if(errcode!=0){
                    console.log("error to delete file")
                }
            })
        }else if(objResult["_id_owner"].toHexString()!=strOriginUser){
            funcCb(1048,null)
            $cmn["file"].delete([objImg["img_logo"]],function(errcode){
                if(errcode!=0){
                    console.log("error to delete file")
                }
            })
        }else{
            objGroupColl.updateOne({_id:new ObjectID(strGroupID)},{$set:objImg},function(err,objResult1){
                if(err){
                    funcCb(1002,null)
                    $cmn["file"].delete([objImg["img_logo"]],function(errcode){
                        if(errcode!=0){
                            console.log("error to delete file")
                        }
                    })
                }else{
                    funcCb(0,objImg)
                    $cmn["file"].delete([objResult["img_logo"]],function(errcode){
                        console.log("error to delete file")
                    })
                }
            })
        }
    })
}

$dao["im"]["updateGroup"]=function(strAccessToken,strOriginUser,groupID,objUpdatedInfo,funcCb){
    var objUserID=new ObjectID(strOriginUser)
    var objGroupID=new ObjectID(groupID)
    async.waterfall([
        function(cb){
            objGroupColl.findOne({_id:objGroupID},{fields:{img_logo:1,_id_owner:1,group_imid:1,maxusers:1,members:1}},function(err,result){
                if(err){
                    cb({errcode:1001},null)
                }else if(objUpdatedInfo["maxusers"] && objUpdatedInfo["maxusers"]<result["members"]){
                    cb({errcode:1049},null)
                }else{
                    if(strOriginUser!=result["_id_owner"].toHexString()){
                        cb({errcode:1048},null)
                    }else{
                        cb(null,result)
                    }
                }
            })
        },
        function(obj,cb){
            var objUpdatedToIM={}
            if(objUpdatedInfo["groupname"]){
                objUpdatedToIM["groupname"]=objUpdatedInfo["groupname"]
            }
            if(objUpdatedInfo["desc"]){
                objUpdatedToIM["description"]=objUpdatedInfo["desc"]
            }
            if(objUpdatedInfo["maxusers"]){
                objUpdatedToIM["maxusers"]=objUpdatedInfo["maxusers"]
            }

            IM.updateGroupInfo(strAccessToken,obj["group_imid"],objUpdatedToIM,function(err,objIm){
                if(err){
                    cb({errcode:err},null)
                }else{
                    cb(null,obj)
                }
            })
        },
        function(obj,cb){
            objGroupColl.updateOne({_id:objGroupID},{$set:objUpdatedInfo},function(err,objResult){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,obj)
                }
            })
        }
    ],function(err,objResult){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            funcCb(0,null)
        }
    })  
}

$dao["im"]["deleteGroup"]=function(strAccessToken,strOriginUser,groupID,funcCb){
    async.waterfall([
        function(cb){
            objGroupColl.findOne({_id:new ObjectID(groupID)},{fields:{img_logo:1,group_imid:1,_id_owner:1}},function(err,result){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    if(strOriginUser!=result["_id_owner"].toHexString()){
                       cb({errcode:1048},null)
                    }else{
                       cb(null,result) 
                    } 
                }
            })
        },
        function(result,cb){
            IM.deleteGroup(strAccessToken,result["group_imid"],function(errcode,result1){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,result)
                }
            })
        },
        function(result,cb){
            objGroupUserColl.deleteMany({_id_group:new ObjectID(groupID)},function(err,deleteResult){
                if(err){
                    cb({errcode:1003},null)
                }else{
                    objGroupColl.deleteOne({_id:new ObjectID(groupID)},function(err,deleteResult){
                        if(err){
                            cb({errcode:1003},null)
                        }else{
                            cb(null,result)
                        }
                    })
                }
            })
        },
        function(result,cb){
            $cmn["file"].delete([result["img_logo"]],function(errcode){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,objResult){
         if(err){
            funcCb(err["errcode"],null)
         }else{
            funcCb(0,null)
         }
    })
}

$dao["im"]["transferGroupOwner"]=function(strAccessToken,strOriginUser,groupID,newOwner,funcCb){
    var objUserID=new ObjectID(strOriginUser)
    var objNewOwnerID=new ObjectID(newOwner)
    async.waterfall([
        function(cb){
            objGroupColl.findOne({_id:new ObjectID(groupID)},{group_imid:1,_id_owner:1},function(err,result){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    if(strOriginUser!=result["_id_owner"].toHexString()){
                        cb({errcode:1048},null)
                    }else{
                       cb(null,result) 
                    } 
                }
            })
        },
        function(result,cb){
            IM.transferGroup(strAccessToken,result["group_imid"],newOwner,function(errcode,imResult){
                if(errcode!=0){
                    cb(errcode,null)
                }else{
                    cb(null,result)
                }
            })
        },
        function(result,cb){
            objGroupUserColl.deleteOne({_id_group:new ObjectID(groupID),_id_user:objUserID},function(err,delResult){
                if(err){
                    cb({errcode:1003},null)
                }else{
                    cb(null,result)
                }
            })
        },
        function(result,cb){
            objGroupColl.updateOne({_id:new ObjectID(groupID)},{$set:{_id_owner:objNewOwnerID},$inc:{members:-1}},function(err,updateResult){
                if(err){
                    cb({errcode:1003},null)
                }else{
                    cb(null,result)
                }
            })
        }
    ],function(err,objResult){
        if(err){
            funcCb(err["errcode"],null)
         }else{
            funcCb(0,null)
         }
    })
}

$dao["im"]["addUsersToGroup"]=function(strAccessToken,strOriginUser,groupID,arrUserIDs,funcCb){
    var objGroupID=new ObjectID(groupID)
    var objUserID=new ObjectID(strOriginUser)
    var arrObjUserIDs=[]
    for(var i in arrUserIDs){
        var tmp=arrUserIDs[i]
        if(tmp && _.isString(tmp)){
            arrObjUserIDs.push(new ObjectID(tmp))
        }
    }
    var len=arrUserIDs.length
    var strGroupImID=""
    async.waterfall([
        function(cb){
            objGroupColl.findOne({_id:objGroupID},{fields:{_id:0,group_imid:1,_id_owner:1,members:1,maxusers:1}},function(err,queryResult){
                if(err){
                    cb({errcode:1001},null)
                }else if(!queryResult["_id_owner"] || queryResult["_id_owner"].toHexString()!=strOriginUser){
                    cb({errcode:1048},null)
                }else if(queryResult["members"]+len>queryResult["maxusers"]){
                    cb({errcode:1059},null)
                }else{
                    strGroupImID=queryResult["group_imid"]
                    cb(null,queryResult)
                }
            })
        },
        function(result,cb){
            var groupIMID=result["group_imid"]
            IM.addUsersToGroup(strAccessToken,groupIMID,arrUserIDs,function(errcode,imResult){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,result)
                }
            })
        },
        function(result,cb){
            var arrInserts=[]
            for(var i in arrObjUserIDs){
                var objTmp={_id_group:objGroupID,group_imid:strGroupImID,_id_user:arrObjUserIDs[i]}
                arrInserts.push(objTmp)
            }
            objGroupUserColl.insertMany(arrInserts,function(err,cResult){
                if(err){
                    cb({errcode:1000},null)
                }else{
                    cb(null,len)
                }
            })
        },
        function(len,cb){
            objGroupColl.findOneAndUpdate({_id:objGroupID},{$inc:{members:len}},{projection:{members:1},returnOriginal:false},function(err,rResult){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,rResult)
                }
            })
        }
    ],function(err,objResult){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            funcCb(0,objResult["value"])
        }
    })
}

$dao["im"]["deleteUsersFromGroup"]=function(strAccessToken,strOriginUser,groupID,arrUserIDs,funcCb){
    var objGroupID=new ObjectID(groupID)
    var objUserID=new ObjectID(strOriginUser)
    var arrObjUserIDs =[]
    for(var i in arrUserIDs){
        var tmp=arrUserIDs[i]
        if(tmp && _.isString(tmp)){
            arrObjUserIDs.push(new ObjectID(tmp))
        }
    }
    var len=arrUserIDs.length
    async.waterfall([
        function(cb){
           objGroupColl.findOne({_id:objGroupID},{fields:{_id:0,group_imid:1,_id_owner:1}},function(err,queryResult){
                if(err){
                    cb({errcode:1002},null)
                }else if(strOriginUser!=queryResult["_id_owner"].toHexString()){
                    cb({errcode:1048},null)
                }else{
                    cb(null,queryResult)
                }
           }) 
        },
        function(result,cb){
            var groupIMID=result["group_imid"]
            IM.deleteUsersFromGroup(strAccessToken,groupIMID,arrUserIDs,function(errcode,imResult){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,result)
                }
            })
        },
        function(result,cb){
            objGroupUserColl.deleteMany({_id_group:objGroupID,_id_user:{$in:arrObjUserIDs}},function(err,delResult){
                if(err){
                    cb({errcode:1003},null)
                }else{
                    cb(null,len)
                }
            })
        },
        function(len,cb){
            objGroupColl.findOneAndUpdate({_id:objGroupID},{$inc:{members:-len}},{projection:{members:1},returnOriginal:false},function(err,rReuslt){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,rReuslt)
                }
            })
        }
    ],function(err,objResults){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            funcCb(0,objResults["value"])
        }
    })
}

$dao["im"]["leaveFromGroup"]=function(strAccessToken,strOriginUser,groupID,funcCb){
    var objGroupID=new ObjectID(groupID)
    objGroupUserColl.deleteOne({_id_group:objGroupID,_id_user:strOriginUser},function(err,objResult){
        if(err){
            funcCb(1003,null)
        }else{
            objGroupColl.updateOne({_id:objGroupID},{$inc:{members:-1}},function(err,uResult){
                if(err){
                    funcCb(1002,null)
                }else{
                    funcCb(0,null)
                }
            })
        }
    })
}

$dao["im"]["groupDetail"]=function(groupID,funcCb){
    async.parallel([
        function(cb){
            objGroupColl.findOne({_id:new ObjectID(groupID)},{fields:{dt_create:0,dt_sync:0}},function(err,result){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,result)   
                }
            })
        },
        function(cb){
            objGroupUserColl.find({_id_group:new ObjectID(groupID)},{fields:{_id:0,_id_user:1}}).toArray(function(err,arrUsers){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,arrUsers)
                }
            })
        }
    ],function(err,arrResults){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            var arrObjUserIDs=_.map(arrResults[1],function(item){
                return item["_id_user"]
            })
            $dao["user"]["queryUserInfos"](arrObjUserIDs,150,function(err,objMap){
                if(err!=0){
                    funcCb(err,null)
                }else{
                    for(var i in arrResults[1]){
                        var tmp=arrResults[1][i]
                        tmp["nickname"]=objMap[tmp["_id_user"].toHexString()]["nickname"]
                        tmp["img_headportrait"]=objMap[tmp["_id_user"].toHexString()]["img_headportrait"]
                    }
                }
                arrResults[0]["group_members"]=arrResults[1]
                funcCb(0,arrResults[0])
            })
        }
    })
}

/*
{
    "friends":[
        {_id_friend:<string>,friend_nickname:<string>,friend_headportrait:<string>},
        ...
    ],
    "groups":[
        {
            _id:<string>,
            group_imid:<string>,
            _id_owner:<string>,
            img_logo:<string>,
            groupname:<string>,
            desc:<string>,
            maxusers:<int>
        },...
    ]
}
*/

function _syncAllGroups(arrGroupID,funcCb){
    var arrArrGroupID=$cmn["myutil"]["splitArrays"](arrGroupID,150)
    async.concat(arrArrGroupID,function(arrGroupID,cb){
        objGroupColl.find({_id:{$in:arrGroupID}}).project({dt_create:0,dt_sync:0}).toArray(function(err,rResults){
            if(err){
                cb(err["errcode"],null)
            }else{
                cb(null,rResults)
            }
        })
    },function(err,arrConcatResults){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            funcCb(0,arrConcatResults)
        }
    })
}

$dao["im"]["synContacts"]=function(strOriginUser,funcCb){
    var objUserID=new ObjectID(strOriginUser)
    var objContacts={
        friends:[],
        groups:[]
    }

    async.parallel([
        function(cb){
            objContactColl.find({_id_user:objUserID},{fields:{_id:0,_id_friend:1}}).toArray(function(err,arrQueryResults){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,arrQueryResults)
                }
            })
        },
        function(cb){
            objGroupUserColl.find({_id_user:objUserID},{fields:{_id:0,_id_group:1}}).toArray(function(err,rResults){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,rResults)
                }
            })
        },
    ],function(err,parallelResults){
        async.parallel([
            function(cb){
                var arrAllFriendID=_.map(parallelResults[0],function(item){
                    return item["_id_friend"]
                })
                $dao["user"]["queryUserInfos"](arrAllFriendID,150,function(err,objMap){
                    if(err!=0){
                        cb({errcode:err},null)
                    }else{
                        for(var i in parallelResults[0]){
                            var tmp=parallelResults[0][i]
                            tmp["friend_nickname"]=objMap[tmp["_id_friend"].toHexString()]["nickname"]
                            tmp["friend_headportrait"]=objMap[tmp["_id_friend"].toHexString()]["img_headportrait"]
                        }
                        cb(null,parallelResults[0])
                    }
                })
            },
            function(cb){
                var allAllGroupID=_.map(parallelResults[1],function(item){
                    return item["_id_group"]
                })
                _syncAllGroups(allAllGroupID,function(err,rResults){
                    if(err!=0){
                        cb({errcode:err},null)
                    }else{
                        cb(null,rResults)
                    }
                })
            }
        ],function(err,arrResults){
            if(err){
                funcCb(err["errcode"],null)
            }else{
                objContacts["friends"]=arrResults[0]
                objContacts["groups"]=arrResults[1]
                funcCb(null,objContacts)
            }
        })
    })
}

$dao["im"]["queryWeiboFriends"]=function(strOriginUser,intMaxGroupUsers,funcCb){
    objContactColl.find({_id_user:strOriginUser,notVisitWeibo:false,notAllowedVisitWeibo:false},{fields:{_id:0,_id_friend:1}}).toArray(function(err,rResults){
        if(err){
            funcCb(1001,null)
        }else{
            var arrFriendIDs=[strOriginUser]
            for(var i in rResults){
                arrFriendIDs.push(rResults[i]["_id_friend"])
            }
            var arrFinalArrs=[strOriginUser]
            var index=0
            var intLen=arrFriendIDs.length
            while(index<intLen){
                var nextIndex=index+intMaxGroupUsers
                var intStep=(nextIndex<=intLen)?nextIndex:intLen
                var arrTmp=arrFriendIDs.slice(index,intStep)
                arrFinalArrs.push(arrTmp)
                index+=intLen
            }
            funcCb(0,arrFinalArrs)
        }
    })
}





