var https = require("https");
var hu = require("./hubot_utils.js");
var interval = 60*10*1000; // 10 min interval in ms

/**
* Just needed for robot.brain.set and get functions
*/
var setRobot = function(r){
	robot = r;
};
module.exports.setRobot = setRobot;

/**
* Return balance for the address provided in parameters
* Params:
* 	- addr : string of the address.
*	- callback : callback function. (err, data);
*/
var getBalanceByAddr = function(addr, callback){
	var baseUrl = "https://etherchain.org/api/account/";
	var addr_call = baseUrl+addr;

	https.get(addr_call,function(res){
		var data="";
		var err = null;

		res.on('data', function(d) {
			data+=d;
		});

		res.on('end', function(){
			try{
				data = JSON.parse(data);
				if(data.status !== 1){
					callback("Erreur dans la balance", null);
				}else{
					callback(err, data);
				}
			}catch(e){
				console.log('Erreur dans la recuperation de la balance : ', e);
				console.log(data);
				return callback("Erreur dans la balance", null);
			}
		});
	});
};
module.exports.getBalanceByAddr = getBalanceByAddr;
/**
* Return balance for all address of an user
* Params:
* 	- user : string of the user (name/UID).
*	- callback : callback function. (err, data);
*/
var getBalanceByUser = function(user, callback){
	hu.listAddrFromUser(user, function(err, list){
		var accounts = {};
			accounts.data = [];
		var done = 0;

		if(err){
			return callback(err, null);
		}
		
		if(list.length == 0){
			return callback("No addresses found", null);
		}

		for(var i = 0; i < list.length; i++){
			(function(l, index, output){
				var addr = l[index];
				getBalanceByAddr(addr, function(err, data){

					if(err){
						return callback(err, null);
					}
					if(data.success){
						accounts.success = 1;
					}
					accounts.data.push({"addr" : addr, "balance" : data.data[0].balance});
					done++;

					console.log(done + '/' + l.length);
					
					if(done == l.length){
						return callback(null, accounts);
					}
				});
			})(list, i, accounts);
		}
	
	});
};
module.exports.getBalanceByUser = getBalanceByUser;

/*
* Return all transaction made (well, actually, only the first "page") by address
* Params:
* 	- addr : string of the address.
*	- offset : page number
*	- callback : callback function. (err, data);
*/
var getTransactionByAddr = function(addr, offset, callback){
	// set default and errored offset to 0
	if(!offset || offset < 0){
		offset = 0;
	}
	var baseUrl = "https://etherchain.org/api/account/";
	var addr_call = baseUrl+addr+"/tx/"+offset;

	https.get(addr_call,function(res){
		var data="";

		res.on('data', function(d) {
			data+=d;
		});

		res.on('end', function(){
			try{
				console.log(data);
				data = JSON.parse(data);

				if(data.status == 1){
					delete data.status;
					callback(null, data);
				}else{
					callback("Erreur dans les transactions", null);
				}
			}catch(e){
				console.error('Erreur dans la recuperation des transactions : ', e);
				// console.log(data);
				callback("Erreur dans les transactions" + e, null);
			}
		});
	});
};
module.exports.getTransactionByAddr = getTransactionByAddr;

/**
* Return all transaction made (well, actually, only the first "page") by an user
* Params:
* 	- user : string of the user (name/UID).
*	- callback : callback function. (err, data);
*/
var getTransactionByUser = function(user, callback){
	hu.listAddrFromUser(user, function(err, list){
		var tx = [];
		var done = 0;

		if(err){
			return callback(err, null);
		}
		for(var i = 0; i < list.length; i++){
			(function(l, index, output){
				var addr = l[index];
				getTransactionByAddr(addr, 0,function(err, data){

					if(err){
						return callback(err, null);
					}
					tx = data.data;
					console.log("tx :", tx);
					done++;

					console.log(done + '/' + l.length);
					
					if(done == l.length){
						return callback(null, tx);
					}
				});
			})(list, i, tx);
		}
	
	});
};
module.exports.getTransactionByUser = getTransactionByUser;

/**
* Private method for getting price of ether from different currency :
* usd, eur, cny, gbp, cad, rub, hkd, jpy, aud, btc 
* This request provide price, market cap, supply and volume
*/
var _getPrice = function(callback){
	// https://coinmarketcap-nexuist.rhcloud.com/api/eth
	var http = require("https");

	var options = {
		"method": "GET",
		"hostname": "coinmarketcap-nexuist.rhcloud.com",
		"port": null,
		"path": "/api/eth"
	};

	var req = http.request(options, function (res) {
		var chunks = [];

		res.on("data", function (chunk) {
			chunks.push(chunk);
		});

		res.on("end", function () {
			var body = Buffer.concat(chunks);
			var data = JSON.parse(body);
			callback(null, data);
		});
	});

	req.end();
};

/**
* Wrapper for getPrice, get price from memory instead of request whenever possible. 
*/
var getPrice = function(callback){
	var _price = robot.brain.get("ether_price");

	if((parseInt(_price.requestTimestamp)*1000)-interval < Date.now()){
		console.warn("get price from internet");
		_getPrice(callback);
	}else{
		console.warn("get price from memory");
		callback(null, robot.brain.get("ether_price"));
	}
};
module.exports.getPrice = getPrice;

/**
* Care : Writing to requestTimestamp instead of timestamp on the "data" object.
* The actual "timestamp" object is not the timestamp of the request but the timestamp of the update in their system.
*/
function init(){
	
	_getPrice(function(err, data){
		console.warn("Get price init");
		if(err){
			console.error("Error in getPrice", err);
		}
		data.requestTimestamp = Date.now();
		robot.brain.set("ether_price", data);
	});

	setInterval(function(){
		console.warn("Starting getPrice interval");
		_getPrice(function(err, data){
			if(err){
				console.error("Error in getPrice", err);
			}
			data.requestTimestamp = Date.now();
			robot.brain.set("ether_price", data);
			console.warn("getPrice interval ended : ", data);
		});
	},interval);
}
init();