/**
 * Created by dcc on 2015/4/1.
 */
var arrNeededDb=$objConfig["needed_database"]
var strRootPath="./schema"
var arrFuncModel=[]
for(var i in arrNeededDb){
    var requirePath=strRootPath+"/"+arrNeededDb[i]
    var func=require(requirePath)
    arrFuncModel.push(func)
}
module.exports=arrFuncModel