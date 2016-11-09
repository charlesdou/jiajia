var util=require("util")
var async=require("async")
var _=require("underscore")
var _s=require("underscore.string")
var ObjectID=require("mongodb").ObjectID
$load("MyUtil.js")
var path=require("path")
var arrRoutes=[
    ["get","","$auth",getMainPage]
]

function WeiboController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}
util.inherits(WeiboController,Controller)

function getMainPage(req,res,next){

}

module.exports=new WeiboController(arrRoutes,"weibo","weibo","")