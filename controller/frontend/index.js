/**
 * Created by doucharles1 on 16/3/24.
 */
var fs=require("fs")
var path=require("path")
var util=require("util")

var arrFiles=fs.readdirSync(__dirname)
for(var i in arrFiles){
    var path=util.format("./%s",arrFiles[i])
    require(path)
}