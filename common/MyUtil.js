/**
 * Created by doucharles1 on 16/2/10.
 */
var _=require("underscore")
var ObjectID=require("mongodb").ObjectID
$load("logger.js")

$cmn["myutil"]={}

$cmn["myutil"]["identifyingcode"]=function(objConfig){
    var objDefault={
        bitnum:4,
        scope:["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"],
        start:0,
        end:61,
        repeatedAllowed:true,
    }
    if(!objConfig){
        objConfig=objDefault
    }else{
        objConfig["bitnum"]=objConfig["bitnum"] || objDefault["bitnum"]
        objConfig["scope"]=objConfig["scope"] || objDefault["scope"]
        objConfig["start"]=objConfig["start"] || objDefault["start"]
        objConfig["end"]=objConfig["end"] || objConfig["scope"].length-1 || objDefault["end"]
        objConfig["repeatedAllowed"]=objConfig["repeatedAllowed"] || objDefault["repeatedAllowed"]
    }
    var strResult=""
    var objExisted={}
    for(var i=0;i<objConfig["bitnum"];i++){
        var index=objConfig["start"]+Math.floor((objConfig["end"]-objConfig["start"])*Math.random())
        while(!objConfig["repeatedAllowed"] && objExisted[index.toString()]){
            index=objConfig["start"]+Math.floor((objConfig["end"]-objConfig["start"])*Math.random())
        }
        if(!objConfig["repeatedAllowed"]){
            objExisted[index.toString()]=1
        }
        strResult+=objConfig["scope"][index]
    }
    return strResult
}

$cmn["myutil"]["istoday"]=function(dt){
    var intTimestamp=dt.getTime()
    var dtNow=new Date()
    var intYear=dtNow.getFullYear()
    var intMonth=dtNow.getMonth()
    var intDay=dtNow.getDate()
    var now=new Date(intYear,intMonth,intDay,0,0,0,0)
    var int=now.getTime()
    var intDiff=intTimestamp-int
    return ((intDiff>=0) && (intDiff<(24*3600*1000)))
}

$cmn["myutil"]["isBeforeToday"]=function(dt){
    var intDtTs=dt.getTime()

    var dtNow=new Date()
    var intYear=dtNow.getFullYear()
    var intMonth=dtNow.getMonth()
    var intDay=dtNow.getDate()

    var dtToday=new Date(intYear,intMonth,intDay,0,0,0,0)
    var intToday=dtToday

    return ((intDtTs-intToday)<0)
}

$cmn["myutil"]["isDecInt"]=function(str){
    var objRegExp=/(^0$)|(^[1-9][0-9]*$)/
    return objRegExp.test(str)
}

$cmn["myutil"]["isDecDouble"]=function(str){
    var objRegExp=/(^0\.[0-9]+$)|(^[1-9][0-9]*\.[0-9]+$)/
    return objRegExp.test(str)
}

$cmn["myutil"]["parseJsonFromReq"]=function(obj){
    if(!_.isObject(obj) && !_.isArray(obj) && !_.isRegExp(obj)){
        return obj
    }else if(_.isObject(obj)){
        for(var strKey in obj){
            if(strKey=="_id" || strKey.indexOf("_id_")==0){
                obj[strKey]=new ObjectID(obj[strKey])
            }else if(strKey.indexOf("dt_")==0){
                var datetime=new Date()
                datetime.setTime(parseInt(obj[strKey]))
                obj[strKey]=datetime
            }else if(_.isArray(obj[strKey]) && strKey.indexOf("_id_arr_")==0){
                for(var j in obj[strKey]){
                    var tmp=obj[strKey][j]
                    obj[strKey][j]=new ObjectID(tmp)
                }
            }else{
                obj[strKey]=$cmn["myutil"]["parseJsonFromReq"](obj[strKey])
            }
        }
        return obj
    }else{
        var arr=[]
        for(var i in obj){
            arr[i]=$cmn["myutil"]["parseJsonFromReq"](obj[i])
        }
        return arr
    }
}

$cmn["myutil"]["parseJsonToRes"]=function(obj){
    if(_.isDate(obj)){
        return obj.getTime()
    }else if(obj instanceof ObjectID){
        return obj.toHexString()
    }else if(_.isFunction(obj) || _.isRegExp(obj)){
        return undefined
    }else if(!_.isObject(obj) && ! _.isArray(obj)){
        return obj
    }else if(_.isObject(obj)){
        for(var strKey in obj){
            obj[strKey]=$cmn["myutil"]["parseJsonToRes"](obj[strKey])
        }
        return obj
    }else{
        var arr=[]
        for(var i in obj){
            arr[i]=$cmn["myutil"]["parseJsonToRes"](obj[i])
        }
        return arr
    }
}

$cmn["myutil"]["parseJsonFromForm"]=function(obj){
    if(!_.isObject(obj) && !_.isArray(obj) && !_.isRegExp(obj)){
        if($cmn["myutil"].isDecInt(obj)){
            return parseInt(obj)
        }else if($cmn["myutil"].isDecDouble(obj)){
            return Number(obj)
        }else if(obj=="true") {
            return true
        }else if(obj=="false") {
            return false
        }else {
            return obj
        }
    }else if(_.isObject(obj)){
        for(var strKey in obj){
            if(strKey=="_id" || strKey.indexOf("_id_")==0){
                obj[strKey]=new ObjectID(obj[strKey])
            }else if(strKey.indexOf("dt_")==0){
                var datetime=new Date()
                datetime.setTime(parseInt(obj[strKey]))
                obj[strKey]=datetime
            }else{
                obj[strKey]=$cmn["myutil"]["parseJsonFromForm"](obj[strKey])
            }
        }
        return obj
    }else{
        var arr=[]
        for(var i in obj){
            arr[i]=$cmn["myutil"]["parseJsonFromForm"](obj[i])
        }
        return arr
    }
}

$cmn["myutil"]["now"]=function(){
    var dt_Now=new Date()
    return dt_Now.getTime()
}

$cmn["myutil"]["fromTimestamp"]=function(intTs){
    var dt=new Date()
    dt.setTime(intTs)
    return dt
}

$cmn["myutil"]["fromDate"]=function(objDate){
    return objDate.getTime()
}

$cmn["myutil"]["isPhone"]=function(str){
    var regExp=/^1[3|4|5|7|8]\d{9}$/
    return regExp.test(str)
}

$cmn["myutil"]["isEmail"]=function(str){
    var regExp=/^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/
    return regExp.test(str)
}

$cmn["myutil"]["toObjectIDArray"]=function(arrStrIDs){
    for(var i in arrStrIDs){
        var tmp=arrStrIDs[i]
       if(_.isString(tmp)){
            arrStrIDs[i]=new ObjectID(tmp)
       }
    }
}

$cmn["myutil"]["splitArrays"]=function(arr,count){
    var start=0
    var totalLen=arr.length
    var arrTotal=[]
    while(start<totalLen){
        var arrTmp=arr.slice(start,start+count)
        arrTotal.push(arrTmp)
        start+=count
    }
    return arrTotal
}
