/**
 * Created by doucharles1 on 15/6/21.
 */
var https = require('https');
var querystring = require('querystring');
var util=require("util")
$cmn["sms"]={}

$cmn["sms"]["sendMsg"]=function(strPhoneNumber,strMsg,callback){
    var postData = {
        mobile:strPhoneNumber,
        message:strMsg
    };

    var content = querystring.stringify(postData);
    var options = {
        host:'sms-api.luosimao.com',
        path:'/v1/send.json',
        method:'POST',
        auth:util.format('api:key-%s',$objConfig['subapp']['sms']['token']),
        agent:false,
        rejectUnauthorized : false,
        headers:{
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length' :content.length
        }
    };

    var req = https.request(options,function(res){
        res.setEncoding('utf8');
        var str=""
        res.on('data', function (chunk) {
            str+=chunk.toString()
        });
        res.on('end',function(){
            var obj=JSON.parse(str)
            callback(obj)
        });
    });

    req.write(content);
    req.end();
}
