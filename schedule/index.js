/**
 * Created by dcc on 2015/4/1.
 */
var fs=require("fs")
var util=require("util")


global.$funcMapReduce2=function(){

}

var arrRequiredDir=fs.readdirSync(__dirname)

for(var i in arrRequiredDir){
    var name=arrRequiredDir[i]
    var path=util.format("./%s",name)
    if(fs.statSync(path).isDirectory()){
        require(path)
    }
}
