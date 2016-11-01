/**
 * Created by doucharles1 on 16/3/14.
 */
var _=require("underscore")
var util=require("util")
var async=require("async")
var ObjectID=require("mongodb").ObjectID
$load("MyUtil.js")
$dao["resume"]={}
$load("FileManager.js")

var objResumeColl=$objMongoColls["maindb"]["resume"]

/*
{
    "_id":<ObjectID>,
    "userid":<string>.,
    "name":<string>,
    "sex":<int>,  //0 男 1 女
    "degree":<int>, //0 大专 1 本科 2 硕士 3 博士
    "birthday":<int>, //YYYYMMDD
    "province":<string>,
    "phone":<string>,
    "email":<string>,
    "introduction":<string>, //一句话介绍自己
    "address":<string>
}
*/

$dao["resume"]["produceResume"]=function(objUserInfo,funcCb){
    var objInserted={}
    objInserted["img_headportrait"]=objUserInfo["img_headportrait"] || ""
    objInserted["userid"]=objUserInfo["_id"]
    objInserted["name"]=objUserInfo["name"]
    objInserted["sex"]=objUserInfo["sex"]
    objInserted["degree"]=objUserInfo["degree"]
    objInserted["birthday"]=objUserInfo["birthday"]
    objInserted["province"]=objUserInfo["province"]
    objInserted["address"]=objUserInfo["address"] || ""
    objInserted["introduction"]=objUserInfo["mono"] || ""
    objInserted["phone"]=$cmn["myutil"]["isPhone"](objUserInfo["_id"])?objUserInfo["_id"]:""
    objInserted["email"]=objUserInfo["email"] || ($cmn["myutil"]["isEmail"](objUserInfo["_id"])?objUserInfo["_id"]:"")
    objInserted["dt_create"]=new Date()
    objInserted["education"]=[]
    objInserted["skill"]=[]
    objInserted["job"]=[]
    objInserted["project"]=[]
    objInserted["expectation"]={
        "position":"",
        "city":"",
        "salary":0,
        "supplementary":""
    }

    objResumeColl.insertOne(objInserted,function(err,objResult){
        if(err){
            funcCb(1000,null)
        }else{
            objInserted["_id"]=objResult["insertedId"]
            funcCb(0,objInserted)
        }
    })
}

$dao["resume"]["updateResumeImg"]=function(objResumeID,strOldImgPath,objImgHeadportrait,funcCb){
    var _id=objResumeID
    var arrImgsToDelete=[]
    var objUpdate={"$set":objImgHeadportrait}
    async.series([
        function(cb){
            objResumeColl.updateOne({_id:_id},objUpdate,function(err,objResult){
                if(err){
                    arrImgsToDelete.push(objImgHeadportrait["img_headportrait"])
                    cb({errcode:1002},null)
                }else{
                    arrImgsToDelete.push(strOldImgPath)
                    cb(null,null)
                }
            })
        },
        function(cb){
            $cmn["file"].delete(arrImgsToDelete,function(errcode){
                if(errcode!=0){
                    cb({errcode:errcode},null)
                }else{
                    cb(null,null)
                }
            })
        }
    ],function(err,objResult){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            funcCb(0,objImgHeadportrait)
        }
    })
}

$dao["resume"]["updateSelfDescription"]=function(req,objResumeID,objSelfDescription,funcCb){
    objResumeColl.updateOne({_id:objResumeID},{$set:objSelfDescription},function(err,objResult){
        if(err){
            funcCb(1002)
        }else{
            funcCb(0)
        }
    })
}

$dao["resume"]["updateExpectation"]=function(req,objResumeID,objWorkExpect,funcCb){
    objResumeColl.updateOne({_id:objResumeID},{$set:{expectation:objWorkExpect}},function(err,objResult){
        if(err){
            funcCb(1002)
        }else{
            funcCb(0)
        }
    })
}

$dao["resume"]["insertArrayAttrbute"]=function(req,objResumeID,objInsert,funcCb){
    var id=new ObjectID()
    objInsert["id"]=id

    var objUpdate={$push:{}}
    objUpdate["$push"][req.params.attribute]=objInsert

    objResumeColl.updateOne({_id:objResumeID},objUpdate,function(err,objResult){
        if(err){
            funcCb(1002,null)
        }else{
            funcCb(0,{_id:id})
        }
    })
}

$dao["resume"]["updateArrayAttribute"]=function(req,objResumeID,objUpdate,funcCb){
    var strFieldName=req.params["attribute"]
    var id=req.params["id"]
    objUpdate["id"]=new ObjectID(id)
    var objFilter={_id:objResumeID}
    objFilter[util.format("%s.id",strFieldName)]=new ObjectID(id)

    var objUpdate1={$set:{}}
    objUpdate1["$set"][util.format("%s.$",strFieldName)]=objUpdate
    objResumeColl.updateOne(objFilter,objUpdate1,function(err,objResult){
        if(err){
            funcCb(1002)
        }else{
            funcCb(0)
        }
    })
}

$dao["resume"]["deleteArrayAttribute"]=function(req,objResumeID,funcCb){
    var strFildName=req.params["attribute"]
    var id=new ObjectID(req.params["id"])

    var objDelete={$pull:{}}
    objDelete["$pull"][strFildName]={}
    objDelete["$pull"][strFildName]["id"]=id

    objResumeColl.updateOne({_id:objResumeID},objDelete,function(err,objResult){
        if(err){
            funcCb(1002)
        }else{
            funcCb(0)
        }
    })
}

$dao["resume"]["queryResumeInfo"]=function(objResumeID,funcCb){
    objResumeColl.findOne({_id:objResumeID},function(err,objResult){
        if(err){
            funcCb(100)
        }else{
            funcCb(0,objResult)
        }
    })
}

$dao["resume"]["queryAllResumes"]=function(strUserID,funcCb){
    objResumeColl.find({userid:strUserID}).project({_id:1}).sort({dt_create:1}).toArray(function(err,arrResults){
        if(err){
            funcCb(1001,null)
        }else{
            var arr=[]
            for(var i in arrResults){
                arr.push(arrResults[i]["_id"])
            }
            funcCb(0,arr)
            //funcCb(0,arrResults)
        }
    })
}

$dao["resume"]["delResume"]=function(strUserID,strResumeID,funcCb){
    objResumeColl.findOne({_id:new ObjectID(strResumeID)},{_id:0,userid:1},function(err,rResult){
        if(err){
            funcCb(1001,null)
        }else if(!rResult){
            funcCb(10008,null)
        }else if(rResult["userid"].toHexString()!=strUserID){
            funcCb(10009,null)
        }else{
            objResumeColl.deleteOne({_id:new ObjectID(strResumeID)},function(err,delResult){
                if(err){
                    funcCb(1003,null)
                }else{
                    funcCb(0,null)
                }
            })
        }
    })
}

$dao["resume"]["updateBasic"]=function(strResumeID,objUpdated,funcCb){
    objResumeColl.updateOne({_id:new ObjectID(strResumeID)},{$set:objUpdated},function(err,updateResult){
        if(err){
            funcCb(1002,null)
        }else{
            funcCb(0,null)
        }
    })
}