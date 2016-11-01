var util=require("util")
var async=require("async")
var _=require("underscore")
var _s=require("underscore.string")
var ObjectID=require("mongodb").ObjectID
$load("MyUtil.js")
var path=require("path")
var arrRoutes=[
    ["post","","$auth","$form",submitOneDonation],
    ["get",":id/detail","$auth",queryOneDonation],
    ["get","stats/amount/num",donationUsageStats]
]

function DonationController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}
util.inherits(DonationController,Controller)

function submitOneDonation(req,res,next){
    var objForm=req.form
    objForm["proposed_person_id"]=req.cid
    $dao["donation"].insertOneDonation(req.form,function(errcode,objResult){
        if(errcode!=0){
            res.err(errcode)
        }else{
            res.json(objResult)
        }
    })
}

function queryOneDonation(req,res,next){
    var objDonationID=new ObjectID(req.params.id)
    $dao["donation"].detailOneDonation(objDonationID,function(errcode,objResult){
        if(errcode!=0){
            res.err(errcode)
        }else{
            res.json(objResult)
        }
    })
}

function donationUsageStats(req,res,next){
    res.json($dao["donation"]["DonationUsageStats"]())
}

module.exports=new DonationController(arrRoutes,"donation","donation","")