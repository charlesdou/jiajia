/**
 * Created by doucharles1 on 16/9/24.
 */
var db=connect("127.0.0.1:27017/maindb")

var objCommentID=new ObjectId("57e644d7fd1019197ff14f42")
var ownerID=new ObjectId("57e23a80e97b4ca1623462dc")
var users=[
    new ObjectId("57e1530abef390d05e294797"),
    new ObjectId("57e239f6e97b4ca1623462db"),
    new ObjectId("57e23a80e97b4ca1623462dc")
]

var replies=[
    {
        _id_comment:objCommentID,
        owner:ownerID,
        user:users[1],
        content:"哈哈1",
        to:users[2]
    },
    {
        _id_comment:objCommentID,
        owner:ownerID,
        user:users[2],
        content:"哈哈2",
        to:users[1]
    },
    {
        _id_comment:objCommentID,
        owner:ownerID,
        user:users[1],
        content:"哈哈3",
        to:users[2]
    }
]

for(var i=0;i<35;i++){
    for(var j=0;j<3;j++){
        replies[j]["dt_reply"]=new Date()
        db.reply.insert(replies[j])
    }
}