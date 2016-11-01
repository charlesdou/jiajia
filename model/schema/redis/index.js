/**
 * Created by dcc on 2015/4/1.
 */
var redis = require("redis")

module.exports=global.$funcRedisConn=function(callback) {
    global.$redisClient = redis.createClient($objConfig["redis_port"], $objConfig["redis_ip"])
    $redisClient.on("connect", function () {
        if ($intAppMode != 0) {
            console.log("resdis is successfully connected!")
        }
        callback(null, null)
    })
    $redisClient.on("error", function (err) {
        console.log(err)
        if (callback) {
            callback(err)
        }
    })
}
