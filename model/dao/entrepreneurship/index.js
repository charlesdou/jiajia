var path=require("path")
var fs=require("fs")
var arrStrFileName=fs.readdirSync(__dirname)

$dao["entrepreneurship"]={}
for(var i in arrStrFileName){
    var strName=arrStrFileName[i]
    var strPath=path.join(__dirname,strName)
    require(strPath)
} 