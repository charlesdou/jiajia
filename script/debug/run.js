/**
 * Created by doucharles1 on 16/8/26.
 */
var path=require("path")
var fs=require("fs")
var url=require("url")
var _=require("underscore")
var _s=require("underscore.string")
var argv = require('minimist')(process.argv.slice(2))
var needle=require("needle")
var util=require("util")
var request=require("request")
var cookie=require("cookie")

var objCmnConfig=require("./configuration.json")
var arr=argv["_"][0].split("/")
var strDirName=arr[0]
var strFileName=arr[1]
var objRequest=require("./"+strDirName+"/"+strFileName)

var strEnvironment="development"
if(argv["demo"]){
    strEnvironment="demo"
}

var domain=argv["demo"]?objCmnConfig["demo"]["domain"]:objCmnConfig["development"]["domain"]
var port=argv["demo"]?objCmnConfig["demo"]["port"]:objCmnConfig["development"]["port"]
var rootPath=objCmnConfig["path"]
var protocal=(objRequest["protocal"] || objCmnConfig["protocal"] || "http")+":"
var method=objRequest["method"]
var urlPath=path.join(rootPath,strDirName,objRequest["path"])
var objPathParam=objRequest["params"]
for(var key in objPathParam){
    var strKey=":"+key
    urlPath=urlPath.replace(strKey,objPathParam[key])
}
var query=objRequest["query"]
var headers=_.extend(objCmnConfig["headers"],objCmnConfig[strEnvironment]["headers"],objRequest["headers"])
var type=objRequest["type"]
var reqBody=objRequest["req_body"]
var reqUrl=url.format({
    protocol:protocal,
    hostname:domain,
    port:port,
    pathname:urlPath,
    query:query
})
var cookies=_.extend(objCmnConfig["cookies"],objCmnConfig[strEnvironment]["cookies"],objRequest["cookies"])
var objOptions={open_timeout:0,read_timeout:0,compressed:true}
if(headers && _.keys(headers).length>0){
    objOptions["headers"]=headers
}
if(cookies && _.keys(cookies).length>0){
    objOptions["cookies"]=cookies
}

function handleResult(statusCode,statusMessage,body){
    if(!body){
        body=""
    }
    objRequest["statusCode"]=statusCode
    objRequest["statusMessage"]=statusMessage
    objRequest["res_body"]=body
    fs.writeFileSync(__dirname+"/"+strDirName+"/"+strFileName+".json",JSON.stringify(objRequest,function(key,value){
        return value
    },2))
    var strConsole=util.format("%s:%s %s\n%s\n",argv["_"][0],statusCode,statusMessage,JSON.stringify(body,function(key,value){
        return value
    },2))
    console.log(strConsole)
}

function toFormBody(obj){
    if(!_.isObject(obj)){
        console.log("form body format not valid.")
        return
    }else{
        var objReturn={}
        for(var key in obj){
            var tmp=obj[key]

            var regExp=/^((img)|(audio)|(video))_/
            if(regExp.test(key)){
                if(_.isString(tmp)){
                    objReturn[key]=fs.createReadStream(tmp)
                }else if(_.isArray(tmp)){
                    objReturn[key]=[]
                    for(var i in tmp){
                        var tmp2=tmp[i]
                        if(_.isString(tmp2)){
                            objReturn[key][i]=fs.createReadStream(tmp2)
                        }else{
                          console.log("form body format not valid.")
                          return  
                        }
                    }
                }
            }else{
                objReturn[key]=tmp
            }
        }
        return objReturn
    }
}

if(method=="get" || method=="head"){
    needle[method](reqUrl,objOptions,function(err,res,body){
        handleResult(res.statusCode,res.statusMessage,body)
    })
}else if(method=="post" || method=="put" || method=="delete" || method=="patch"){
    if(!type || type=="json"){
        objOptions["json"]=true
        needle[method](reqUrl,reqBody,objOptions,function(err,res,body){
            if(err){
                console.log(err)
            }else{
                handleResult(res.statusCode,res.statusMessage,body)
            }
        })
    }else if(type=="form"){
        var objFormRequestOption={
            method:method.toUpperCase(),
            url:reqUrl,
            headers:headers,
            formData:toFormBody(reqBody),
            timeout:3600000
        }

        if(!_.isEmpty(cookies)){
            var j = request.jar();
            var strCookie=""
            for(var strKey in cookies){
                strCookie+=cookie.serialize(strKey,cookies[strKey])+"; "
            }
            strCookie=strCookie.substr(0,strCookie.length-2)
            var objCookie = request.cookie(strCookie);
            j.setCookie(objCookie,reqUrl)
            objFormRequestOption["jar"]=j
        }

        request(objFormRequestOption,function(err,res,body){
            if(err){
                console.log(err)
            }else{
                handleResult(res.statusCode, res.statusMessage, JSON.parse(body))
            }
        })
    }else{
        console.log(util.format("The format type of request body is not surpported"))
    }
}else{
    console.log(util.format("The request method:%s is not surpported",method))
}
