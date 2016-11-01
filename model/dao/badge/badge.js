/**
 * Created by doucharles1 on 16/3/21.
 */
var _=require("underscore")
var async=require("async")
var util=require("util")
var ObjectID=require("mongodb").ObjectID

objBadgeColl=$objMongoColls["maindb"]["badge"]

$dao["badge"]["insertOneBadge"]=function(objBadgeInfo,funcCb){
    objBadgeColl.insertOne(objBadgeInfo,function(err,objResult){
        if(err){
            funcCb(1000,null)
        }else{
            funcCb(0,objResult["insertedId"].toHexString())
        }
    })
}

$dao["badge"]["updateBadgeInfo"]= function (strBadgeId,objBadgeInfo,funcCb) {
    var objBadgeID=new ObjectID(strBadgeId)

    objBadgeColl.updateOne({_id:objBadgeID},{$set:objBadgeInfo},function(err,objResult){
        if(err){
            funcCb(1002)
        }else{
            funcCb(0)
        }
    })
}

$dao["badge"]["deleteOneBadge"]=function(strBadgeId,funcCb){
    var objBadgeId=new ObjectID(strBadgeId)

    objBadgeColl.deleteOne({_id:objBadgeId},function(err,objResult){
        if(err){
            funcCb(1003)
        }else{
            funcCb(0)
        }
    })
}

$dao["badge"]["queryOneByID"]=function(strBagdeID,funcCb){
    var objBadgeID=new ObjectID(strBagdeID)

    objBadgeColl.findOne({_id:objBadgeID},function(err,objResult){
        if(err){
            funcCb(1001,null)
        }else{
            funcCb(0,objResult)
        }
    })
}