var _=require("underscore")
var async=require("async")
var util=require("util")
var ObjectID=require("mongodb").ObjectID
var Timestamp=require("mongodb").Timestamp
$load("FileManager.js")
$load("MyUtil.js")
var _s=require("underscore.string")
var objEntrepreneurshipColl=$objMongoColls["maindb"]["entrepreneurship"]
var objEntrepreneurshipInstructorColl=$objMongoColls["maindb"]["entrepreneurship_instructor"]

/*
entrepreneuship
{
    _id:<ObjectID>,
    img_logo:<string>,
    subject:<string>,
    description:<string>,
    incubation_period:<int>,
    funds:<int>,
    dt_publish:<DateTime>,
    img_banner:"",   //海报图片字段
    file_multi:[
 		<string>,...
    ],
    posts:'前端，后端，开发',   //添加的岗位信息字段
    //partners:[       //合伙人
    //    {
    //     type:<string>,    //职位类型
    //     descrition:"",    //职位描述
    //     requirement:"",   //职位要求
    //     duty:"",          //职位职责
    //     num:<int>,        //职位数量
    //     salary:<int>      //职位薪水
    //    },
    //    ...
    //],
    left_time:<int>,   //剩余时间
    sign_secrecy:0,  0未签  1已签保密协议
    userid:<string>,
    broadcast_type:<int>  //0 全网用户都能看见 1 群组 2 联络圈
    groups:[
        <string>,...        //组id
    ]               //只有当broad_cast为1的时候才会出现
}
//辅导员
entrepreneurship_instructor
{
    _id:<ObjectID>,
	name 姓名
	sex 性别
	img_portrait 照片 <file>
	contact 联系方式
	age 年龄
	experience 资历
	school 毕业院校
	description 详细说明
}
 */
//创业提案发布
$dao["entrepreneurship"]["submitEntrepreneurship"]=function(strUserID,objEntrepreneurship,funcCb){
    var insertObj = {};
    insertObj['img_logo'] = objEntrepreneurship['img_logo']||'';
    insertObj['subject'] = objEntrepreneurship['subject']||'';
    insertObj['description'] = objEntrepreneurship['description']||'';
    insertObj['incubation_period'] = objEntrepreneurship['incubation_period']||0;
    insertObj['funds'] = objEntrepreneurship['funds']||0;
    insertObj['dt_publish'] = new Date().getTime();
    insertObj['img_banner'] = objEntrepreneurship['img_banner']||'';
    insertObj['attachment_multi'] = objEntrepreneurship['attachment_multi'];
    insertObj['broadcast_type'] = objEntrepreneurship['broadcast_type']||0;
    insertObj['left_time'] = (insertObj['incubation_period']-insertObj['dt_publish'])>0?insertObj['incubation_period']-insertObj['dt_publish']:0;
    try{
        insertObj['posts'] = JSON.parse(objEntrepreneurship['posts']||'[]');
        console.log(objEntrepreneurship['posts'])
    }
    catch (err){
        insertObj['posts']=[];
    }
    if(objEntrepreneurship['broadcast_type']==1){
       insertObj['groups'] = objEntrepreneurship['groups']||[]
    }
    var posts_id_list=[];
    insertObj['sign_secrecy'] = insertObj['sign_secrecy']||1;
    insertObj["userid"]=strUserID
    async.waterfall([
        function(cb){
            objEntrepreneurshipColl.insertOne(insertObj,function(err,insertResult){
                if(err){
                    cb({errcode:1000},null)
                }else{
                    insertObj["_id"]=insertResult["insertedId"];
                    for(var i=0;i<insertObj['posts'].length;i++){
                        insertObj['posts'][i].id=insertObj["_id"]+i;
                        posts_id_list.push(insertObj['posts'][i].id)
                    }
                    cb(null,insertObj)
                }
            })
        }
    ],function(err,objResult){
        if(err){
           $cmn["file"].delete([insertObj["img_logo"]].concat(objEntrepreneurship["attachment_multi"]||[]),function(errcode){
               funcCb(err["errcode"],null)
           })
        }else{
            funcCb(0,{"code":0,"message":"success",data:{
                "_id":insertObj['_id'],
                "posts_id_list":posts_id_list
            }})
        }
    })
}

$dao["entrepreneurship"]["examineEntrepreneurship"]=function(objEntrepreneurship,funcCb){
    async.waterfall([
        function(cb){
            objEntrepreneurshipColl.updateOne(objEntrepreneurship[0],{$set:objEntrepreneurship[1]},function(err,insertResult){
					if(err){
						cb({errcode:1002},null)
					}else{
						cb(null,objEntrepreneurship)
					}
				}
			)
        }
    ],function(err,objResult){
        if(err){
			funcCb(err["errcode"],null)
        }else{
            funcCb(0,{'message':'success'})
        }
    })
}
//查询所有创业信息列表
/*
method  get

 */
$dao["entrepreneurship"]["listEntrepreneurship"]=function(funcCb){
    async.waterfall([
        function(cb){
            objEntrepreneurshipColl.find().sort({dt_publish:-1}).toArray(function(err,documents){
				if(err){
					cb({errcode:1001},null)
				}else{

					cb(null,documents)
				}
			})
        }
    ],function(err,objResult){
        if(err){
			funcCb(err["errcode"],null)
        }else{
            var arr =[];
            for(var key in objResult){
                objResult[key].posts.forEach(function(v,i){v.id=i})
                arr.push(objResult[key])
            }

            funcCb(0,{"code":0,"message":'success',"data":arr})
        }
    })
}
/*
method  get
@params {entrepreneurshipId}
返回
{
     "img_logo": "",
     "subject": "金融方案",
     "description": "这是我第一次创业",
     "incubation_period": 20160922,
     "funds": 0,
     "dt_publish": 1473608224400,
     "attachment_multi": {},
     "broadcast_type": 1,
     "left_time": 0,
     "groups": [],
     "partners": [
     {
     "type": "ui设计师",
     "descrition": "我是一名经理",
     "requirement": "要求会ps，设计感觉好",
     "duty": "负责公司官网的整体设计，会带领ui设计团队",
     "num": 1,
     "Salary": "18k"
     },
     {
     "type": "CTO",
     "descrition": "负责公司的整体的技术架构",
     "Requirement": "BAT公司背景",
     "duty": "负责公司整体技术导向",
     "num": 1,
     "Salary": "30k"
     }
     ],
     "sign_secrecy": 1,
     "userid": "15021959806"
}
 */
$dao["entrepreneurship"]["entrepreneurshipDetails"]=function(entrepreneurshipId,funcCb){
    async.waterfall([
        function(cb){
			objEntrepreneurshipColl.find(entrepreneurshipId).toArray(function(err,documents){
				if(err){
					cb({errcode:1001},null)
				}else{
					cb(null,documents[0])
				}
			})
        }
    ],function(err,objResult){
        if(err){
			funcCb(err["errcode"],null)
        }else{
            funcCb(0,objResult)
        }
    })
}
/*
提交辅导员信息
@params  {
 name:"bmx",
 sex:1, 				1男  2女
 img_portrait:"",
 contact:"15021959806"
 age:20
 experience:""       工作经历
 school:""           毕业学校
 description:""      其他描述
}
 */
$dao["entrepreneurship"]["submitEntrepreneurshipInstructor"]=function(strUserID,objEntrepreneurshipInstructor,funcCb){
    var insertObj = {};
    insertObj['name'] = objEntrepreneurshipInstructor['name']||'';
    insertObj['sex'] = objEntrepreneurshipInstructor['sex']||'';
    insertObj['img_portrait'] = objEntrepreneurshipInstructor['img_portrait']||'';
    insertObj['contact'] = objEntrepreneurshipInstructor['contact']||'';
    insertObj['experience'] = objEntrepreneurshipInstructor['experience']||'';
    insertObj['school'] = objEntrepreneurshipInstructor['school']||'';
    insertObj['description'] = objEntrepreneurshipInstructor['description']||'';

    async.waterfall([
        function(cb){
			objEntrepreneurshipInstructorColl.insertOne(insertObj,function(err,insertResult){
                if(err){
                    cb({errcode:1000},null)
                }else{
                    insertObj['_id'] = insertResult['insertedId']
                    cb(null,insertObj)
                }
            })
        }
    ],function(err,objResult){
        if(err){
           //$cmn["file"].delete([objEntrepreneurship["img_portrait"]],function(errcode){
               funcCb(err["errcode"],null)
          // })
        }else{
            funcCb(0,{'message':'success','code':0,'data':{'id':objResult['_id']}})
        }
    })
}
/*
辅导员列表
get
 */
$dao["entrepreneurship"]["listEntrepreneurshipInstructor"]=function(funcCb){
    async.waterfall([
        function(cb){
			objEntrepreneurshipInstructorColl.find().toArray(function(err,documents){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,documents)
                }
            })
        }
    ],function(err,objResult){
        if(err){
			funcCb(err["errcode"],null)
        }else{
            funcCb(0,{"code":0,"message":"success","data":objResult})
        }
    })
}
/*
辅导员详情接口
get
url   '/entrepreneurship/:instructor_id'
@params  不传
 */
$dao["entrepreneurship"]["entrepreneurshipInstructorDetails"]=function(objQueryId,funcCb){
    async.waterfall([
        function(cb){
			objEntrepreneurshipInstructorColl.findOne(objQueryId,function(err,documents){
                if(err){
                    cb({errcode:1001},null)
                }else{
                    cb(null,documents)
                }
            })
        }
    ],function(err,objResult){
        if(err){
			funcCb(err["errcode"],null)
        }else{
            funcCb(0,{'code':0,'message':'success','data':objResult})
        }
    })
}
/*
创业合伙人申请
method   post
@params  {position:""}    传申请的职位
 */
$dao["entrepreneurship"]["participateEntrepreneurship"]=function(strUserID,entrepreneurship_participate,objQueryId,funcCb){
    var resumeidData = entrepreneurship_participate.resumeid
    async.waterfall([
        function(cb){
            objEntrepreneurshipColl.updateOne({"_id":objQueryId},{$push:{applyInfo:resumeidData}},function(err,insertResult){
                if(err){
                    cb({errcode:1002},null)
                }else{
                    cb(0,insertResult)
                }
            })
        },
        function(b,cb){
            objEntrepreneurshipColl.findOne({_id:objQueryId},function(err,findResult){
                if(err){
                    cb({errcode:1000},null)
                }else{

                    cb(0,findResult)
                }
            })
        }
    ],function(err,objResult){
        if(err){
			funcCb(err["errcode"],null)
        }else{
            funcCb(0,{'message':'申请成功',"code":0})
        }
    })

}