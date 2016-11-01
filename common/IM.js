/**
 * Created by doucharles1 on 16/6/13.
 */
var util=require("util")
var path=require("path")
var _=require("underscore")
var needle=require("needle")

var objCmnOptions={
    json:true
}

function IM(strRootUrl) {
    var arr=$objConfig["subapp"]["im"]["app_id"].split("#")
    this.rootUrl=strRootUrl+path.join("/",arr[0],arr[1])
}

IM.prototype.username=function(strOriginUserName){
    var strResult=strOriginUserName.replace(/@/g,"_")
    strResult=strResult.replace(/\./g,"_")
    return strResult
}

IM.prototype.authorization=function(password){
    var strAuth=util.format("Bearer %s",password)
    var obj=_.extend(objCmnOptions,{headers:{Authorization:strAuth}})
    return obj
}

IM.prototype.token=function(funcCb){
    var objBody={
        grant_type:"client_credentials",
        client_id:$objConfig["subapp"]["im"]["client_id"],
        client_secret:$objConfig["subapp"]["im"]["client_secret"]
    }
    needle.post(this.rootUrl+"/token",objBody,{json:true},function(err,resp){
        if(err){
            funcCb(1026,null)
        }else{
            funcCb(0,resp.body)
        }
    })
}

IM.prototype.register=function(strAccessToken,strUserName,strPassword,strNickName,funcCb){
    var objBody={
        username:strUserName,
        password:strPassword,
        nickname:strNickName
    }

    needle.post(this.rootUrl+path.join("/","users"),objBody,this.authorization(strAccessToken),function(err,resp){
        if(err){
            funcCb(1027)
        }else{
            funcCb(0)
        }
    })
}

IM.prototype.queryUser=function(strAccessToken,strUser,funcCb){
    var strPath=path.join("/","users",strUser)
    objCmnOptions["password"]=strAccessToken
    needle.get(this.rootUrl+strPath,this.authorization(strAccessToken),function(err,resp){
        if(err){
            funcCb(1028,null)
        }else{
            funcCb(0,resp.body)
        }
    })
}

IM.prototype.deleteUser=function(strAccessToken,strUser,funcCb){
    var strPath=path.join("/","users",strUser)
    objCmnOptions["password"]=strAccessToken
    needle.delete(strPath,null,this.authorization(strAccessToken),function(err,resp){
        if(err){
            funcCb(1029)
        }else{
            funcCb(0)
        }
    })
}

IM.prototype.updateUserNickName=function(strAccessToken,strUser,strNewNickName,funcCb){
    var strPath=path.join("/","users",strUser)
    var objBody={
        nickname:strNewNickName
    }
    needle.put(this.rootUrl+strPath,objBody,this.authorization(strAccessToken),function(err,resp){
        if(err){
            funcCb(1030)
        }else{
            funcCb(0)
        }
    })
}

IM.prototype.updatePassword=function(strAccessToken,strUser,strNewPassword,funcCb){
    var strPath=this.rootUrl+path.join("/","users",strUser,"password")
    var objBody={
        newpassword:strNewPassword
    }
    needle.put(strPath,objBody,this.authorization(strAccessToken),function(err,res){
        if(err){
            funcCb(1031,null)
        }else{
            funcCb(0,res.body)
        }
    })
}

IM.prototype.addFriend=function(strAccessToken,strOrginUser,strFriend,funcCb){
    var strPath=this.rootUrl+path.join("/","users",strOrginUser,"contacts/users",strFriend)
    needle.post(strPath,null,this.authorization(strAccessToken),function(err,res){
        if(err){
            funcCb(1032,null)
        }else{
            funcCb(0,res.body)
        }
    })
}

IM.prototype.deleteFriend=function(strAccessToken,strOriginUser,strFriend,funcCb){
    var strPath=this.rootUrl+path.join("/","users",strOriginUser,"contacts/users",strFriend)
    needle.delete(strPath,null,this.authorization(strAccessToken),function(err,res){
        if(err){
            funcCb(1033,null)
        }else{
            funcCb(0,res.body)
        }
    })
}

IM.prototype.addFriendsToBlacklist=function(strAccessToken,strOriginUser,arrStrFriends,funcCb){
    var strPath=this.rootUrl+path.join("/","users",strOriginUser,"blocks/users")
    var objBody={
        usernames:arrStrFriends
    }
    needle.post(strPath,objBody,this.authorization(strAccessToken),function(err,res){
        if(err){
            funcCb(1034,null)
        }else{
            funcCb(0,res.body)
        }
    })
}

IM.prototype.delFriendFromBlacklist=function(strAccessToken,strOriginUser,strFriend,funcCb){
    var strPath=this.rootUrl+path.join("/","users",strOriginUser,"blocks/users",strFriend)
    needle.delete(strPath,null,this.authorization(strAccessToken),function(err,res){
        if(err){
            funcCb(1035,null)
        }else{
            funcCb(0,res.body)
        }
    })
}

IM.prototype.deactiveUser=function(strAccessToken,strUser,funcCb){
    var strPath=this.rootUrl+path.join("/","users",strUser,"deactive")
    needle.post(strPath,null,this.authorization(strAccessToken),function(err,res){
        if(err){
            funcCb(1036,null)
        }else{
            funcCb(0,res.body)
        }
    })
}

IM.prototype.activateUser=function(strAccessToken,strUser,funcCb){
    var strPath=this.rootUrl+path.join("/","users",strUser,"activate")
    needle.post(strPath,null,this.authorization(strAccessToken),function(err,res){
        if(err){
            funcCb(1037,null)
        }else{
            funcCb(0,res.body)
        }
    })
}

IM.prototype.disconnectUser=function(strAccessToken,strUser,funcCb){
    var strPath=this.rootUrl+path.join("/","users",strUser,"disconnect")
    needle.get(strPath,this.authorization(strAccessToken),function(err,res){
        if(err){
            funcCb(1038,null)
        }else{
            funcCb(0,res.body)
        }
    })
}

IM.prototype.pushMsg=function(strAccessToken,strDestUser,strAction,objMsg,funcCb){
    var strPath=this.rootUrl+path.join("/","messages")
    var objBody={
        target_type:"users",
        target:[strDestUser+"_1",strDestUser+"_2",strDestUser+"_3",strDestUser+"_4"],
        msg: {
            type: "cmd",
            action: strAction
        }
    }
    delete objMsg["action"]
    if(objMsg){
        objBody["ext"]=objMsg
    }
    needle.post(strPath,objBody,this.authorization(strAccessToken),function(err,res){
        if(err){
            funcCb(1039,null)
        }else{
            funcCb(0,res.body["data"])
        }
    })
}

IM.prototype.addGroup=function(strAccessToken,strOwnerUser,objGroupinfo,funcCb){
    var strPath=this.rootUrl+path.join("/","chatgroups")
    needle.post(strPath,objGroupinfo,this.authorization(strAccessToken),function(err,res){
        if(err){
            funcCb(1040,null)
        }else{
            funcCb(0,res.body)
        }
    })
}

IM.prototype.updateGroupInfo=function(strAccessToken,groupID,objGroupInfo,funcCb){
    var strPath=this.rootUrl+path.join("/","chatgroups",groupID)
    needle.put(strPath,objGroupInfo,this.authorization(strAccessToken),function(err,res){
        if(err){
            funcCb(1041,null)
        }else{
            funcCb(0,res.body)
        }
    })
}

IM.prototype.deleteGroup=function(strAccessToken,groupID,funcCb){
    var strPath=this.rootUrl+path.join("/","chatgroups",groupID)
    needle.delete(strPath,null,this.authorization(strAccessToken),function(err,res){
        if(err){
            funcCb(1042,null)
        }else{
            funcCb(0,res.body)
        }
    })
}

IM.prototype.addUsersToGroup=function(strAccessToken,groupID,arrStrUserIDs,funcCb){
    var strPath=this.rootUrl+path.join("/","chatgroups",groupID,"users")
    needle.post(strPath,{usernames:arrStrUserIDs},this.authorization(strAccessToken),function (err,res) {
        if(err){
            funcCb(1043,null)
        }else{
            funcCb(0,res.body)
        }
    })
}

IM.prototype.deleteUsersFromGroup=function(strAccessToken,groupID,arrStrUserIDs,funcCb){
    var strPath=this.rootUrl+path.join("/","chatgroups",groupID,"users")
    strPath+="/"
    for(var user in arrStrUserIDs){
        strPath+=arrStrUserIDs[user]+","
    }
    strPath=strPath.substr(0,strPath.length-1)
    needle.delete(strPath,{},this.authorization(strAccessToken),function(err,res){
        if(err){
            funcCb(1044,null)
        }else{
            funcCb(0,res.body)
        }
    })
}

IM.prototype.transferGroup=function(strAccessToken,groupID,strOwnerUser,funcCb){
    var strPath=this.rootUrl+path.join("/","chatgroups",groupID)
    needle.put(strPath,{newowner:strOwnerUser},this.authorization(strAccessToken),function(err,res){
        if(err){
            funcCb(1045,null)
        }else{
            funcCb(0,res.body)
        }
    })
}

module.exports=new IM("https://a1.easemob.com")