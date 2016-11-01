/**
 * Created by doucharles1 on 15/10/19.
 */
var nodemailer=require("nodemailer")
var EmailTemplates = require("swig-email-templates")
var transporter = nodemailer.createTransport($objConfig["email"]["smtp"])
var util=require("util")
var path=require("path")

var strMailIdentifyingCodeHtmlPath=path.join(__dirname,"..",$objConfig["email"]["mail_templates_path"])

var objCommonSwigTemplates=new EmailTemplates({
    text:false,
    swig:{
        cache:false
    },
    root:strMailIdentifyingCodeHtmlPath,
    filters:{
        userNameInMail:function(strUser){
            var intIndexMailSymbol=strUser.indexOf("@")
            var strUserNameInMail=strUser.substr(0,intIndexMailSymbol)
            var strDomainName=strUser.substr(intIndexMailSymbol+1)
            var tmp=strUserNameInMail.substr(0,2)
            tmp+="***"
            tmp+=strDomainName
            return tmp
        }
    },
    juice:{
        inlinePseudoElements:false,
        webResources:{
            images:true,
            scripts:true,
            links:true
        }
    },
    rewriteUrl:function(url){
        var strResultUrl=url
        return strResultUrl
    }
})

$cmn["mailer"]={}
$cmn["mailer"]["sendIdentifyingCode"]=function(to,identifyingcode,strPurpose,cbFunc){
    var objMailOptions={}
    objMailOptions["from"]= $objConfig["email"]["smtp"]["auth"]["user"]
    objMailOptions["to"]=to
    objMailOptions["subject"]=util.format("%s-%s-验证码",$objConfig["app_name"],strPurpose)
    var objContext={identifyingcode:identifyingcode,appname:$objConfig["app_name"],user:to, code_expires:600000/1000/60}

    objCommonSwigTemplates.render("identifyingcode.html",objContext,function(err,html,text){
        if(err){
            cbFunc(err)
        }else{
            objMailOptions["html"]=html
            transporter.sendMail(objMailOptions,function(err,info){
                if(err){
                    cbFunc(err)
                }else{
                    cbFunc(null,info)
                }
            })
        }
    })
}
