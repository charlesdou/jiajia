/**
 * Created by doucharles1 on 16/4/14.
 */
var argv = require('minimist')(process.argv.slice(2))
var create=require("./create.js")
var intState=create.envState(argv)
var boolIsAll=true
var boolIsBackStage=false
var boolIsFrontend=false
var strPlatform=create.platform(argv)

switch (intState){
    case 0:
        boolIsAll=true
        boolIsBackStage=false
        boolIsFrontend=false
        break
    case 1:
        boolIsAll=false
        boolIsBackStage=true
        boolIsFrontend=false
        break
    case 2:
        boolIsAll=false
        boolIsBackStage=false
        boolIsFrontend=true
        break
    default:
        boolIsAll=true
        boolIsBackStage=false
        boolIsFrontend=false
}



for(var i in argv["_"]){
    var name=argv["_"][i]
    create.controller(name,boolIsBackStage,boolIsAll)
    create.dao(name)
    create.view(name,boolIsFrontend,boolIsAll,strPlatform)
}