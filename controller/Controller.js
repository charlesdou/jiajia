/**
 * Created by dou on 15-5-25.
 */
var util=require("util")
var _=require("underscore")
var path=require("path").posix
var url=require("url")
$load("FileManager.js")
$load("MyUtil.js")
var ObjectID=require("mongodb").ObjectID
var IM=$load("IM.js")

function Controller(arrRoutes,routePrefix,viewPrefix,subapp){
    this.routePrefix=routePrefix || ""
    this.viewPrefix=viewPrefix || ""
    this.subApp=subapp || ""

    for(var i in arrRoutes){
        var arrRoute=arrRoutes[i]
        var intNum=parseInt(i)+1

        if(arrRoute.length<3){
            console.log(util.format("Route%d is invalid",intNum))
            process.exit(1)
        }

        var arrMethods=arrRoute[0].split(",")
        var prePath=path.join("/",this.routePrefix,arrRoute[1])
        if(!subapp){
            prePath=path.join($objConfig["apppath"],prePath)
        }

        var arrFuncHandlers=arrRoute.slice(2)
        for(var j in arrFuncHandlers){
            var func=arrFuncHandlers[j]
           if(typeof(func)=="function"){
               arrFuncHandlers[j]= _.bind(func,this)
           }else if(typeof(func)=="string"){
               arrFuncHandlers[j]= _.bind(this[func],this)
           }else{
               console.log(util.format("argument %d is invalid, they are only be function or string!",(parseInt(j)+1)))
               process.exit(1)
           }
        }
        arrFuncHandlers.unshift(prePath)
        for(var z in arrMethods){
            var strMethod=arrMethods[z]
            if(subapp){
                $routes[subapp][strMethod].apply($routes[subapp],arrFuncHandlers)
            }else{
                $app[strMethod].apply($app,arrFuncHandlers)
            }
        }
    }
}


Controller.prototype.show=function(res,filename,objOption){
    var strViewPrefix=""
    if(!$isBackstage){
        if(res.req.isPC){
            strViewPrefix="pc"
        }else if(res.req.isApp){
            strViewPrefix="app"
        }else{
            strViewPrefix="m"
        }
    }
    strViewPrefix=path.join(strViewPrefix,this.viewPrefix)
    var path1=path.join(strViewPrefix,filename)
    var objContext=res.locals
    if(objOption){
        objContext= _.extend(res.locals,objOption)
    }
    res.render(path1,objContext)
}

Controller.prototype.showerr=function(res,filename,errcode){
    var strViewPrefix=""
    if(!$isBackstage){
        if(res.req.isPC){
            strViewPrefix="pc"
        }else if(res.req.isApp){
            strViewPrefix="app"
        }else{
            strViewPrefix="m"
        }
    }
    strViewPrefix=path.join(strViewPrefix,this.viewPrefix)
    var path1=path.join(strViewPrefix,filename)
    var objContext=res.locals
    objContext= _.extend(objContext,{errmsg:$objConfig["errcode"][errcode.toString()]})
    res.render(path1,objContext)
}

var identifyingcodeColl=$objMongoColls[$objConfig["mongodb_maindb"]]["identifyingcode"]
Controller.prototype.$isIdentifyingCodeValid=function(req,res,next){
    var userid=req.body.id
    var identifyingcode=req.body.identifyingcode
    var purpose=parseInt(req.body.purpose)

    var objFilter={_id:userid}
    var strFields=util.format("codes.%d",purpose)
    var objField={_id:0}
    objField[strFields]=1

    if(req.isBrowser){
        if(req.session.web_identifying_code==identifyingcode) {
            next()
        }else{
            res.err(1000)
        }
    }else{
        identifyingcodeColl.findOne(objFilter,objField,function(err,objResult){
            if(err){
                res.err(1001)
                return
            }else{
                if(!objResult){
                    res.err(1010)
                    return
                }
                var arrObjCodes=objResult["codes"][purpose.toString()]
                var isFound=false
                for(var i in arrObjCodes){
                    var objTmp=arrObjCodes[i]
                    var strCode=objTmp["code"]
                    var ts=objTmp["datetime"]
                    var objDtNow=new Date()
                    var intNowTs=objDtNow.getTime()
                    var intDiff=intNowTs-ts
                    if(strCode==identifyingcode){
                        if(intDiff<=$objConfig["subapp"]["sms"]["code_expires"]){
                            isFound=true
                            break
                        }else{
                            res.err(1001)
                            return
                        }
                    }
                }
                if(!isFound){
                    res.err(1012)
                    return
                }else{
                    var strFilter=util.format("codes.%s",req.body.purpose)
                    var objFilter={"$set":{}}
                    objFilter["$set"][strFilter]=[]
                    identifyingcodeColl.updateOne({_id:req.body.id},objFilter,function(err,objResult){
                        if(err){
                            res.err(1003)
                            return
                        }else{
                            next()
                        }
                    })
                }
            }
        })
    }
}

Controller.prototype.$mobileValidate=function(req,res,next){
    if(!req.get("x-ua")){
        res.err("该接口必须提供http头x-ua.")
    }else{
        next()
    }
}

//req.cid
Controller.prototype.$auth=function(req,res,next){
    req.sessionID=req.get("x-sid")
    if(req.isBrowser){
        if($isBackstage){
            res.locals.user=req.user= req.session && req.session.user
            if(req.user){
                res.locals.user=req.user
                req.cid=req.user._id
                next()
            }else{
                res.redirect("/sso/login")
            }
        }else{
            req.cid=req.session.cid
            req.ocid=new ObjectID(req.cid)
            next()
        }
    }else{
        $redisClient.hget(req.sessionID,"cid",function(err,strUserID){
            if(err){
                res.err(1004)
            }else{
                if(!strUserID){
                    res.err(1015)
                }else{
                    req.cid=strUserID
                    req.ocid=new ObjectID(strUserID)
                    next()
                }
            }
        })
    }
}

Controller.prototype.$lefttree=function(req,res,next){
    res.locals.hasLeftTree=true
    res.locals.lefttree=$objConfig["lefttree"]
    res.locals.currentPath=req.path
    next()
}

//req.user
Controller.prototype.$user=function(req,res,next){
    var strSessionKey=util.format("%s%s.userprofile",$objConfig["session_prefix"],req.cid)
    $redisClient.get(strSessionKey,function(err,objUserProfile){
        if(err){
            res.err(1004)
        }else{
            req.user=JSON.parse(objUserProfile)
            req.user["_id"]=new ObjectID(req.user["_id"])
            next()
        }
    })
}

function _produceFilterObj(objQuery){
    var filterObj=undefined
    for(var strKey in objQuery){
        var value=objQuery[strKey]
        var intSplitUnderline=strKey.indexOf("_")
        var strPrefix=""
        var strMainField=""
        if(intSplitUnderline==-1 || strKey.indexOf("dt_")==0){
            strMainField=strKey
        }else{
            strPrefix="$"+strKey.substr(0,intSplitUnderline)
            strMainField=strKey.substr(intSplitUnderline+1)
        }
        if(strMainField.indexOf("dt_")==0){
            var tmp=new Date()
            value=tmp.setTime(value)
        }
        if(strPrefix!=""){
            if(!filterObj){
                filterObj={}
            }
            if(!filterObj[strMainField]){
                filterObj[strMainField]={}
            }
            filterObj[strMainField][strPrefix]=value
            if(strPrefix=="$regex"){
                filterObj[strMainField]["$options"]="mi"
            }
        }else{
            filterObj[strMainField]=value
        }
    }
    return filterObj
}

function isOpDescriptor(str){
    var intIndex=str.indexOf("_")
    if(intIndex==-1){
        return false
    }else{
        var str1=str.substr(0,intIndex)
        return str1=="gt" || str1=="gte" || str1=="lt" || str1=="lte" || str1=="regex" || str1=="ne" || str1=="regex" || str1=="sort" || str1=="in" || str1=="or" || str1=="nin"
    }
}

//req.filter
Controller.prototype.$filter=function(req,res,next){
    var objQuery=req.query
    req.filter={}
    req.sort={}
    for(var strKey in objQuery){
        if(strKey=="$or"){
            if(!req.filter){
                req.filter={}
            }
            if(!req.filter["$or"]){
                req.filter["$or"]=[]
            }
            for(var i in objQuery["$or"]){
                var obj=objQuery["$or"][i]
                req.filter["$or"].push(_produceFilterObj(obj))
            }
            continue
        }
        var value=objQuery[strKey]
        var intSplitUnderline=strKey.indexOf("_")
        var strPrefix=""
        var strMainField=""
        if(intSplitUnderline==-1 || strKey.indexOf("dt_")==0 || !isOpDescriptor(strKey)){
            strMainField=strKey
        }else{
            strPrefix="$"+strKey.substr(0,intSplitUnderline)
            strMainField=strKey.substr(intSplitUnderline+1)
        }
        if(strMainField.indexOf("dt_")==0 && strPrefix!="$sort"){
            var tmp=new Date()
            tmp.setTime(value)
            value=tmp
        }
        if(strPrefix!=""){
            if(strPrefix=="$sort"){
                if(!req.sort){
                    req.sort={}
                }
                if(!req.sort[strMainField]){
                    req.sort[strMainField]={}
                }
                req.sort[strMainField]=value
            }else{
                if(!req.filter){
                    req.filter={}
                }
                if(!req.filter[strMainField]){
                    req.filter[strMainField]={}
                }
                req.filter[strMainField][strPrefix]=value
                if(strPrefix=="$regex"){
                    req.filter[strMainField]["$options"]="mi"
                }
            }
        }else{
            req.filter[strMainField]=value
        }
    }
    next()
}

//req.form
Controller.prototype.$form=function(req,res,next){
    $cmn["file"].saveUploadFile(req,function(errcode,objForm){
        if(errcode!=0){
            res.err(errcode)
        }else{
            objForm=$cmn["myutil"]["parseJsonFromForm"](objForm)
            req.form=objForm
            req.body=objForm
            req.junkfiles=[]
            next()
        }
    })
}

//req.body
Controller.prototype.$body=function(req,res,next){
    var objHttpReqBody=req.body
    if(objHttpReqBody){
        objHttpReqBody=$cmn["myutil"]["parseJsonFromReq"](objHttpReqBody)
    }
    next()
}

//req.payment
Controller.prototype.$payment=function(req,res,next){
    var objPaymentBody=req.body
    objPaymentBody["order_no"]=req.params["orderno"] || new ObjectID()
    objPaymentBody["app"]={id:$objConfig["subapp"]["payment"]["app_id"]}
    objPaymentBody["currency"]="cny"
    objPaymentBody["client_ip"]="127.0.0.1"
    var objDefaultExtra=$objConfig["subapp"]["payment"]["channels"][objPaymentBody["channel"]]
    if(!_.isObject(objPaymentBody["extra"])){
        objPaymentBody["extra"]={}
    }
    objPaymentBody["extra"]=_.extend(objPaymentBody["extra"],objDefaultExtra)
    objPaymentBody["metadata"]["userid"]=req.cid
    req.payment=objPaymentBody
    next()
}

//req.refund
Controller.prototype.$refund=function(req,res,next){
    var objRefund=req.body
    objRefund["id"]=req.params.chargeid
    objRefund["metadata"]["userid"]=req.cid
    req.refund=objRefund
    next()
}

//req.imToken
Controller.prototype.$imToken=function(req,res,next){
    $dao["im"]["token"](function(errcode,strToken){
        if(errcode!=0){
            res.err(errcode)
        }else{
            req.imToken=strToken
            next()
        }
    })
}

//req.junkfiles
Controller.prototype.$cleanFile=function(req,res,next){
    var toDeleteFiles=req.junkfiles
    $cmn["file"].delete(toDeleteFiles,function(errcode){
        if(errcode!=0){
            console.log("Failed to clean junk files")
        }
    })
}

Controller.prototype.$isObjectBody=function(req,res,next){
    var objBody=req.body
    if(!objBody || !_.isObject(objBody) || _.keys(objBody).length==0){
        res.err(1052)
    }else{
        next()
    }
}

Controller.prototype.$isArrayBody=function(req,res,next){
    var objBody=req.body
    if(!objBody || !_.isArray(objBody) || objBody.length==0){
        res.err(1052)
    }else{
        next()
    }
}

Controller.prototype.$params=function(req,res,next){
    var objParam=req.params
    for(var strKey in objParam){
        if(strKey.indexOf("_id_")==0){
            objParam[strKey]=new ObjectID(objParam[strKey])
        }
    }
    next()
}

Controller.prototype.$sync=function (req,res,next) {
    req.body=req.body || {}
    var objBody=req.body
    if(objBody["dt"]){
        var date=new Date()
        date.setTime(parseInt(objBody["dt"]))
        objBody["dt"]=date
    }
    if(_.isArray(objBody["alreadySynced"])){
        for(var i in objBody["alreadySynced"]){
            objBody["alreadySynced"][i]=new ObjectID(objBody["alreadySynced"][i])
        }
    }
    next()
}

global.Controller=Controller
