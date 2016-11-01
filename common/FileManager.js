/**
 * Created by doucharles1 on 15/10/11.
 */
var async=require("async")
var path=require("path")
var _=require("underscore")
var moment=require("moment")
var fs=require("fs")
var needle=require("needle")
var uuid=require("uuid")
var url=require("url")
var formidable = require('formidable')
var mkdirp=require("mkdirp")

function _filtype(strFilePath){
    var strExtName=path.extname(strFilePath)
    var arrObjFileTypeRegEx=[
        [
            /^\.[Jj][Pp][Gg]$/,
            /^\.[Jj][Pp][Ee][Gg]$/,
            /^\.[Pp][Nn][Gg]$/
        ],
        [
            /^\.[Mm][Oo][Vv]$/,
            /^\.[Mm][Pp]4$/
        ],
        [
            /^\.[Aa][Uu][Dd]$/,
            /^\.[Aa][Mm][Rr]$/,
            /^\.[Ww][Aa][Vv]$/,
            /^\.[Ww][Mm][Aa]$/,
            /^\.[Mm][Pp]3$/,
            /^\.[Oo][Gg][Gg]$/
        ]
    ]

    for(var i in arrObjFileTypeRegEx){
        var arrTmp=arrObjFileTypeRegEx[i]
        for(var j in  arrTmp){
            var objRegEx=arrTmp[j]
            if(objRegEx.test(strExtName)){
                return parseInt(i)
            }
        }
    }
    return -1
}

function _urlJoin(){
    var intArgLen=arguments.length
    var objRegExProtocal=/^https?:\/\/.+/
    if(intArgLen<1){
        return undefined
    }else if(!objRegExProtocal.test(arguments[0])){
        return undefined
    }else if(intArgLen==1){
        return url
    }else{
        var strTmp=""
        for(var i=1;i<intArgLen;i++){
            strTmp=path.join(strTmp,arguments[i])
        }
        if(strTmp.indexOf("/")==0){
            strTmp=strTmp.substr(1)
        }
        return url.resolve(arguments[0],strTmp)
    }
}

function FileManager(_strRootPath){
    if($isBackstage){
        this.strRootPath=path.join(_strRootPath,"backstage")
    }else{
        this.strRootPath=path.join(_strRootPath,"frontend")
    }
}

//callback(objResult)
FileManager.prototype.saveUploadFile=function(req,funcAfterSaved){
    var self=this

    var form = new formidable.IncomingForm()
    form.encoding = 'utf-8'
    form.uploadDir=this.strRootPath
    form.keepExtensions = true
    form.maxFieldsSize = 100 * 1024 * 1024
    form.maxFields=0
    form.hash="md5"
    form.multiples=true

    var objResult=req.body || {}

    form.parse(req, function(err, fields, files) {
    });

    form.on("field",function(name,value){
        objResult[name]=value
    })

    form.on("fileBegin",function(name,file) {
        var strDateNow = moment().format("YYYYMMDD")
        var strFileUrl=$objConfig["static_server_url"]
        var intFileType=_filtype(file.path)

        if (objResult["not_user"]==true || !req.cid) {
            switch(intFileType){
                case 0:
                    file.path = path.join(self.strRootPath, "multimedia/img", path.basename(file.path))
                    strFileUrl+=path.join("/","multimedia/img",path.basename(file.path))
                    break
                case 2:
                    file.path = path.join(self.strRootPath, "multimedia/audio", path.basename(file.path))
                    strFileUrl+=path.join("/","multimedia/audio",path.basename(file.path))
                    break
                case 1:
                    file.path = path.join(self.strRootPath, "multimedia/video", path.basename(file.path))
                    strFileUrl+=path.join("/","multimedia/video",path.basename(file.path))
                    break
                default:
                    file.path = path.join(self.strRootPath, "other", path.basename(file.path))
                    strFileUrl+=path.join("/","other",path.basename(file.path))
                    break
            }
        }else{
            file.path = path.join(self.strRootPath, "home", req.cid, strDateNow, path.basename(file.path))
            var strDirName=path.dirname(file.path)
            mkdirp.sync(strDirName)
            if(strFileUrl=="/"){
                strFileUrl=path.join("/","home", req.cid, strDateNow, path.basename(file.path))
            }else{
                strFileUrl+=path.join("/","home", req.cid, strDateNow, path.basename(file.path))
            }
        }

        var arrTmpFieldNames=name.split("_")
        if(arrTmpFieldNames[1]=="multi"){
            if(!objResult[name]){
                objResult[name]=[]
            }
            objResult[name].push(strFileUrl)
        }else{
            objResult[name]=strFileUrl
        }
    })

    form.on("error",function(err){
            funcAfterSaved(1016,objResult)
   })

    form.on("end",function(fields,files){
       delete objResult["not_user"]
       funcAfterSaved(0,objResult)
   })
}

FileManager.prototype.delete=function(strFileUrl,funcDeleted){
    var self=this
    if(!strFileUrl || !_.isArray(strFileUrl) || strFileUrl.length==0){
        funcDeleted(0)
    }else{
        async.each(strFileUrl,function(url,cbFunc){
            var strCurUrl=url
            if(!strCurUrl){
                cbFunc(null)
            }else{
                var length=$objConfig["static_server_url"].length
                var strRelativePath= strCurUrl.substr(length)
                var strFilePath=path.join(self.strRootPath,strRelativePath)
                fs.unlink(strFilePath,function(err){
                    if(err) {
                        cbFunc(err)
                    }else{
                        cbFunc(null)
                    }
                })
            }
        },function(err){
            if(err){
                funcDeleted(1017)
            }else{
                funcDeleted(0)
            }
        })
    }
}

FileManager.prototype.download=function(strSourceUrl,strRelativePath,funcAfterDownloaded){
    var self=this
    var strExtName=path.extname(strSourceUrl)
    var strFileName=path.basename(strSourceUrl,strExtName)
    var strID=uuid.v1()
    var strNewName=strFileName+"_"+strID+strExtName
    var strNewFileUrl=_urlJoin($objConfig["static_server_url"],strRelativePath,strNewName)
    var strNewFilePath=path.join(self.strRootPath,strRelativePath,strNewName)
    var objResult=true
    needle.get(strSourceUrl,{output:strNewFilePath},function(err,res,body){
        if(err){
            funcAfterDownloaded(false)
        }else{
            funcAfterDownloaded(true,strNewFileUrl)
        }
    })
    var writeStream=fs.createWriteStream(strNewFilePath)
    var readStream=needle.get(strSourceUrl)

    readStream.on("error",function(err){
        objResult=false
    })

    writeStream.on("error",function(err){
        objResult=false
    })

    writeStream.on("end",function(){
        funcAfterDownloaded(objResult,strNewFileUrl)
    })

    readStream.pipe(writeStream)

}

$cmn["file"]=new FileManager(path.join(__dirname,"../view/static/"))
