/**
 * Created by dcc on 2015/4/1.
 */
global.$dao={}
var fs=require("fs")
require("./common")
var arrStrFileName=fs.readdirSync(__dirname)

for(var i in arrStrFileName){
    var strFileName=arrStrFileName[i]
    strFileName="./"+strFileName
    require(strFileName)
}

