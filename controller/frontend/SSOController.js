/**
 * Created by doucharles1 on 16/1/27.
 */
var util=require("util")
var async=require("async")
var _=require("underscore")
$load("MyUtil.js")
$load("Luosimao.js")
$load("Mailer.js")
var uuid=require("uuid")
var IM=$load("IM.js")

var arrRoutes=[
    ["get","mobile/identifyingcode",_identifyingcodeValidate,"$mobileValidate",getIdentifyingCode],
    ["post","mobile/registration","$mobileValidate","$isObjectBody","$isIdentifyingCodeValid","$imToken",userRegistration],
    ["post","mobile/login","$mobileValidate","$isObjectBody","$imToken",login],
    ["put","mobile/password1","$mobileValidate","$isObjectBody","$isIdentifyingCodeValid","$imToken",_isOldPasswordValid,resetPassword],
    ["put","mobile/password2","$mobileValidate","$isObjectBody","$isIdentifyingCodeValid","$imToken",resetPassword],
    ["get","web/identifyingcode",getWebIdentifyingCode],
    ["delete","logout","$mobileValidate",_logoutValidate,logout]
]

function SSOController(arrRoute,strRoutePrefix,strViewPrefix,strSubAppName){
    Controller.call(this,arrRoute,strRoutePrefix,strViewPrefix,strSubAppName)
}

util.inherits(SSOController,Controller)

var identifyingcodeColl=$objMongoColls[$objConfig["mongodb_maindb"]]["identifyingcode"]
var usersColl=$objMongoColls[$objConfig["mongodb_maindb"]]["user"]

function _identifyingcodeValidate(req,res,next){
    if(!req.query || req.query.purpose===undefined || req.query.purpose===null || typeof(req.query.purpose)!="number"){
        res.err("该接口必须提供有效的purpose查询选项.")
    }else{
        next()
    }
}

function getIdentifyingCode(req,res,next){
    req.query.id=req.query.id.toString()
    async.series([
        function(cb){
            if(req.query.id.indexOf("@")==-1){
                req.query.logintype=0
            }else{
                req.query.logintype=1
            }
            req.query.arrDtTodayCodes=[]
            identifyingcodeColl.findOne({_id:req.query.id},function(err,objResult){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    if(!objResult || !objResult["codes"] || !objResult["codes"][req.query.purpose.toString()]){
                        cb(null,null)
                    }else{
                        var arrCodes=objResult["codes"][req.query.purpose.toString()]
                        var intTodayCount=0
                        for(var i in arrCodes){
                            var oneCode=arrCodes[i]
                            var dtTime=oneCode["datetime"]
                            if($cmn["myutil"]["istoday"](dtTime)){
                                intTodayCount++
                                req.query.arrDtTodayCodes.push(oneCode)
                            }
                        }
                        if(intTodayCount>=$objConfig["subapp"]["sms"]["max_authcode_everyday"]){
                            cb({errcode:10000},null)
                        }else{
                            cb(null,null)
                        }
                    }
                }
            })
        },
        function(cb){
            var id=req.query.id
            var strCode=$cmn["myutil"]["identifyingcode"]({
                bitnum:6,
                end:9
            })
            req.query.identifyingcode=strCode
            var strMsg=$objConfig["subapp"]["sms"]["msg_template"].replace("{%verification_code%}",strCode)
            if(parseInt(req.query.logintype)==0){
                $cmn["sms"]["sendMsg"](id,strMsg,function(obj){
                    if(obj["error"]==0){
                       cb(null,null)
                    }else{
                        var objResult={errcode:obj["error"]}
                        cb(objResult,null)
                    }
                })
            }else if(parseInt(req.query.logintype)==1){
                $cmn["mailer"]["sendIdentifyingCode"](req.query.id,strCode,$objConfig["identifyingcode_purpose"][req.query.purpose.toString()],function(err,result){
                    if(err){
                        cb({errcode:1008},null)
                    }else{
                        cb(null,null)
                    }
                })
            }else{
                cb(null,null)
            }
        },
        function(cb){
            var objNewIdCode={code:req.query.identifyingcode,datetime:new Date()}
            req.query.arrDtTodayCodes.push(objNewIdCode)
            var strUpdateKey=util.format("codes.%s",req.query.purpose)
            var objUpdate={"$set":{}}
            objUpdate["$set"][strUpdateKey]=req.query.arrDtTodayCodes
            identifyingcodeColl.updateOne({_id:req.query.id},objUpdate,{upsert:true},function(err,objResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,results){
        if(err){
            res.err(err["errcode"])
        }else{
            res.json({identifyingcode:req.query.identifyingcode})
        }
    })
}

function getWebIdentifyingCode(req,res,next){
    var strCode=$cmn["myutil"]["identifyingcode"]()
    req.session["web_identifying_code"]=strCode
    res.json({imgcode:strCode})
}

/*
{
    _id:<ObjectID>,
    username:<string>,
    logintype:<int>     0 手机登录 1 邮箱登录 2 微信三方登录 3 QQ三方登录 4 微博三方登录
}
 */

function _defaultNickName(strUserName){
    if(strUserName.indexOf("@")!=-1){
        var arr=strUserName.split("@")
        var str1=strUserName.substr(0,1)
        var str2="******"
        return (str1+str2+"@"+arr[1])
    }else{
        var str1=strUserName.substr(0,3)
        var str2=strUserName.substr(7,11)
        var str3="****"
        return (str1+str3+str2)
    }
}

function userRegistration(req,res,next){
    if(req.body.id.indexOf("@")==-1){
        req.body.logintype=0
    }else{
        req.body.logintype=1
    }

    var userid=req.body.id
    var strPassword=req.body.password

    if(!userid){
        res.err("用户id必须给出.")
        return
    }
    if(!strPassword){
        res.err("用户密码必须给出.")
        return
    }

    var dtNow=new Date()
    var objInsert={
        username:userid,
        password:strPassword,
        dt_lastLogin:dtNow,
        dt_registration:dtNow,
        logintype:req.body.logintype,
        nickname:_defaultNickName(userid),
        img_headportrait:""
    }

    usersColl.count({username:userid},function(err,intCount){
        if(err){
            res.err(1001)
        }else if(intCount>0){
            res.err(1009)
        }else{
            usersColl.insertOne(objInsert,function(err,objResult){
                if(err){
                    res.err(1000)
                }else{
                    objInsert["dt_lastLogin"]=objInsert["dt_lastLogin"].getTime()
                    objInsert["dt_registration"]=objInsert["dt_registration"].getTime()
                    var _id_user=objResult["insertedId"].toHexString()
                    objInsert["_id"]=_id_user
                    $dao["cmn"]["insertUserSession"](req,_id_user,objInsert,function(errcode,sessionid){
                        if(errcode!=0){
                            res.err(errcode)
                        }else{
                            objInsert["sessionid"]=sessionid
                            IM.register(req.imToken,_id_user,strPassword,"",function(errcode){
                                if(errcode!=0){
                                    res.err(errcode)
                                }else{
                                    res.json(objInsert)
                                }
                            })
                        }
                    })
                }
            })
        }
    })
}

function login(req,res,next){
    var userid=req.body.id
    var password=req.body.password

    if(!userid){
        res.err("用户id必须给出.")
        return
    }
    if(!password){
        res.err("用户密码必须给出.")
        return
    }

    usersColl.findOne({username:userid},function(err,objUser){
        if(err){
            res.err(1001)
        }else if(!objUser){
            res.err(1010)
        }else{
            if(password!=objUser["password"]){
                res.err(1011)
            }else{
                async.waterfall([
                    function(cb){
                         var objDate=new Date()
                         objUser["dt_lastLogin"]=objDate.getTime()
                         objUser["dt_registration"]=objUser["dt_registration"].getTime()
                         var objUpdate={$currentDate:{dt_lastLogin:true}}
                         usersColl.updateOne({_id:objUser["_id"]},objUpdate,function(err,objResult){
                            if(err){
                                cb({errcode:1002},null)
                            }else{
                                objUser["_id"]=objUser["_id"].toHexString()
                                $dao["cmn"]["insertUserSession"](req,objUser["_id"],objUser,function(errcode,strSessionID){
                                    if(errcode!=0){
                                        cb({errcode:errcode},null)
                                    }else{
                                        objUser["sessionid"]=strSessionID
                                        cb(null,objUser)
                                    }
                                })
                            }
                        })
                    }
                ],function(err,objResult){
                    if(err){
                        res.err(err["errcode"])
                    }else{
                        res.json(objResult)
                    }
                })
               
            }
        }
    })
}

function _isOldPasswordValid(req,res,next){
    var oldPassword=req.body.oldpassword
    var userid=req.body.id
    if(!userid || !oldPassword){
        res.err(1053)
        return
    }
    usersColl.findOne({username:userid},{password:1},function(err,objUser){
        if(err){
            res.err(1001)
        }else{
            if(objUser["password"]!=oldPassword){
                res.err(1002)
            }else{
                next()
            }
        }
    })
}

function resetPassword(req,res,next){
    var password=req.body.password
    var userid=req.body.id

    if(!password || !userid){
        res.err(1053)
        return
    }

    usersColl.findOneAndUpdate({username:userid},{"$set":{"password":password}},{returnOriginal:false},function(err,objResult){
        if(err){
           res.err(1002)
        }else{
           var strUserID=objResult["value"]["_id"].toHexString()
           $dao["cmn"]["deleteUserSessionByID"](req,strUserID,function(errcode){
               if(errcode!=0){
                   res.err(errcode)
               }else{
                   IM.updatePassword(req.imToken,strUserID,password,function(errcode){
                       if(errcode!=0){
                           res.err(errcode)
                       }else{
                           res.json()
                       }
                   })
               }
           })
        }
    })
}

function _logoutValidate(req,res,next){
    var sid=req.get("x-sid")
    if(!sid){
        res.err("该接口必须提供http header:x-sid")
    }else{
        next()
    }
}

function logout(req,res,next){
    if(!req.isBrowser){
        req.sessionID=req.get("x-sid")
    }
    $dao["cmn"]["deleteUserSessionBySID"](req,function(errcode){
        if(errcode!=0){
            res.err(errcode)
        }else{
            res.json()
        }
    })
}

module.exports=new SSOController(arrRoutes,"sso","sso","")