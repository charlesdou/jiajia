/**
 * Created by doucharles1 on 16/3/22.
 */

var _=require("underscore")
var util=require("util")
var async=require("async")
var uuid=require("uuid")

var strSessionPrefix=$objConfig["session_prefix"]

$dao["cmn"]["insertUserSession"]=function(req,strID,objUserInfo,funcCb){
    var objMulti=$redisClient.multi()
    var strSessionID=""

    var strIdAgent=util.format("%s%s.devices",$objConfig["session_prefix"],strID)
    $redisClient.hget(strIdAgent,req.deviceType.toString(),function(err,reply){
        if(err){
            funcCb(1004,null)
        }else{
            if(reply){
                objMulti.del(reply)
            }
            if(!req.isBrowser){
                var strUUID=uuid.v1()
                strSessionID=util.format("%s%s",$objConfig["session_prefix"],strUUID)
                req.sessionID=strSessionID
                objMulti.hset(strSessionID,"cid",strID)
            }else{
                strSessionID=util.format("%s%s",$objConfig["session_prefix"],req.session.id)
                req.session.cid=strID
            }

            objMulti.hset(strIdAgent,req.deviceType.toString(),strSessionID)

            $redisClient.get(util.format("%s%s.userprofile",strSessionPrefix,strID),function(err,reply){
                if(!reply || reply==""){
                    objMulti.set(util.format("%s%s.userprofile",$objConfig["session_prefix"],strID),JSON.stringify(objUserInfo))
                }
                objMulti.exec(function(err,replies){
                    if(err){
                        funcCb(1005,null)
                    }else{
                        funcCb(0,strSessionID)
                    }
                })
            })
        }
    })
}

$dao["cmn"]["updateUserProfileByID"]=function(strUserID,objUserProfile,funcCb){
    var strCacheKey=util.format("%s%s.userprofile",strSessionPrefix,strUserID)
    $redisClient.get(strCacheKey,function(err,strOrigin){
        if(err){
            funcCb(1004)
        }else{
            var objNewCache= _.extend(JSON.parse(strOrigin),objUserProfile)
            $redisClient.set(strCacheKey,JSON.stringify(objNewCache),function(err,objResult){
                if(err){
                    funcCb(1005)
                }else{
                    funcCb(0)
                }
            })
        }
    })
}

$dao["cmn"]["deleteUserSessionByID"]=function(req,strID,funcCb){
    var strCacheKey=util.format("%s%s.devices",strSessionPrefix,strID)
    req.session=null
    $redisClient.hgetall(strCacheKey,function(err,obj){
        if(err){
            funcCb(1004)
        }else{
            var objMulti=$redisClient.multi()
            for(var strKey in obj){
                objMulti.del(obj[strKey])
            }
            objMulti.del(strCacheKey)
            objMulti.del(util.format("%s%s.userprofile",strSessionPrefix,strID))
            objMulti.exec(function(err,replis){
                if(err){
                    funcCb(1006)
                }else{
                    funcCb(0)
                }
            })
        }
    })
}

$dao["cmn"]["deleteUserSessionBySID"]=function(req,funcCb){
   async.waterfall([
       function(cb){
           if(req.isBrowser){
               var strID1=req.session.cid
               req.session=null
               cb(null,strID1)
           }else{
               $redisClient.hget(req.sessionID,"cid",function(err,strID2){
                   if(err){
                       cb({errcode:1004},null)
                   }else{
                       cb(null,strID2)
                   }
               })
           }
       },
       function(strID,cb){
           $redisClient.hlen(util.format("%s%s.devices",strSessionPrefix,strID),function(err,length){
               if(err){
                   cb({errcode:1004},null)
               }else{
                   if(length>1){
                       cb(null,strID,false)
                   }else{
                       cb(null,strID,true)
                   }
               }
           })
       },
       function(strID,needDel,cb){
           var objMulti=$redisClient.multi()
           objMulti.del(req.sessionID)
           objMulti.hdel(util.format("%s%s.devices",strSessionPrefix,strID),req.deviceType.toString())

           if(needDel){
               objMulti.del(util.format("%s%s.devices",strSessionPrefix,strID))
               objMulti.del(util.format("%s%s.userprofile",strSessionPrefix,strID))
           }

           objMulti.exec(function(err,replies){
               if(err){
                  cb({errcode:1006},null)
               }else{
                   cb(null,null)
               }
           })
       }
   ],function(err,objResult){
       if(err){
           funcCb(err["errcode"])
       }else{
           funcCb(0)
       }
   })
}

$dao["cmn"]["queryUserProfileByID"]=function(strUserID,funcCb){
    $redisClient.get(util.format("%s%s.userprofile",strSessionPrefix,strUserID),function(err,strUser){
        if(err || !strUser || strUser==""){
            $objMongoColls["maindb"]["user"].findOne({_id:strUserID},function(err,objUser){
                if(err){
                    funcCb(1001,null)
                }else{
                    objUser["_id"]=objUser["_id"].toHexString()
                    funcCb(0,objUser)
                }
            })
        }else{
            funcCb(0,JSON.parse(strUser))
        }
    })
}

$dao["cmn"]["insertAdminSession"]=function(req,objAdmin,funcCb){
    req.session.user=objAdmin
    req.user=objAdmin
    var strSessionKey=util.format("%s%s",strSessionPrefix,objAdmin["_id"])
    $redisClient.set(strSessionKey,req.sessionID,function(err,reply){
        if(err){
            funcCb(1004,null)
        }else{
            funcCb(0,objAdmin)
        }
    })
}

$dao["cmn"]["deleteAdminSessionBySID"]= function (req,funcCb) {
    var strSessionKey=util.format("%s%s",strSessionPrefix,req.user._id)
    $redisClient.del(strSessionKey,function(err,reply){
        if(err){
            funcCb(1003)
        }else{
            req.session.destroy()
            funcCb(0)
        }
    })
}

$dao["cmn"]["deleteAdminSessionByID"]=function(strID,funcCb){
    async.waterfall([
        function(cb){
            var sessionKey2=util.format("%s%s",strSessionPrefix,strID)
            $redisClient.get(sessionKey2,function(err,reply){
                if(err){
                    cb({errcode:1004},null)
                }else{
                    cb(null,util.format("%s%s",strSessionPrefix,reply),sessionKey2)
                }
            })
        },
        function(sessionKey1,sessionKey2,cb){
            $redisClient.get(sessionKey2,function(err,reply){
                if(err){
                    cb({errcode:1004},null)
                }else{
                    var obj=JSON.parse(reply)
                    for(var strKey in obj){
                        if(strKey!="cookie"){
                            delete obj[strKey]
                        }
                    }
                    $redisClient.set(sessionKey2,JSON.stringify(obj),function(err,reply){
                        if(err){
                            cb({errcode:1005},null)
                        }else{
                            cb(null,sessionKey1)
                        }
                    })
                }
            })
        },
        function(sessionKey1,cb){
            $redisClient.del(sessionKey1,function(err,reply){
                if(err){
                    cb({errcode:1003},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,objResult){
        if(err){
            funcCb(err["errcode"])
        }else{
            funcCb(0)
        }
    })
}
