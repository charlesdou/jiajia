/**
 * Created by doucharles1 on 16/3/14.
 */
var util=require("util")
var async=require("async")
var path=require("path")
$load("FileManager.js")
var _=require("underscore")

var arrRoutes=[
    ["put","headportrait","$auth","$user","$form",updateHeadPotrait],
    ["put","profile","$auth","$user","$imToken",updateProfile],
    ["put","authentication","$auth","$user","$form",userAuthentication],
    ["put","authentication/verify/:id","$auth","$user",userAuthVerify],
    ["get","details","$auth","$user",userDetails]
]

function UserController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}

util.inherits(UserController,Controller)


function updateProfile(req,res,next){
    $dao["user"]["updateProfile"](req,req.ocid,req.body,_.bind(res.reply,res))
}

function userAuthentication(req,res,next){
    $dao["user"]["authentication"](req,req.form,_.bind(res.reply,res))
}

function userAuthVerify(req,res,next){
    if(req.user.authentication_state==1){
        res.err(10003)
    }else{
        $dao["user"]["authPass"](req,function(errcode){
            if(errcode!=0){
                res.err(errcode)
            }else{
                res.json()
            }
        })
    }
}

function userDetails(req,res,next){
    var objUserDetail={
        img_headportrait:"",
        nickname:"",
        signature:"",
        name:"",
        birthday:0,
        sex:0,
        university:"",
        majority:"",
        degree:0,
        moto:"",
        permission_level:0,
        province:"",
        qq:"",
        phone:"",
        email:"",
        blog:"",
        address:""
    }
    if(req.user.logintype==0){
        objUserDetail["phone"]=req.user["username"]
    }else if(req.user.logintype==1){
        objUserDetail["email"]=req.user["username"]
    }
    res.json(_.extend(objUserDetail,req.user))
}

function updateHeadPotrait(req,res,next){
    $dao["user"]["updateHeadportrait"](req,req.ocid,req.user["img_headportrait"],req.form,_.bind(res.reply,res))
}

module.exports=new UserController(arrRoutes,"user","user")