/**
 * Created by doucharles1 on 16/3/21.
 */
var path=require("path")
var fs=require("fs")
var arrStrFileName=fs.readdirSync(__dirname)

$dao["badge"]={}

for(var i in arrStrFileName){
    var strName=arrStrFileName[i]

    var strPath=path.join(__dirname,strName)
    require(strPath)
}