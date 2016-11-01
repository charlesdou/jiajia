/**
 * Created by doucharles1 on 2016/10/1.
 */
var util=require("util")
var os=require("os")
var _=require("underscore")
var path=require("path")
var mkdirp=require("mkdirp")
mkdirp.sync(path.join(__dirname,"../log/access"))
mkdirp.sync(path.join(__dirname,"../log/error"))
var winston=require("winston")
winston.addColors($objConfig["log"]["colors"])
var WinstonLogger=winston.Logger
var WinstonContainer=winston.Container

var FileTransporter=require("winston-daily-rotate-file")
var accessFileConfig=_.extend(_.clone($objConfig["log"]["transports"]["file"]), {
    dirname:path.join(__dirname,"../log/access"),
    filename:"_access.log",
    level:"info"
})
var errorFileConfig=_.extend(_.clone($objConfig["log"]["transports"]["file"]),{
    dirname:path.join(__dirname,"../log/error"),
    filename:"_error.log",
    level:"error"
})
var criticalFileConfig=_.extend(_.clone($objConfig["log"]["transports"]["file"]),{
    dirname:path.join(__dirname,"../log/error"),
    filename:"_error.log",
    level:"crit",
    prettyPrint:true
})
var accessFileTransporter=new FileTransporter(accessFileConfig)
var errorFileTransporter=new FileTransporter(errorFileConfig)
var critFileTransporter=new FileTransporter(criticalFileConfig)

var MongodbTransporter=require("winston-mongodb").MongoDB
var accessConfig=_.extend($objConfig["log"]["transports"]["db"],{db:$objConfig["log_url"],collection:"access",level:"info"})
var dbAccessTransporter=new MongodbTransporter(accessConfig)
var errorConfig=_.extend($objConfig["log"]["transports"]["db"],{db:$objConfig["log_url"],collection:"error",level:"error"})
var dbErrorTransporter=new MongodbTransporter(errorConfig)

var MailTransporter=require("winston-mail").Mail
var mailTransporter=new MailTransporter($objConfig["log"]["transports"]["mail"])

var consoleTransporter=new (winston.transports.Console)($objConfig["log"]["transports"]["console"])

var logContainer=new WinstonContainer()
logContainer.add("access",{
    transports:[
        dbAccessTransporter,
        accessFileTransporter
    ]
})

logContainer.add("error",{
    transports:[
        dbErrorTransporter,
        errorFileTransporter
    ]
})

var arrMailLoggerTransports=[
    dbErrorTransporter,
    critFileTransporter
]
if($intAppMode==1){
    arrMailLoggerTransports.push(consoleTransporter)
}else{
    arrMailLoggerTransports.push(mailTransporter)
}
logContainer.add("alarm",{
    transports:arrMailLoggerTransports
})

$cmn["logger"]={}

var accessLogger=logContainer.get("access")
accessLogger.setLevels($objConfig["log"]["levels"])

var errorLogger=logContainer.get("error")
errorLogger.setLevels($objConfig["log"]["levels"])

var alarmLogger=logContainer.get("alarm")
alarmLogger.setLevels($objConfig["log"]["levels"])

function _meta(objReqRes){
    var obj={}
    var objReq=objReqRes
    if(objReqRes["req"]){
        objReq=objReqRes["req"]
        obj["res_status"]=objReqRes.statusCode
        obj["res_msg"]=objReqRes.statusMessage
        if(objReqRes.body && objReqRes.body.errcode){
            obj["res_errcode"]=objReqRes.body.errcocde
        }else if(objReqRes.body){
            obj["res_errcode"]=0
        }
        if(objReqRes.get("X-Response-Time")){
            obj["res_time"]=objReqRes.get("X-Response-Time")
        }
    }
    if(objReq.method){
        obj["req_method"]=objReq.method
    }
    if(objReq.path){
        obj["req_path"]=objReq.path
    }
    if(objReq.deviceAgent){
        obj["req_device"]=objReq.deviceAgent
    }
    if(objReq.cid){
        obj["req_user"]=objReq.cid
    }
    return obj
}

$cmn["logger"]["debug"]=function(req){
}

$cmn["logger"]["info"]=function(req){
    var allArgs=[]
    var len=arguments.length
    for(var i=1;i<len;i++){
        allArgs.push(arguments[i])
    }
    var strMsg="ok"
    if(allArgs.length>0){
        strMsg=util.format.apply(util,allArgs)
    }
    accessLogger.info(strMsg,_meta(req))
}

$cmn["logger"]["notice"]=function(req){
    var allArgs=[]
    var len=arguments.length
    for(var i=1;i<len;i++){
        allArgs.push(arguments[i])
    }
    var strMsg="ok"
    if(allArgs.length>0){
        strMsg=util.format.apply(util,allArgs)
    }
    accessLogger.notice(strMsg,_meta(req))
}

$cmn["logger"]["warning"]=function(req){
    var allArgs=[]
    var len=arguments.length
    for(var i=1;i<len;i++){
        allArgs.push(arguments[i])
    }
    var strMsg="ok"
    if(allArgs.length>0){
        strMsg=util.format.apply(util,allArgs)
    }
    accessLogger.warning(strMsg,_meta(req))
}

$cmn["logger"]["error"]=function(req){
    var allArgs=[]
    var len=arguments.length
    for(var i=1;i<len;i++){
        allArgs.push(arguments[i])
    }
    var strMsg="ok"
    if(allArgs.length>0){
        strMsg=util.format.apply(util,allArgs)
    }
    errorLogger.error(strMsg,_meta(req))
}

$cmn["logger"]["alert"]=function(req){
    var allArgs=[]
    var len=arguments.length
    for(var i=1;i<len;i++){
        allArgs.push(arguments[i])
    }
    var strMsg="ok"
    if(allArgs.length>0){
        strMsg=util.format.apply(util,allArgs)
    }
    alarmLogger.alert(strMsg,_meta(req))
}

$cmn["logger"]["crit"]=function(req){
    var allArgs=[]
    var len=arguments.length
    for(var i=1;i<len;i++){
        allArgs.push(arguments[i])
    }
    var strMsg="ok"
    if(allArgs.length>0){
        strMsg=util.format.apply(util,allArgs)
    }
    alarmLogger.crit(strMsg,_meta(req))
}

$cmn["logger"]["emerg"]=function(req){
    var allArgs=[]
    var len=arguments.length
    for(var i=1;i<len;i++){
        allArgs.push(arguments[i])
    }
    var strMsg="ok"
    if(allArgs.length>0){
        strMsg=util.format.apply(util,allArgs)
    }
    alarmLogger.emerg(strMsg,_meta(req))
}

$cmn["logger"]["catch"]=function(err){
    alarmLogger.emerg("The %s service has catched a emergent exception",$objConfig["app_name_en"],err)
}