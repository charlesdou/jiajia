/**
 * Created by doucharles1 on 16/6/6.
 */
var util=require("util")
var path=require("path")
var fs=require("fs")
var mkdirp=require("mkdirp")

global.$cache={}
var strRootPath=__dirname

$cache.refresh=function(strDbName,strTableName,obj){
    var strResult=""
    if(obj){
       strResult=JSON.stringify(obj)
    }
    var strDir=path.join(strRootPath,strResult)
    mkdirp.sync(strDir)
    var strPath=path.join(strDir,strTableName)
    strPath+=".json"
    fs.writeFileSync(strPath,strResult)
}

$cache.load=function(strDbName,strTableName){
    var strDir=path.join(strRootPath,strDbName)
    mkdirp.sync(strDir)
    var strPath=path.join(strRootPath,strDbName,strTableName)
    strPath+=".json"
    if(fs.existsSync(strPath)){
        var strResult=fs.readFileSync(strPath)
        if(!strResult){
            return {}
        }else{
            return JSON.parse(strResult)
        }
    }else{
        return {}
    }
    return JSON.parse(fs.readFileSync(strPath))
}

