/**
 * Created by doucharles1 on 16/4/9.
 */
var _=require("underscore")
var async=require("async")
var util=require("util")
var ObjectID=require("mongodb").ObjectID
var path=require("path")
$load("FileManager.js")
$load("MyUtil.js")

var objDonationColl=$objMongoColls["maindb"]["donation"]
var objBadgeColl=$objMongoColls["maindb"]["badge"]
var objDonationUserColl=$objMongoColls["maindb"]["donation_user"]
var objDonationUsageColl=$objMongoColls["maindb"]["donation_usage"]
var objUserColl=$objMongoColls["maindb"]["user"]

$dao["donation"]["_validateOneDonation"]=function(objDonationID,funcCb){
    objDonationColl.findOne({_id:objDonationID},function(err,objDonation){
        if(err){
            funcCb({errcode:1001},null)
        }else{
            var arrDeletedFiles=[]
            if(objDonation["img_logo"]){
                arrDeletedFiles.push(objDonation["img_logo"])
            }
            if(objDonation["img_multi_posters"] && _.isArray(objDonation["img_multi_posters"])){
                arrDeletedFiles=arrDeletedFiles.concat(objDonation["img_multi_posters"])
            }
            var now=new Date()
            var intNow=now.getTime()
            if(intNow>=objDonation["dt_end"].getTime()){
                arrDeletedFiles = []
            }
            funcCb(null,arrDeletedFiles)
        }
    })
}

$dao["donation"]["insertOneDonation"]=function(objDonation,funcCb){
    objDonation["dt_publish"]=objDonation["dt_sync"]=new Date()
    objDonation["state"]=0
    $dao["cmn"].insertOne("maindb","donation",objDonation,function(errcode,objInsertedID){
        funcCb(errcode,objInsertedID)
    })
}

$dao["donation"]["updateOneDonation"]=function(objDonationID,objUpdated,funcCb){
    objUpdated["dt_sync"]=new Date()
    async.waterfall([
        function(cb){
            $dao["donation"]._validateOneDonation(objDonationID,function(err,arrDeletedFiles){
                if(err){
                    cb({errcode:err["errcode"]},null)
                }else{
                    if(arrDeletedFiles.length==0){
                        arrDeletedFiles.push(objUpdated["img_logo"])
                        arrDeletedFiles.concat(objUpdated["img_multi_posters"])
                        cb(null,arrDeletedFiles,{state:1})
                    }else{
                        delete objUpdated["_id"]
                        objUpdated["state"]=0
                        cb(null,arrDeletedFiles,objUpdated)
                    }
                }
            })
        },
        function(arrFinalDeleteFiles,objFinalUpdated,cb){
            $cmn["file"].delete(arrFinalDeleteFiles,function(errcode){
                if(errcode){
                    cb({errcode:errcode},null)
                }else{
                    if(objFinalUpdated!=null){
                        objDonationColl.updateOne({_id:objDonationID},{$set:objFinalUpdated},function(err,objResult){
                            if(err){
                                cb({errcode:1002},null)
                            }else{
                                cb(null,null)
                            }
                        })
                    }else{
                        cb(null,null)
                    }
                }
            })
        }
    ],function(err,objResult){
        if(err){
            funcCb(err["errcode"])
        }else{
            funcCb(0)
        }
    })
}

$dao["donation"]["detailOneDonation"]=function(objDonationID,funcCb){
    objDonationColl.findOne({_id:objDonationID},function(err,objSearched){
        if(err){
            funcCb(1001,null)
        }else{
            funcCb(0,objSearched)
        }
    })
}

$dao["donation"]["userDonate"]=function(objCharge,funcCb){
    async.waterfall([
        function(cb){
            objDonationUserColl.count({userid:objCharge["metadata"]["userid"]},function(err,count){
                if(err){
                    cb({errcode:1001},false)
                }else{
                    if(count!=0){
                        cb(null,false)
                    }else{
                        cb(null,true)
                    }
                }
            })
        },
        function(boolUserDonated,cb){
            objUserColl.findOne({_id:objCharge["metadata"]["userid"]},{fields:{_id:0,img_:1,nickname:1}},function(err,objUser){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,boolUserDonated,objUser["img_headportrait"],objUser["nickname"])
                }
            })
        },
        function(boolUserDonated,strImg,strNickName,cb){
            var objUpdated={$inc:{cur_donation_amount:objCharge["amount"],cur_donation_loves:1}}
            if(!boolUserDonated){
                objUpdated["$inc"]["cur_donation_num"]=1
            }
            objUpdated["$set"]={
                img_user_headportrait:strImg,
                user_nickname:nickname
            }
            objDonationColl.findOneAndUpdate({_id:new ObjectID(objCharge["order_no"])},objUpdated,{returnOriginal:false},function(err,objResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    var objCache=$cache.load("donation","donation_usage_statistics")
                    if(!objCache["cur_donation_amount"]){
                        objCache["cur_donation_amount"]=0
                    }
                    if(!objCache["cur_donation_num"]){
                        objCache["cur_donation_num"]=0
                    }
                    if(!objCache["cur_donation_loves"]){
                        objCache["cur_donation_loves"]=0
                    }
                    objCache["cur_donation_amount"]+=objCharge["amount"]
                    ++objCache["cur_donation_num"]
                    ++objCache["cur_donation_loves"]
                    $cache.refresh("donation","donation_usage_statistics",objCache)
                    cb(null,null)
                }
            })
        }
    ],function(err,objResult){
        if(err){
            funcCb(err["errcode"])
        }else{
            funcCb(0)
        }
    })
}

$dao["donation"]["userDonateValidate"]=function(req,funcCb){
    var now=$cmn["myutil"]["now"]()
    objDonationColl.findOne({_id:new ObjectID(req.params.orderno)},{fields:{_id:0,state:1,dt_end:1}},function(err,objResult){
        if(err){
            funcCb(1001)
        }else if(objResult["state"]==1 || now>=objResult["dt_end"]){
            objDonationColl.updateOne({_id:new ObjectID(req.params.orderno)},{$set:{
                state:1
            }},function(err,objResult){
                if(err){
                    funcCb(1002)
                }else{
                    funcCb(11001)
                }
            })
        }else{
            funcCb(0)
        }
    })
}

$dao["donation"]["updateBadge"]=function(objDonationID,objBadgeID,objUpdated,funcCb){
    objUpdated["dt_sync"]=new Date()
    async.waterfall([
        function(cb){
            objDonationColl.findOne({_id:objDonationID},{fields:{_id:0,dt_end:1,badge:1,state:1}},function(err,objResult){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    var arrDeletedFiles=[]
                    if(objResult["badge"] && objResult["badge"]["img_logo"]){
                        arrDeletedFiles.push(objResult["badge"]["img_logo"])
                    }
                    var intNow=$cmn["myutil"]["now"]()
                    if(objResult["state"]==1 || intNow>=objResult["dt_end"]){
                        arrDeletedFiles=[objUpdated["img_logo"]]
                        cb(null,arrDeletedFiles,null)
                    }else{
                        cb(null,arrDeletedFiles,objUpdated)
                    }
                }
            })
        },
        function(arrDeletedFiles,objUpdated,cb){
            $cmn["file"]["delete"](arrDeletedFiles,function(errcode){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,objUpdated)
                }
            })
        },
        function(expired,objUpdated,cb){
            if(objUpdated){
                async.waterfall([
                    function(cb1){
                        delete objUpdated["_id"]
                        if(!objBadgeID){
                            objBadgeID=new ObjectID()
                        }
                        objBadgeColl.updateOne({_id:objBadgeID},{$set:objUpdated},{upsert:true},function(err,objResult){
                            if(err){
                                cb1({errcode:1002},null)
                            }else{
                                cb1(null,objBadgeID)
                            }
                        })
                    },
                    function(objBadgeID,cb2){
                        objDonationColl.updateOne({_id:objDonationID},{$set:{"badge._id":objBadgeID,"badge.img_logo":objUpdated["img_logo"]}},function(err,objResult){
                            if(err){
                                cb2({errcode:1002},null)
                            }else{
                                cb2(null,{_id:objBadgeID})
                            }
                        })
                    },
                ],function(err,objResult){
                    if(err){
                        cb(err,null)
                    }else{
                        cb(null,objResult)
                    }
                })
            }else{
                objDonationColl.updateOne({_id:objDonationID},{$set:{state:1}},function(err,objResult){
                    if(err){
                       cb({errcode:1002},null)
                    }else{
                       cb(null,null)
                    }
                })
            }
        }
    ],function(err,objResult){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            funcCb(0,objResult)
        }
    })
}

$dao["donation"]["badgeDetail"]=function(objDonationID,objBadgeID,funcCb){
    objBadgeColl.findOne({_id:objBadgeID},function(err,objResult){
        if(err){
            funcCb(1001,null)
        }else{
            funcCb(0,objResult)
        }
    })
}

$dao["donation"]["insertDonationUsage"]=function(objDonationID,objInserted,funcCb){
    objInserted["_id_donation"]=objDonationID
    objInserted["dt_publish"]=new Date()
    async.waterfall([
        function(cb){
            objDonationColl.findOne({_id:objDonationID},{fields:{_id:0,img_logo:1}},function(err,objResult){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,objResult["img_logo"])
                }
            })
        },
        function(strLogo,cb){
            objInserted["img_donation_logo"]=strLogo
            objDonationUsageColl.insertOne(objInserted,function(err,objResult){
                if(err){
                    cb({errcode:1000},null)
                }else{
                    cb(null,{_id:objResult["insertedId"]},objInserted["amount"])
                }
            })
        },
        function(objID,amount,cb){
            objDonationColl.findOneAndUpdate(
                {
                    _id:objDonationID
                },
                {
                    $inc:{cur_usage_amount:amount,cur_usage_num:1},
                    $currentDate:{dt_sync:true}
                },
                {returnOriginal:false},
                function(err,objResult){
                    if(err){
                        cb({errcode:1002},null)
                    }else{
                        var objCache=$cache.load("donation","donation_usage_statistics")
                        if(!objCache["cur_usage_amount"]) {
                            objCache["cur_usage_amount"]=0
                        }
                        if(!objCache["cur_usage_num"]){
                            objCache["cur_usage_num"]=0
                        }
                        objCache["cur_usage_amount"]+=amount
                        ++objCache["cur_usage_num"]
                        $cache.refresh("donation","donation_usage_statistics",objCache)
                        cb(null,objID)
                    }
                }
            )
        }
    ],function(err,objResult){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            funcCb(0,objResult)
        }
    })
}

$dao["donation"]["userDonationOnePage"]=function(req,funcCb){
    $cmn["onepage"].onepage(
        "maindb",
        "donation_user",
        parseInt(req.params.perpage),
        parseInt(req.params.page),
        req.filter,
        {paid:0},
        req.sort,
        funcCb
    )
}

$dao["donation"]["DonationUsageStats"]=function(){
    var obj=$cache.load("donation","donation_usage_statistics")
    if(!obj){
        obj={}
    }
    obj["cur_donation_amount"]=obj["cur_donation_amount"] || 0
    obj["cur_donation_num"]=obj["cur_donation_num"] || 0
    obj["cur_donation_loves"]=obj["cur_donation_loves"] || 0
    obj["cur_usage_amount"]=obj["cur_usage_amount"] || 0
    obj["cur_usage_num"]=obj["cur_usage_num"] || 0
    return obj
}