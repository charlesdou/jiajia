/**
 * Created by doucharles1 on 16/3/27.
 */
var util=require("util")
var async=require("async")
var path=require("path")

var arrRoutes=[
    ["get","","$auth","$lefttree",showAdminPage],
    ["get",":page/:limit","$auth",adminOnePage],
    ["put",":id/password","$auth",resetAdminPassword],
    ["delete",":id/deregistration","$auth",deregistration]
]

function AdminController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}

util.inherits(AdminController,Controller)

function showAdminPage(req,res,next){
    this.show(res,"index")
}

function adminOnePage(req,res,next){
    var objFilter={}

    if(req.query._id){
        objFilter["_id"]=req.query._id
    }

    $dao["cmn"]["onepage"]("maindb","admin",req.params.limit,req.params.page,objFilter,{},{dt_registration:1},function(errcode,objResult){
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

function resetAdminPassword(req,res,next){
    $dao["admin"]["resetPassword1"](req,function(errcode){
        if(errcode!=0){
            res.err(errcode)
        }else{
            res.json({})
        }
    })
}

function deregistration(req,res,next){
    $dao["admin"]["deregistration"](req, function (errcode) {
        if(errcode!=0){
            res.err(errcode)
        }else{
            res.json({})
        }
    })
}

module.exports=new AdminController(arrRoutes,"admin","admin")