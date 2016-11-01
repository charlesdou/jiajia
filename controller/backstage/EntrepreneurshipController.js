var util=require("util")
var async=require("async")
var _=require("underscore")
var _s=require("underscore.string")
var ObjectID=require("mongodb").ObjectID
$load("MyUtil.js")
var path=require("path")
var arrRoutes=[
    ["post","test",insertRecord]
]

function EntrepreneurshipController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}
util.inherits(EntrepreneurshipController,Controller)

function insertRecord(req,res,next){
}

module.exports=new EntrepreneurshipController(arrRoutes,"entrepreneurship","entrepreneurship","")