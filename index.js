/***
 * Created by dcc on 2015/4/1.
 */
var util=require("util")
var path=require("path")
var argv = require('minimist')(process.argv.slice(2))
var uuid=require("uuid")
var qs = require('qs')
require('qs-numbers')(qs)
mkdirp=require("mkdirp")
mkdirp.sync(path.join(__dirname,"view/static/backstage/home/"))
mkdirp.sync(path.join(__dirname,"view/static/frontend/home/"))
global.$cwd=__dirname
process.chdir($cwd)
require("./common")

global.$isBackstage=false
if(argv["backstage"]){
    $isBackstage=true
}

global.$intAppMode=0
if(argv["production"]){
    $intAppMode=0
}else if(argv["development"]){
    $intAppMode=1
}else if(argv["demo"]){
    $intAppMode=2
}else{
    $intAppMode=0
}

require("./configuration")
var arrModelFunc=require("./model")

var async=require("async")

global.$viewDir=path.join(__dirname,"view")

require("./model/schema/cache")

async.series(
    arrModelFunc,
    function(err,arrResults) {
        var express = require("express")
        global.$app = express()
        $app.enable("trust proxy")

        if($intAppMode==1){
            if($isBackstage){
                $app.use(express.static("view/static/backstage"))
            }else{
                $app.use(express.static("view/static/frontend"))
            }
        }

        $app.set('view engine', 'html')
        if($isBackstage){
            $app.set('views', __dirname + '/view/html/backstage')
        }else{
            $app.set('views', __dirname + '/view/html/frontend')
        }

        $app.set("query parser",false)
        $app.use(function(req,res,next){
            var strQueryString=req._parsedUrl["query"]
            req.query=qs.parse(strQueryString,{
                depth:999999999999999,
                arrayLimit:999999999999999,
                parseArrays:true,
                allowDots:true,
                plainObjects:true,
                allowPrototypes:false,
                parameterLimit:999999999999999,
                strictNullHandling:true,
                skipNulls:true
            })
            next()
        })


        var nunjucks = require("nunjucks")
        if($isBackstage){
            nunjucks.configure("view/html/backstage",{
                autoescape:false,
                watch:true,
                express:$app
            })
        }else{
            nunjucks.configure("view/html/frontend",{
                autoescape:false,
                watch:true,
                express:$app
            })
        }

        $app.use(function (req, res, next) {
            req.isBrowser = true
            req.deviceAgent = 0
            req.isPC=true
            req.isApp=false
            if (req.get("x-ua")) {
                req.isBrowser = false
                req.deviceAgent = parseInt(req.get("x-ua"))
                req.isPC=false
            }else{
                req.deviceAgent=0
                var strUserAgent=req.get("user-agent").toLowerCase()
                var objRegExp=/(iphone|ipad|ipod|android)/
                if(strUserAgent.match(objRegExp)){
                    req.isPC=false
                    if(req.query.mobile_engine==1){
                        req.isApp=true
                    }
                }
            }

            if (req.deviceAgent != 0) {
                switch (req.deviceAgent) {
                    case 0:
                        req.os=-1
                    case 1:
                        req.os=0
                        break
                    case 2:
                        req.os=0
                        break
                    case 3:
                        req.os=1
                        break
                    case 4:
                        req.os=1
                        break
                    default:
                        req.os=2
                }
            }

            if($objConfig["multi_devices"]){
               switch (req.deviceAgent){
                   case 0:
                       req.deviceType=-1
                       break
                   case 1:
                       req.deviceType=0
                       break
                   case 2:
                       req.deviceType=1
                       break
                   case 3:
                       req.deviceType=0
                       break
                   case 4:
                       req.deviceType=1
                       break
                   default:
                       req.deviceType=2
               }
            }else{
                if(req.deviceAgent==0){
                    req.deviceType=-1
                }else{
                    req.deviceType=0
                }
            }

            next()
        })

        $app.use(function (req, res, next) {
            if (req.isBrowser) {
                if ($objConfig["logo"]) {
                    res.locals.logo = $objConfig["logo"]
                }
                if ($objConfig["img_logo"]) {
                    res.locals["img_logo"] = path.join($objConfig["static_server_url"],"multimedia/img",util.format("logo.",$objConfig["img_logo"]))
                }
                res.locals["staticUrl"] = ($objConfig["static_server_url"]=="/") ? "" : $objConfig["static_server_url"]
            }
            next()
        })

        var responseTime = require('response-time')
        $app.use(responseTime())

        var xmlparser = require('express-xml-bodyparser')
        $app.use(xmlparser({
            explicitArray: false,
            normalize: false,
            trim: true
        }))
        var bodyParser = require('body-parser')
        $app.use(bodyParser.json({
            limit: "1024kb",
            strict: false
        }))
        $app.use(bodyParser.raw({
            limit: "3072kb"
        }))
        $app.use(bodyParser.text({
            limit: "1024kb"
        }))
        $app.use(bodyParser.urlencoded({
            limit: "200kb",
            extended: true
        }))

        var methodOverride = require('method-override')
        $app.use(methodOverride('_method'))
        $app.use(methodOverride('X-HTTP-Method'))
        $app.use(methodOverride('X-HTTP-Method-Override'))
        $app.use(methodOverride('X-Method-Override'))
        $app.use(methodOverride(function (req, res) {
            if (req.body && typeof req.body === 'object' && '_method' in req.body) {
                // look in urlencoded POST bodies and delete it
                var method = req.body._method
                delete req.body._method
                return method.toUpperCase()
            }
        }))

        var cookieParser = require('cookie-parser')
        $app.use(cookieParser($objConfig["cookie_secret"]))

        var session = require('express-session')
        var RedisStore = require('connect-redis')(session)
        $app.use(session({
            genid:function(req){
                return uuid.v1()
            },
            store: new RedisStore({
                client:$redisClient,
                ttl: 7 * 24 * 60 * 60,
                prefix:$objConfig["session_prefix"]
            }),
            secret: $objConfig["cookie_secret"],
            cookie: {
                maxAge: 7 * 24 * 60 * 60 * 1000
            },
            resave: false,
            name: util.format("%sid",$objConfig["session_prefix"]),
            saveUninitialized: true,
            unset:"destroy"
        }))
        $app.use(function (req, res, next) {
            if (!req.isBrowser) {
                req.session.destroy()
            }
            next()
        })


        global.$routes = {}

        var strPrefixPath = $objConfig["apppath"] || "/"

        for (var strKey in $objConfig["subapp"]) {
            $routes[strKey] = express.Router()
            var strRoutePath = path.join(strPrefixPath, $objConfig["subapp"][strKey]["path"])
            $app.use(strRoutePath, $routes[strKey])
        }

        /*var morgan = require('morgan')
        var fs = require("fs")
        var FileStreamRotator = require('file-stream-rotator')
        var logDirectory = __dirname + '/log'
        fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
        var accessLogStream = FileStreamRotator.getStream({
            filename: logDirectory + '/access-%DATE%.log',
            frequency: 'daily',
            verbose: false
        })
        morgan.token("user", function (req, res) {
            var userid = req.sessoin && req.session.user && req.session.user._id
            if (userid) {
                return userid
            } else {
                return "unknown"
            }
        })
        morgan.token("device-agent", function (req, res) {
            var strUserAgent = ""
            switch (req.deviceAgent) {
                case 0:
                    strUserAgent = "browser"
                    break
                case 1:
                    strUserAgent = "iphone"
                    break
                case 2:
                    strUserAgent = "ipad"
                    break
                case 3:
                    strUserAgent = "aphone"
                    break
                case 4:
                    strUserAgent = "apad"
                    break
                case 5:
                    strUserAgent = "other"
                    break
                default:
                    strUserAgent = "unknown"
                    break
            }
            return strUserAgent
        })
        var strFormat = ":user :device-agent :remote-addr - :remote-user [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length] \":referrer\" \":user-agent\""
        $app.use(morgan(strFormat, {stream: accessLogStream}))*/

        require("./model/dao")
        require("./controller")

        $app.use(function (req, res, next) {
            if (req.isBrowser) {
                res.send("404 Not Found Your Path!")
            } else {
                res.json({errcode: 404, errmsg: "Not Found Your Path"})
            }
        })

        var errorhandler = require('errorhandler')
        if (process.env.NODE_ENV == "development") {
            $app.use(errorhandler())
        } else {
            $app.use(errorhandler({
                log: function (err, str, req, res) {
                    var strError = util.format("Error in %s because of %s", req.path, str)
                    console.log(strError)
                    res.json(err)
                }
            }))
        }

        $load("HTTPExtension.js")

        var http = require('http')
        http.createServer($app).listen($objConfig["listen_app_port"], function () {
            console.log("The service is listening on port " + $objConfig["listen_app_port"])
            //You can load im here

        })
    })

