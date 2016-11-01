/**
 * Created by doucharles1 on 16/4/9.
 */
var util=require("util")
var async=require("async")
var _=require("underscore")
var ObjectID=require("mongodb").ObjectID
$load("MyUtil.js")

var arrRoutes=[
    ["post","","$form",submitDonation],
    ["put",":id","$form",updateDonation],
    ["get",":id/detail",queryOneDetail],
    ["post",":id/badge","$form",updateDonationBadge],
    ["put",":id/badge/:bid","$form",updateDonationBadge],
    ["get",":id",queryOneDetail],
    ["get",":page/:perpage","$filter",onePage],
    ["get",":id/badge/:bid/details",queryDonationBadge],
    ["post",":id/usage","$form",addDonationUsage],
    ["get",":id/usage/:page/:perpage","$filter",oneUsagePage],
    ["get","2/:page/:perpage","$filter",onePage2],
    ["get",":id/user/:page/:perpage","$filter",userDonationOnePage],
    ["get","stats/amount/num",donationUsageStats],
    ["put",":id/check",checkDonation]
]

function DonationController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}

util.inherits(DonationController,Controller)

function submitDonation(req,res,next){
    $dao["donation"]["insertOneDonation"](req.form,function(errcode,objResult){
        if(errcode!=0){
            res.err(errcode)
        }else{
            res.json(objResult)
        }
    })
}

function updateDonation(req,res,next){
    var objDonationID=new ObjectID(req.params.id)
    $dao["donation"]["updateOneDonation"](objDonationID,req.form,function(errcode){
        if(errcode){
            res.err(errcode)
        }else{
            res.json()
        }
    })
}

function updateDonationBadge(req,res,next){
    req.form["binding"]={collection:"donation",_id:new ObjectID(req.params.id)}
    req.form["type"]="活动徽章"
    var objBadgeID=null
    if(req.params.bid){
       objBadgeID=new ObjectID(req.params.bid)
    }
    $dao["donation"]["updateBadge"](new ObjectID(req.params.id),objBadgeID,req.form,_.bind(res.reply,res))
}

function queryOneDetail(req,res,next){
    $dao["donation"]["detailOneDonation"](new ObjectID(req.params.id),_.bind(res.reply,res))
}

function queryDonationBadge(req,res,next){
    $dao["donation"]["badgeDetail"](new ObjectID(req.params.id),new ObjectID(req.params.bid),_.bind(res.reply,res))
}

function checkDonation(req,res,next){

}

function onePage(req,res,next){
    if(!req.sort){
        req.sort["dt_publish"]=1
    }
    $dao["cmn"]["onepage"](
        "maindb",
        "donation",
        parseInt(req.params.perpage),
        parseInt(req.params.page),
        req.filter,
        {
            img_multi_posters:0,
            description:0,
            cur_donation_amount:0,
            cur_donation_num:0,
            cur_usage_amount:0,
            cur_usage_num:0
        },
        req.sort,
        _.bind(res.reply,res)
    )
}

function addDonationUsage(req,res,next){
    $dao["donation"]["insertDonationUsage"](new ObjectID(req.params.id),req.form,_.bind(res.reply,res))
}

function oneUsagePage(req,res,next){
    if(!req.sort){
        req.sort={dt_publish:1}
    }
    req.filter["_id_donation"]=new ObjectID(req.params.id)
    $dao["cmn"]["onepage"](
        "maindb",
        "donation_usage",
        req.params.perpage,
        req.params.page,
        req.filter,
        null,
        req.sort,
        _.bind(res.reply,res)
    )
}

function onePage2(req,res,next){
    if(!req.sort){
        req.sort["dt_publish"]=1
    }
    $dao["cmn"]["onepage"](
        "maindb",
        "donation",
        parseInt(req.params.perpage),
        parseInt(req.params.page),
        req.filter,
        {
            img_logo:1,
            subject:1,
            cur_donation_amount:1,
            cur_donation_num:1,
            cur_usage_amount:1,
            cur_usage_num:1
        },
        req.sort,
        _.bind(res.reply,res)
    )
}

function userDonationOnePage(req,res,next){
    req.filter["_id_orderno"]=new ObjectID(req.params.id)
    if(!req.sort){
        req.sort={dt_donation:1}
    }
    $dao["donation"]["userDonationOnePage"](req,_.bind(res.reply,res))
}

function donationUsageStats(req,res,next){
    res.json($dao["donation"]["DonationUsageStats"]())
}

module.exports=new DonationController(arrRoutes,"donation","donation")
