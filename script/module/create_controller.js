/**
 * Created by doucharles1 on 16/4/14.
 */
var argv = require('minimist')(process.argv.slice(2))
var create=require("./create.js")
var boolIsBackstage=false
var boolAll=false
var intState=create.envState(argv)

switch (intState){
    case 0:
        boolAll=true
        boolIsBackstage=false
        break
    case 1:
        boolAll=false
        boolIsBackstage=true
        break
    case 2:
        boolAll=false
        boolIsBackstage=false
        break
    default:
        boolAll=true
        boolIsBackstage=false
}

for(var i in argv["_"]){
    var strControllerName=argv["_"][i]
    create.controller(strControllerName,boolIsBackstage,boolAll)
}