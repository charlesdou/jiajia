/**
 * Created by dcc on 2015/4/1.
 */
var objAllCollections=require("./collection.json")
var async=require("async")
var MongoClient = require('mongodb').MongoClient
var util=require("util")
var _=require("underscore")


global.$objMongoColls={}
global.$objMongoDbs={}
global.$objMongoMainDb={}

module.exports=global.$funcMongoConnTask=function(callback) {
    async.waterfall([
        function (cbWaterfall) {
            MongoClient.connect($objConfig["mongodb_url"], function (err, db) {
                if (err) {
                    cbWaterfall(err)
                } else {
                    cbWaterfall(null, db)
                }
            })
        },
        function (db, cbWaterfall) {
            var arrStrDbKeys = _.keys(objAllCollections)
            async.each(arrStrDbKeys, function (item, cbDbEach) {
                $objMongoDbs[item] = db.db(item)
                $objMongoColls[item] = {}
                if (item == $objConfig["mongodb_maindb"]) {
                    $objMongoMainDb = $objMongoDbs[item]
                }
                //console.log(util.format("db:%s is ok!",item))
                var objColl = objAllCollections[item]
                var arrStrCollKeys = _.keys(objColl)
                async.each(arrStrCollKeys, function (strCollKey, cbCollEach) {
                    $objMongoDbs[item].collection(strCollKey, function (err, coll) {
                        if (err) {
                            cbCollEach(err)
                        } else {
                            $objMongoColls[item][strCollKey] = coll
                            //console.log(util.format("coll:%s.%s is ok!",item,strCollKey))
                            var arrIndexes = objColl[strCollKey]
                            if (arrIndexes.length == 0) {
                                cbCollEach(null)
                            } else {
                                async.each(arrIndexes, function (objIndex, cbIndexEach) {
                                    $objMongoColls[item][strCollKey].createIndex(objIndex, function (err, result) {
                                        if (err) {
                                            cbIndexEach(err)
                                        } else {
                                            cbIndexEach(null)
                                        }
                                    })
                                }, function (err) {
                                    if (err) {
                                        cbCollEach(err)
                                    } else {
                                        cbCollEach(null)
                                    }
                                })
                            }
                        }
                    })
                }, function (err) {
                    if (err) {
                        cbDbEach(err)
                    } else {
                        cbDbEach(null)
                    }
                })

            }, function (err) {
                if (err) {
                    cbWaterfall(err)
                } else {
                    cbWaterfall(null, null)
                }
            })
        }
    ], function (err, result) {
        if (err) {
            console.log(err)
            callback(err)
        } else {
            if ($intAppMode != 0) {
                console.log("successfully connected to mongodb!")
            }
            callback(null, result)
        }
    })
}