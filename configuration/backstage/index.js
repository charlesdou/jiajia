/**
 * Created by doucharles1 on 16/3/24.
 */
var _=require("underscore")

//loading configuration of this application
var common=require("./common")
switch($intAppMode){
    case 0:
        var objProduction=require("./production")
        $objConfig= _.extend($objConfig,common,objProduction)
        process.env.NODE_ENV='production'
        break
    case 1:
        var objDevelopment=require("./development")
        $objConfig= _.extend($objConfig,common,objDevelopment)
        process.env.NODE_ENV='development'
        break
    case 2:
        var objDemo=require("./demo")
        $objConfig= _.extend($objConfig,common,objDemo)
        process.env.NODE_ENV='development'
        break
    default:
        break
}
