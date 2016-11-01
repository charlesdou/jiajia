/**
 * Created by doucharles1 on 16/3/27.
 */
var util=require("util")
var async=require("async")
var path=require("path")
var _=require("underscore")

var arrRoutes=[
    ["get","","$auth","$lefttree",showUserPage],
    ["get","page/:page/:limit","$auth",userOnePage],
    ["get","details/:id","$auth","$lefttree",userDetails],
    ["get","resume/:id","$auth","$lefttree",userResume],
    ["put","authpass/:id","$auth",authPass]
]
function UserController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}

util.inherits(UserController,Controller)

function showUserPage(req,res,next){
    this.show(res,"index")
}

function userOnePage(req,res,next){
    var pageNum=parseInt(req.params.page)
    var numPerPage=parseInt(req.params.limit)
    var objFilter={}
    if(req.query._id){
        objFilter["_id"]=req.query._id
    }
    if(req.query.state){
        objFilter["authentication_state"]=parseInt(req.query.state)
    }
    $dao["cmn"]["onepage"]("maindb","user",numPerPage,pageNum,objFilter,{
        dt_registration:1,
        dt_lastLogin:1,
        authentication_state:1,
        integral:1
    },{dt_registration:1},function(errcode,objResult){
        if(errcode!=0){
            res.err(errcode)
        }else{
            for(var i in objResult["data"]){
                var objTmp=objResult["data"][i]
                objTmp["dt_registration"]=objTmp["dt_registration"].getTime()
                objTmp["dt_lastLogin"]=objTmp["dt_lastLogin"].getTime()
            }
            res.json(objResult)
        }
    })
}

function userDetails(req,res,next){
    var self=this
    $dao["cmn"]["queryUserProfileByID"](req.params.id,function(errcode,objUserProfile){
        if(errcode==0){
            self.show(res,"profile",objUserProfile)
        }else{
            self.showerr(res,"profile",errcode)
        }
    })
}

function userResume(req,res,next){
    var self=this
    $dao["resume"]["queryResumeInfo"](req.params.id,function(errcode,objResumeInfo){
        if(errcode!=0){
            self.showerr(res,"resume",errcode)
        }else{
            self.show(res,"resume",objResumeInfo)
        }
    })
}

function authPass(req,res,next){
    $dao["user"]["authPass"](req,function(errcode){
        if(errcode!=0){
            res.err(errcode)
        }else{
            res.json({})
        }
    })
}

module.exports=new UserController(arrRoutes,"user","user")