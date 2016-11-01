/**
 * Created by doucharles1 on 16/3/25.
 */
var util=require("util")
var ObjectID=require("mongodb").ObjectID
var arrRoutes=[
    ["get","","$auth","$lefttree",showIndexPage]
]


function HomeController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}

util.inherits(HomeController,Controller)

function showIndexPage(req,res,next){
    this.show(res,"index",{})
}

module.exports=new HomeController(arrRoutes,"","")
