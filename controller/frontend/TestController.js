var util=require("util")
var async=require("async")
var _=require("underscore")
var _s=require("underscore.string")
$load("MyUtil.js")
$load("logger.js")
var path=require("path")
var arrRoutes=[
    ["get","",test]
]

function TestController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}
util.inherits(TestController,Controller)

function test(req,res,next){
    res.send("abcde")
    res.on("finish",function(){
        var arr=["info","notice","warning","error","crit","alert","emerg"]
        for(var i in arr){
            $cmn["logger"][arr[i]](res,"%s says hallo world!","dcc")
        }
    })
}

module.exports=new TestController(arrRoutes,"test","test","")