var util=require("util")
var ObjectID=require("mongodb").ObjectID
var arrRoutes=[
    ["post","","$auth","$form",newPractice],
    ["get","","$auth",practiceList],
    ["get",":practice_id","$auth",practiceDetail]
]

function PracticeController(arrRoutes,strRoutePrefix,strViewPrefix,strSubApp){
    Controller.call(this,arrRoutes,strRoutePrefix,strViewPrefix,strSubApp)
}
util.inherits(PracticeController,Controller)

//ʵϰ����
function newPractice(req,res,next){
    $dao["practice"]["newPractice"](req.cid,req.body,res.reply.bind(res))
}

//ʵϰ�б�
function practiceList(req,res,next){
    $dao["practice"]["practiceList"](res.reply.bind(res))
}

//ʵϰ����
function practiceDetail(req,res,next){
    $dao["practice"]["practiceDetail"]({_id:new ObjectID(req.params['practice_id'])},res.reply.bind(res))
}

module.exports=new PracticeController(arrRoutes,"practice","practice","")