var _=require("underscore")
var async=require("async")
var util=require("util")
var ObjectID=require("mongodb").ObjectID
var Timestamp=require("mongodb").Timestamp
$load("FileManager.js")
$load("MyUtil.js")
var _s=require("underscore.string")
var objActivityColl=$objMongoColls["maindb"]["activity"] 