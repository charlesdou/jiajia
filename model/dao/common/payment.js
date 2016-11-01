var _=require("underscore")
var async=require("async")
var util=require("util")
var ObjectID=require("mongodb").ObjectID
var Timestamp=require("mongodb").Timestamp
$load("FileManager.js")
$load("MyUtil.js")
var _s=require("underscore.string")
var pingpp=require("pingpp")($objConfig["subapp"]["payment"]["api_key"])


$dao["cmn"]["pay"]=function(objBaseCharge,objExtraOption,funcCb){
    if(objExtraOption){
        switch(objBaseCharge["channel"]){
            case "alipay_pc_direct":
                objBaseCharge["extra"]["success_url"]=objExtraOption["success_url"]
                break
            case "alipay_wap":
                objBaseCharge["extra"]["success_url"]=objExtraOption["success_url"]
                objBaseCharge["extra"]["cancel_url"]=objExtraOption["cancel_url"]
                break
            case "wx_pub":
                objBaseCharge["extra"]["open_id"]=objExtraOption["open_id"]
                break
            case "wx_pub_qr":
                objBaseCharge["extra"]["product_id"]=objExtraOption["product_id"]
                break
            case "upacp_pc":
                objBaseCharge["extra"]["result_url"]=objExtraOption["result_url"]
                break
            case "upacp_wap":
                objBaseCharge["extra"]["result_url"]=objExtraOption["result_url"]
                break
            default:
                ;
        }
    }
    pingpp.charges.create(objBaseCharge,function(err,charge){
        if(err){
            funcCb(err,null)
        }else{
            var obj={_id:charge["id"],_id_orderno:new ObjectID(charge["order_no"]),userid:charge["metadata"]["userid"],amount:charge["amount"],paid:false,dt_sync:new Date()}
            $objMongoColls[charge["metadata"]["db"]][charge["metadata"]["collection"]].insert(obj,function(err,objResult){
                if(err){
                    funcCb(1000,null)
                }else{
                    funcCb(0,charge)
                }
            })
        }
    })
}

$dao["cmn"]["paycallback"]=function(objBody,funcCb){
    var objCharge=objBody["data"]["object"]
    $objMongoColls[objCharge["metadata"]["db"]][objCharge["metadata"]["collection"]].updateOne({
        "_id":objCharge["id"]
    },{
        $set:{
            paid:objCharge["paid"]
        },
        $currentDate:{
            dt_sync:true
        }
    },function(err,objResult){
        if(err){
            funcCb(1002,null)
        }else{
            funcCb(0,objCharge)
        }
    })
}

$dao["cmn"]["refund"]=function(objRefund,funcCb){
    var strChargeID=objRefund[""]
    delete objRefund["id"]
    pingpp.charges.createRefund(
        strChargeID,
        objRefund,
        function(err,refund){
            if(err){
                funcCb(err,null)
            }else{
                var obj={_id:refund.id,chargeid:refund["charge"],userid:refund["metadata"]["userid"],amount:refund["amount"],status:refund["status"],succeed:refund["succeed"],dt_sync:new Date()}
                $objMongoColls[refund["metadata"]["db"]][refund["metadata"]["collection"]].insert(obj,function(err,objResult){
                    if(err){
                        funcCb(1000)
                    }else{
                        funcCb(0)
                    }
                })
            }
        }
    )
}

$dao["cmn"]["refundcallback"]=function(objBody,funcCb){
    var objRefund=objBody["data"]["object"]
    $objMongoColls[objRefund["metadata"]["db"]][objRefund["metadata"]["collection"]].updateOne({
        _id:objRefund["id"]
    },{
        $set:{
            status:objRefund["status"],
            succeed:objRefund["succeed"]
        },
        $currentDate:{
            dt_sync:true
        }
    },function(err,objResult){
        if(err){
            funcCb(1002,null)
        }else{
            funcCb(0,objRefund)
        }
    })
}