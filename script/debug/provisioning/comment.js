var db=connect("127.0.0.1:27017/maindb")
var users=[
    new ObjectId("57e1530abef390d05e294797"),
    new ObjectId("57e239f6e97b4ca1623462db"),
    new ObjectId("57e23a80e97b4ca1623462dc")
]
var objWeiboID=new ObjectId("57e644d7fd1019197ff14f42")


var comments=[
    {
        _id_weibo:objWeiboID,
        owner:users[2],
        user:users[0],
        comment:"不错1",
        newest_replies:[],
        reply_count:0
    },
    {
        _id_weibo:objWeiboID,
        owner:users[2],
        user:users[1],
        comment:"不错2",
        newest_replies:[],
        reply_count:0
    },
    {
        _id_weibo:objWeiboID,
        owner:users[2],
        user:users[0],
        comment:"不错3",
        newest_replies:[],
        reply_count:0
    }
]



for(var i=0;i<35;i++){
    for(var j=0;j<3;j++){
        comments[j]["dt_comment"]=new Date()
        db.comment.insert(comments[j])
    }
}




