var ObjectID=require("mongodb").ObjectID
$load("FileManager.js")
$load("MyUtil.js")
var objPracticeColl=$objMongoColls["maindb"]["practice"]

//实习发布
$dao["practice"]["newPractice"]=function(strUserID,practice,funcCb){
    practice.dt_publish=+new Date
    practice.headcount=~~practice.headcount
    practice.posts=JSON.parse(practice.posts)
    objPracticeColl.insertOne(practice,function(err,insertResult){
        if(err){
            $cmn["file"].delete([practice["img_logo"]].concat(practice["attachment_multi"]).concat(practice["poster_multi"]||[]),function(errcode){
                funcCb(1000,null)
            })
        }
        else{
            funcCb(0,{'message':'success'})
        }
    })
}

//实习列表
$dao["practice"]["practiceList"]=function(funcCb){
    objPracticeColl.find().sort({dt_publish:-1}).toArray(function(err,documents){
        if(err){
            funcCb(1001,null)
        }else{
            documents.forEach(function(v){
                v.posts&&(v.posts=v.posts.filter(function(vv,i){
                    vv.id=i
                    return !vv.fail
                }))
            })
            funcCb(0,documents)
        }
    })
}

//实习详情
$dao["practice"]["practiceDetail"]=function(query,funcCb){
    objPracticeColl.find(query).toArray(function(err,documents){
        if(err){
            funcCb(1001,null)
        }else{
            documents[0].posts&&(documents[0].posts=documents[0].posts.filter(function(vv,i){
                vv.id=i
                return !vv.fail
            }))
            funcCb(0,documents[0])
        }
    })
}