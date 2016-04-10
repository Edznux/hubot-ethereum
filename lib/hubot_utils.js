var robot;

var setRobot = function(r){
	robot = r;
};
module.exports.setRobot = setRobot;

var addAddrToUser = function (addr, user, callback){
	var list = robot.brain.get("ether_" + user) || [];

	if(list.indexOf(addr) == -1){
		list.push(addr);
		robot.brain.set("ether_" + user, list);
		callback(null, "Address added !");
	}else{
		callback("Address already exist", null);
	}
};
module.exports.addAddrToUser = addAddrToUser;

var deleteAddrToUser = function(addr, user, callback){
	var list = robot.brain.get("ether_" + user) || [];
	var pos = list.indexOf(addr);
	if( pos !== -1){
		list.splice(pos, 1);
		robot.brain.set("ether_" + user, list);
		callback(null, "Address deleted !");
	}else{
		callback("Address doesn't exist !", null);
	}
};
module.exports.deleteAddrToUser = deleteAddrToUser;

var listAddrFromUser = function (user, callback){
	var list = robot.brain.get("ether_" + user) || [];
	if(list.length > 0){
		callback(null, list);
	}else{
		callback("No address found for user : "+ user , null);
	}
};
module.exports.listAddrFromUser = listAddrFromUser;