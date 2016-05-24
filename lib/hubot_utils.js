var robot;

var aToCurrency = {"usd": "$", "eur":"€"};
var currencyToA = {"$":"usd", "€": "eur"};
module.exports.aToCurrency = aToCurrency;
module.exports.currencyToA = currencyToA;


var setRobot = function(r){
	robot = r;
};
module.exports.setRobot = setRobot;
/*
* Every redis object from this module is prefixed by "ether_"
*/
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

var listAddrFromUser = function(user, callback){
	var list = robot.brain.get("ether_" + user) || [];
	if(list.length > 0){
		callback(null, list);
	}else{
		callback("No address found for user : "+ user , null);
	}
};
module.exports.listAddrFromUser = listAddrFromUser;

/*
* args : 
*	- Number of ether
* 	- Curency (symbol or letters)
*
* Throws exeption if no currency found !
*
*/
var ethToCurrency = function(eth, currency){
	var value = 0;
	var price = robot.brain.get("ether_price").price;

	if(price.hasOwnProperty(currency)){
		currencyMult = robot.brain.get("ether_price").price[currency];
	}else if(price.hasOwnProperty(currencyToA[currency])){
		currencyMult = robot.brain.get("ether_price").price[currencyToA[currency]];
	}else{
		throw "Currency not found";
	}

	value = eth*currencyMult;

	return value;
}
module.exports.ethToCurrency = ethToCurrency;
/*
* args : 
*	- Value to convert
* 	- Curency (symbol or letters)
*
* Throws exeption if no currency found !
*
*/
var currencyToEth = function(value, currency){
	var result = 0;
	var price = robot.brain.get("ether_price").price;

	if(price.hasOwnProperty(currency)){
		currencyMult = robot.brain.get("ether_price").price[currency];
	}else if(price.hasOwnProperty(currencyToA[currency])){
		currencyMult = robot.brain.get("ether_price").price[currencyToA[currency]];
	}else{
		throw "Currency not found";
	}

	result = value/currencyMult;

	return result;
}
module.exports.currencyToEth = currencyToEth;