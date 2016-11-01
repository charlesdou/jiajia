/**
 * Created by doucharles1 on 15/6/3.
 */
var fs=require("fs")
var path=require("path")
global.$COMMONDIR=__dirname
global.$cmn={}
global.$load=function(strModuleName) {
    var strPath=path.join($COMMONDIR,strModuleName)
    if(fs.existsSync(strPath)){
        return require(strPath)
    }else{
        console.log("Module:"+strPath+" is not existed!")
        process.exit(1)
    }
}