var https = require("https");

var hu = require("./hubot_utils.js");

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

var getTransactionByUser = function(user, callback){
	console.log("user : ", user);
	hu.listAddrFromUser(user, function(err, list){
		console.log("list : ", list);
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

var getPrice = function(callback){
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
module.exports.getPrice = getPrice;