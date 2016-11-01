/**
 * Created by doucharles1 on 16/4/14.
 */
var argv = require('minimist')(process.argv.slice(2))
var create=require("./create.js")
var intState=create.envState(argv)
var strPlatform=create.platform(argv)


var boolIsFrontend=false
var boolAll=false

switch (intState){
    case 0:
        boolAll=true
        boolIsFrontend=false
        break
    case 1:
        boolAll=false
        boolIsFrontend=false
        break
    case 2:
        boolAll=false
        boolIsFrontend=true
        break
    default:
        boolAll=true
        boolIsFrontend=false
}

for(var i in argv["_"]){
    var strViewName=argv["_"][i]
    create.view(strViewName,boolIsFrontend,boolAll,strPlatform)
}
