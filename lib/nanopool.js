var https = require("https");
var hu = require("./hubot_utils.js");
var getBalanceByAddr = function (addr, callback){

	var baseUrl = "https://eth.nanopool.org/api/";
	var method_url = "balance_hashrate/";
	var addr_call = baseUrl + method_url + addr;
	https.get(addr_call,function(res){
		var data="";
		var err = null;

		res.on('data', function(d) {
			data+=d;
		});

		res.on('end', function(){
			try{
				data = JSON.parse(data);
				return callback(err, data);

			}catch(e){
				console.log('Erreur dans la recuperation de la balance : ', e);
				console.log(data);
				return callback("Erreur dans la balance", null);
			}
		});
	});
};
module.exports.getBalanceByAddr = getBalanceByAddr;

var getBalanceByUser = function (user, callback){
	hu.listAddrFromUser(user, function(err, list){
		var accounts = {};
			accounts.data = [];
		var done = 0;

		if(err){
			return callback(err, null);
		}
		for(var i = 0; i < list.length; i++){
			(function(l, index, output){
				var addr = l[index];
				getBalanceByAddr(addr, function(err, data){
					console.log(data);
					if(err){
						console.error("cannot get : " + addr + " address for nanopool");
					}
					if(data && data.status){
						accounts.data.push({"addr" : addr, "balance" : data.data.balance});
					}
					console.log(done + '/' + l.length);
					
					done++;
					if(done == l.length){
						return callback(null, accounts);
					}
				});
			})(list, i, accounts);
		}
	
	});
};
module.exports.getBalanceByUser = getBalanceByUser;
