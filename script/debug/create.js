/**
 * Created by doucharles1 on 16/8/26.
 */
var path=require("path")
var mkdirp=require("mkdirp")
var fs=require("fs")
var argv = require('minimist')(process.argv.slice(2))

var strModuleName=argv["_"][0]
var strRootDir=path.join(__dirname,strModuleName)
mkdirp.sync(strRootDir)

var count=argv["_"].length
for(var i=1;i<count;i++){
    var strTemp=argv["_"][i]
    var strFileName=path.join(strRootDir,strTemp+".json")
    var obj={
        description:"",
        protocol:"",
        method:"",
        path:"",
        params:{
        },
        query:{
        },
        headers:{
        },
        cookies:{
        },
        type:"json",
        req_body:{
        },
        statusCode:200,
        statusMessage:"OK",
        res_body:""
    }
    var str=JSON.stringify(obj,function (key,value) {
        return value
    },2)
    fs.writeFileSync(strFileName,str)
}

