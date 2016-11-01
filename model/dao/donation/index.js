/**
 * Created by doucharles1 on 16/4/9.
 */
var path=require("path")
var fs=require("fs")
var arrStrFileName=fs.readdirSync(__dirname)

$dao["donation"]={}

for(var i in arrStrFileName){
    var strName=arrStrFileName[i]

    var strPath=path.join(__dirname,strName)
    require(strPath)
}