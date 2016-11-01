/**
 * Created by dcc on 2015/4/1.
 */
var _=require("underscore")

//loading configuration of this application
var common=require("./common")
global.$objConfig={}
switch($intAppMode){
    case 0:
        var objProduction=require("./production")
        $objConfig= _.extend(common,objProduction)
        process.env.NODE_ENV='production'
        break
    case 1:
        var objDevelopment=require("./development")
        $objConfig= _.extend(common,objDevelopment)
        process.env.NODE_ENV='development'
        break
    case 2:
        var objDemo=require("./demo")
        $objConfig= _.extend(common,objDemo)
        process.env.NODE_ENV='development'
        break
    default:
        break
}

if($isBackstage){
    require("./backstage")
}










