/**
 * Created by doucharles1 on 16/6/1.
 */
var util=require("util")
var async=require("async")
var _=require("underscore")
var _s=require("underscore.string")
var ObjectID=require("mongodb").ObjectID
$load("MyUtil.js")
var path=require("path")
var _$={
    valid:{},
    purchase:{},
    refund:{}
}

var arrRoutes=[
    ["post","purchase/:orderno","$auth","$payment",pay],
    ["post","refund/:chargeid","$auth","$refund",refund],
    ["post","callback",callback]
]

function PaymentController(arrRoutes,strRoutePrefix,strViewPrefix,subApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,subApp)
}
util.inherits(PaymentController,Controller)

function pay(req,res,next){
    if(!req.payment.metadata.valid){
        $dao["cmn"]["pay"](req.payment,null,function(errcode,charge){
            if(errcode){
                res.err(errcode)
            }else{
                res.json(charge)
            }
        })
    }else{
        _$["valid"][req.payment.metadata.valid](req,function(errcode){
            if(errcode!=0){
                res.err(errcode)
            }else{
                $dao["cmn"]["pay"](req.payment,null,function(errcode,charge){
                    if(errcode){
                        res.err(errcode)
                    }else{
                        res.json(charge)
                    }
                })
            }
        })
    }
}

function refund(req,res,next){
    if(!req.refund.metadata.valid){
        $dao["cmn"]["refund"](req.refund,function(errcode){
            if(errcode){
                res.err(errcode)
            }else{
                res.json()
            }
        })
    }else{
        _$["valid"][req.refund.metadata.valid](req,function(errcode){
            if(errcode!=0){
                res.err(errcode)
            }else{
                $dao["cmn"]["refund"](req.refund,function(errcode){
                    if(errcode){
                        res.err(errcode)
                    }else{
                        res.json()
                    }
                })
            }
        })
    }
}

function callback(req,res,next){
    var objBody=req.body
    var strEvent=objBody["type"]
    switch(strEvent){
        case "charge.succeeded":
            $dao["cmn"]["paycallback"](objBody,function(errcode,objCharge){
                if(errcode==0){
                    _$["purchase"][objCharge["metadata"]["logic_signature"]](objCharge,function(errcode){
                        if(errcode!=0){
                            console.log($objConfig["errcode"][errcode.toString()])
                        }
                    })
                }else{
                    console.log($objConfig["errcode"][errcode.toString()])
                }
            })
            break
        case "refund.succeeded":
            $dao["cmn"]["refundcallback"](objBody,function(errcode,objRefund){
                if(errcode==0){
                    _$["refund"][objCharge["metadata"]["logic_signature"]](objRefund,function(errcode){
                        if(errcode!=0){
                            console.log($objConfig["errcode"][errcode.toString()])
                        }
                    })
                }else{
                    console.log($objConfig["errcode"][errcode.toString()])
                }
            })
            break
        default:
            ;
    }
    res.send("")
}

module.exports=new PaymentController(arrRoutes,"","payment","payment")

//=========================================================================================================================================================
_$["valid"]["userDonateValidate"]=function(req,funcCb){
    $dao["donation"]["userDonateValidate"](req,funcCb)
}

_$["purchase"]["userDonate"]=function(objCharge,funcCb){
    $dao["donation"]["userDonate"](objCharge,funcCb)
}
