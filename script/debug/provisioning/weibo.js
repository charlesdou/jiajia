var db=connect("127.0.0.1:27017/maindb")

var users=[
    new ObjectId("57e1530abef390d05e294797"),
    new ObjectId("57e239f6e97b4ca1623462db"),
    new ObjectId("57e23a80e97b4ca1623462dc")
]

var arrObjs=[
    {
        subject:"图文微博测试",
        img_multi_weibos:[
            "/home/13917618429/20160913/1.jpg",
            "/home/13917618429/20160913/2.jpg"
        ],
        publish_user:users[0],
        loc_pubish:"南京东路",
        showloc:true,
        type:0,
        praises:0,
        forwards:0,
        allegations:0,
        comments:0
    },
    {
        subject:"简单投票测试",
        img_multi_weibos:[
            "/home/13917618429/20160913/1.jpg"
        ],
        publish_user:users[1],
        loc_publish:"南京西路",
        showloc:true,
        type:1,
        maxchoose:1,
        praises:0,
        allegations:0,
        forwards:0,
        comments:0
    },
    {
        subject:"投票测试帖",
        publish_user:users[2],
        loc_publish:"浦东陆家嘴",
        showloc:true,
        type:1,
        praises:0,
        allegations:0,
        forwards:0,
        comments:0
    }
]

var objOptions1=[
    {
        text:"喜欢",
        count:0
    },
    {
        text:"不喜欢",
        count:0
    }
]

var objOptions2=[
    {
        text:"A",
        img_option:"/home/13917618429/20160913/1.jpg",
        count:0
    },
    {
        text:"B",
        img_option:"/home/13917618429/20160913/1.jpg",
        count:0
    },
    {
        text:"C",
        img_option:"/home/13917618429/20160913/1.jpg",
        count:0
    }
]


var objWeibo1=arrObjs

for(var i=0;i<=188;i++){
    var dt=new Date()
    var id=new ObjectId()
    arrObjs[0]["_id"]=id
    arrObjs[0]["dt_publish"]=dt

    db.weibo.insert(arrObjs[0])

    dt=new Date()
    id=new ObjectId()
    arrObjs[1]["_id"]=id
    arrObjs[1]["dt_publish"]=dt
    db.weibo.insert(arrObjs[1])
    for(var j in objOptions1){
        objOptions1[j]["_id_weibo"]=id
    }
    db.weibo_option.insert(objOptions1)

    dt=new Date()
    id=new ObjectId()
    arrObjs[2]["_id"]=id
    arrObjs[2]["dt_publish"]=dt
    db.weibo.insert(arrObjs[2])
    for(var k in objOptions2){
        objOptions2[k]["_id_weibo"]=id
    }
    db.weibo_option.insert(objOptions2)
}



