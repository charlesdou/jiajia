/**
 * Created by doucharles1 on 16/3/24.
 */
var util=require("util")
var async=require("async")
var _=require("underscore")

var arrRoutes=[
    ["get","registration",showRegistrationPage],
    ["post","registration",register],
    ["post","login",login],
    ["get","login",showLoginPage],
    ["delete","logout","$auth",logout],
    ["get","password","$auth",passwordPage],
    ["put","password","$auth",updatePassword]
]

function SSOController(arrRoutes,strRouterPrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRouterPrefix,strViewPrefix,strSubApp)
}

util.inherits(SSOController,Controller)

function showRegistrationPage(req,res,next){
    this.show(res,"register")
}

function register(req,res,next){
    var self=this
    $dao["admin"]["registration"](req,function(errcode){
        if(errcode!=0){
            self.showerr(res,"register",errcode)
        }else{
            res.redirect("/")
        }
    })
}

function login(req,res,next){
    var self=this
    $dao["admin"]["login"](req,function(errcode){
        if(errcode!=0){
            self.showerr(res,"login",errcode)
        }else{
            res.redirect("/")
        }
    })
}

function showLoginPage(req,res,next){
    this.show(res,"login")
}

function logout(req,res,next){
    $dao["admin"]["logout"](req,function(errcode){
        res.json({})
    })
}

function passwordPage(req,res,next){
    this.show(res,"revisePassword")
}

function updatePassword(req,res,next){
    var self=this
    $dao["admin"]["resetPassword"](req,function(errcode){
        if(errcode!=0){
            self.showerr(res,"revisePassword",errcode)
        }else{
            res.redirect("/sso/login")
        }
    })
}


module.exports=new SSOController(arrRoutes,"sso","sso")