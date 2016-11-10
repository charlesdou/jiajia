/**
 * Created by doucharles1 on 16/3/10.
 */
var _=require("underscore")
var async=require("async")

var ObjectID=require("mongodb").ObjectID
$dao["cmn"]={}

$dao["cmn"]["sync"]=function(strDb,strColl,objFilter,objProj,objSort,syncCount,funcCb){
    if(!objFilter || !_.isObject(objFilter) || !objSort || !_.isObject(objSort) || !syncCount || !_.isNumber(syncCount)){
        funcCb({errcode:1055},null)
    }else{
        var objCursor=$objMongoColls[strDb][strColl].find(objFilter)
        if(objProj){
            objCursor.project(objProj)
        }
        objCursor.sort(objSort)
        objCursor.limit(syncCount).toArray(function(err,rResults){
            if(err){
                funcCb({errcode:1001},null)
            }else{
                funcCb(null,rResults)
            }
        })
    }
}

/*
options:{
    db:"maindb",
    coll:"",
    tsName:"dt_publish",
    dt:0,
    alreadySynced:[
    ],
    syncCount:100,
    extraFilter:{},
    projection:{},
    down:true,
    descending:true
}
*/
$dao["cmn"]["upOrDownGestureSync"]=function(objOptions,funcCb){
    if(!objOptions["coll"] || !_.isString(objOptions["coll"]) || !_.isDate(objOptions["dt"]) || !_.isBoolean(objOptions["down"])){
        funcCb(1056,null)
    }else{
        var strDb=objOptions["strDb"] || "maindb"
        var strColl=objOptions["coll"]
        var strTsName=objOptions["tsName"] || "dt_publish"
        var dtTs=objOptions["dt"]
        var arrAlreadySynced=(_.isArray(objOptions["alreadySynced"]) && objOptions["alreadySynced"]) || []
        var intSyncCount=(_.isNumber(objOptions["syncCount"]) && objOptions["syncCount"]) || 100
        var objExtraFilter=(_.isObject(objOptions["extraFilter"]) && objOptions["extraFilter"]) || {}
        var objProj=(_.isObject(objOptions["projection"]) && objOptions["projection"]) || {}
        var isDown=true
        if(objOptions["down"]===false){
            isDown=false
        }
        var descending=true
        if(objOptions["descending"]===false){
            descending=false
        }
        

        if(isDown){
            dtTs=new Date()
            if(!descending){
                dtTs.setTime(0)
            }
        }
        if(descending){
            objExtraFilter[strTsName]={$lte:dtTs}
        }else{
            objExtraFilter[strTsName]={$gte:dtTs}
        }
        if(arrAlreadySynced.length!=0){
           objExtraFilter["_id"]={$nin:arrAlreadySynced} 
        }
        
        var objSort={}
        objSort[strTsName]=-1
        if(!descending){
            objSort[strTsName]=1
        }

        var objCursor=$objMongoColls[strDb][strColl].find(objExtraFilter)
        if(objProj && _.isObject(objProj) && _.keys(objProj)!=0){
            objCursor=objCursor.project(objProj)
        }
        objCursor.sort(objSort).limit(intSyncCount).toArray(function(err,rResults){
            if(err){
                funcCb(1001,null)
            }else{
                funcCb(0,rResults)
            }
        })
    }
}

$dao["cmn"]["onepage"]=function(strDbName,strCollectionName,perPage,page,objFilter,objField,objSort,funcCb){
    async.waterfall([
        function(cb){
            $objMongoColls[strDbName][strCollectionName].count(objFilter,function(err,totalRecords){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    var intTotalPages=(((totalRecords%perPage)!=0) ? parseInt(totalRecords/perPage)+1 : parseInt(totalRecords/perPage))
                    cb(null,intTotalPages)
                }
            })
        },
        function(intTotalPage,cb){
            if(!objFilter){
                objFilter={}
            }
            var intSkip=(page-1)*perPage
            var objChain=$objMongoColls[strDbName][strCollectionName].find(objFilter)
            if(objField){
                objChain=objChain.project(objField)
            }
            objChain.sort(objSort).skip(intSkip).limit(perPage).toArray(function(err,results){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    var objResult={
                        totalPage:intTotalPage,
                        data:results
                    }
                    cb(null,objResult)
                }
            })
        }
    ],function(err,result){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            funcCb(0,result)
        }
    })
}

$dao["cmn"].insertOne=function(strDbName,strCollName,objInserted,funcCb){
    $objMongoColls[strDbName][strCollName].insertOne(objInserted,function(err,objResult){
        if(err){
            funcCb(1000,null)
        }else{
            funcCb(0,{_id:objResult["insertedId"].toHexString()})
        }
    })
}

$dao["cmn"].queryByID=function(strDbName,strCollName,id,objProject,funcCb){
    var objID=new ObjectID(id)

    $objMongoColls[strDbName][strCollName].findOne({_id:objID},objProject,function(err,objResult){
        if(err){
            funcCb(1001,null)
        }else{
            funcCb(0,objResult)
        }
    })
}

$dao["cmn"].updateByID=function(strDbName,strCollName,id,objUpdated,dySync,funcCb){
    var objID=new ObjectID(id)

    var updated={$set:objUpdated}
    if(dySync==true) {
        updated["$currentDate"]={dt_Sync:true}
    }
    delete objUpdated["_id"]
    $objMongoColls[strDbName][strCollName].updateOne({_id:objID},updated,function(err,objResult){
        if(err){
            funcCb(1002)
        }else{
            funcCb(0)
        }
    })
}

$dao["cmn"].deleteByID=function(strDbName,strCollName,id,funcCb){
    var objID=new ObjectID(id)

    $objMongoColls[strDbName][strCollName].deleteOne({_id:objID},function(err,objResult){
        if(err){
            funcCb(1003)
        }else{
            funcCb(0)
        }
    })
}

$dao["cmn"]["mergeArrResults"]=function(arrItems,funcIterator,strTsName,maxCount,funcCb){
    async.concat(arrItems,funcIterator,function(err,concatResults){
        if(err){
            funcCb(err["errcode"],null)
        }else{
            var arrTotals=_.sortBy(concatResults,function(result){
                return (-result[strTsName].getTime())
            })
            var arrFinals=arrTotals.slice(0,maxCount)
            funcCb(0,arrFinals)
        }
    })
}
