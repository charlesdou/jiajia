/**
 * Created by doucharles1 on 16/3/8.
 */
var _=require("underscore")
var util=require("util")
var http=require("http")
$load("MyUtil.js")
$load("FileManager.js")
$load("logger.js")
var async=require("async")



http.ServerResponse.prototype.err=function(error){
    var obj=null
    if(typeof(error)=="string"){
        obj={errmsg:error}
    }else if(typeof(error)=="number"){
        obj={errcode:error,errmsg:$objConfig["errcode"][error.toString()]}
    }else if(_.isObject(error)){
        obj=error
    }else{
        obj={errcode:-1,errmsg:"未知的错误"}
    }
    this.json(obj)
}

function _treatment(res,errcode){
    async.parallel([
        function(cb){
            if(errcode==null || errcode==undefined || (errcode && (errcode==0))){
                $cmn["logger"]["info"](res)
                cb(null,null)
            }else{
                cb(null,null)
            }
        },
        function(cb){
            var arrJunkFiles=res.req.junkfiles
            if(_.isArray(arrJunkFiles) && arrJunkFiles.length>0){
                $cmn["file"].delete(arrJunkFiles,function(errcode){
                    if(errcode!=0){
                        cb(null,null)
                    }else{
                        cb(null,null)
                    }
                })
            }else{
                cb(null,null)
            }
        }
    ],function(err,arrParallelResults){
        ;
    })
}

http.ServerResponse.prototype.reply=function (errcode,objResult) {
    if(errcode && _.isObject(errcode) && typeof(errcode["errcode"])=="number"){
        this.err(errcode["errcode"])
    }else if(errcode!=0 && errcode) {
        this.err(errcode)
    }else{
        if(objResult){
            this.json($cmn["myutil"]["parseJsonToRes"](objResult))
        }else{
            this.json("")
        }
    }
    _treatment(this,errcode)
}


