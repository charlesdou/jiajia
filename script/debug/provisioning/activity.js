var db=connect("127.0.0.1:27017/maindb")

var user=db.user.findOne({username:"13917618429"})["_id"]
var user2=db.user.findOne({username:"18616237452"})["_id"]

var arrActivities=[
	{
		type:0,
    	_id_publish_user:user 
    	title:"aaa",
    	img_logo:"",
    	img_poster："",
    	description:"aaa",
    	dt_end_enrollment:new Date(),
    	status:2,
    	applies:0,
    	participants:0,
    	completes:0,
    	min_applies:1,
    	integral:1,
    	remarks:0,
	},
	{
		type:1,
    	_id_publish_user:user 
    	title:"bbb",
    	img_logo:"",
    	img_poster："",
    	description:"bbb",
    	dt_end_enrollment:new Date(),
    	status:0,
    	applies:0,
    	participants:0,
    	completes:0,
    	min_applies:1,
    	integral:1,
    	remarks:0,
	},
	{
		type:0,
    	_id_publish_user:user 
    	title:"ccc",
    	img_logo:"",
    	img_poster："",
    	description:"ccc",
    	dt_end_enrollment:new Date(),
    	status:2,
    	applies:0,
    	participants:0,
    	completes:0,
    	min_applies:1,
    	integral:1,
    	remarks:0,
	},
	{
		type:1,
    	_id_publish_user:user 
    	title:"ddd",
    	img_logo:"",
    	img_poster："",
    	description:"ddd",
    	dt_end_enrollment:new Date(),
    	status:0,
    	applies:0,
    	participants:0,
    	completes:0,
    	min_applies:1,
    	integral:1,
    	remarks:0,
	},
	{
		type:0,
    	_id_publish_user:user 
    	title:"eee",
    	img_logo:"",
    	img_poster："",
    	description:"eee",
    	dt_end_enrollment:new Date(),
    	status:2,
    	applies:0,
    	participants:0,
    	completes:0,
    	min_applies:1,
    	integral:1,
    	remarks:0,
	}
]

for(var i=0;i<30;i++){
	for(var j in arrActivities){
		var tmp=arrActivities[j]
		tmp["dt_publish"]=new Date()
		tmp["debug_test"]=true
		db.activity.insert(tmp)
	}
}

var activityid=db.activity.findOne({debug_test:true})["_id"]

var arrRemarks=[
	{
		_id_activity:activityid,
    	_id_user:user,
    	content:"aaa"
	},
	{
		_id_activity:activityid,
    	_id_user:user,
    	_id_to:user2,
    	content:"bbb"
	}
]

for(var i=0;i<100;i++){
	for(var j in arrRemarks){
		var tmp=arrRemarks[j]
		tmp["dt_publish"]=new Date()
		tmp["debug_test"]=true
		db.activity_remark.insert(tmp)
	}
}