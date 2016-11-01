/**
 * Created by dcc on 2015/4/1.
 */
var fs=require("fs")
var path=require("path")
var util=require("util")
require("./Controller")
require("./PaymentController")

var arrFiles=fs.readdirSync(__dirname)
for(var i in arrFiles){
    var strFileName=arrFiles[i]

    if(((strFileName=="backstage") && !$isBackstage) || ((strFileName=="frontend") && $isBackstage)){
        delete arrFiles[i]
    }
}

for(var i in arrFiles){
    if(arrFiles[i] && arrFiles[i]!="Controller.js"){
        var path=util.format("./%s",arrFiles[i])
        require(path)
    }
}
