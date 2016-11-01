/**
 * Created by doucharles1 on 16/3/21.
 */
var util=require("util")
var async=require("async")
var _=require("underscore")
$load("FileManager.js")

var arrRoutes=[
    ["post","",insertBadge],
    ["put",":id",updateBadge],
    ["delete",":id",deleteOneBadge],
    ["get",":id",queryOneBadge]
]


function BadgeController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}

util.inherits(BadgeController,Controller)

function insertBadge(req,res,next){
    async.waterfall([
        function(cb){
            $cmn["file"].saveUploadFile(req,function(err,objFile){
                if(err){
                    cb({errcode:err},null)
                }else{
                    cb(null,objFile)
                }
            })
        },
        function(objFile,cb){
            objFile["img_logo"]=objFile["img_logo"] || objFile["img_logo"][0]
            objFile["integral"]=parseInt(objFile["integral"])
            objFile["dt_create"]=new Date()

            $dao["badge"]["insertOneBadge"](objFile,function(err,id){
                if(err){
                    cb({errcode:err},null)
                }else{
                    cb(null,id)
                }
            })
        }
    ],function(err,objReult){
        if(err){
            res.err(err["errcode"])
        }else{
            res.json({_id:objReult})
        }
    })
}

function updateBadge(req,res,next){
    async.waterfall([
        function(cb){
            $cmn["file"].saveUploadFile(req,function(errcode,objFile){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,objFile)
                }
            })
        },
        function(objFile,cb){
            $objMongoColls["maindb"]["badge"].findOne({_id:req.body._id},{_id:0,img_badge:1},function(err,objResult){
                if(err!=0){
                    cb({errcode:1001},null,null)
                }else{
                    cb(null,objFile,objResult["img_badge"])
                }
            })
        },
        function(objFile,strDeleteUrl,cb){
            $cmn["file"].delete([strDeleteUrl],function(err){
                if(err!=0){
                    cb({errcode:err},null)
                }else{
                    cb(null,objFile)
                }
            })
        },
        function(objFile,cb){
            $dao["badge"]["updateOneBadgeInfo"](req.query.id,objFile,function(errcode){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,objResult){
        if(err){
            res.err(err["errcode"])
        }else{
            res.json()
        }
    })
}

function deleteOneBadge(req,res,next){
    async.waterfall([
        function(cb){
            $cmn["file"].delete([req.body.img_badge],function(errcode){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,null)
                }
            })
        },
        function(objResult,cb){
            $dao["badge"]["deleteOneBadge"](req.params.id,function(errcode){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,objResult){
        if(err){
            res.err(err["errcode"])
        }else{
            res.json()
        }
    })
}

function queryOneBadge(req,res,next){
    $dao["badge"]["queryOneByID"](req.params.id,function(err,objResult){
        if(err!=0){
            res.err(err)
        }else{
            res.json(objResult)
        }
    })
}

module.exports=new BadgeController(arrRoutes,"badge","badge")