// Description:
//   Allows hubot query ethereum blockchain
//
// Dependencies:
//
// Configuration:
//   none
// Commands:
//   ethereum balance
//   ethereum check <address>
//
// Author:
//   Edouard SCHWEISGUTH <edznux@gmail.com> (https://edouard.schweisguth.fr)
//

var https = require("https");
var UNIT = 1000000000000000000;
var aToCurrency = {"usd": "$", "eur":"€"};
var currencyToA = {"$":"usd", "€": "eur"};

function main(robot){
	
	setInterval(getPrice(function(err,data){
		robot.brain.set("ether_price", data.price);
		console.log(robot.brain.get("ether_price"));
	}), 60000);

	robot.hear(/ethereum( .*)?/i, function(res){
		var addr, tmp, user;
		
		if(res.message.rawText.match(/^ethereum/i)){

			res.match[1] = res.match[1].trim();
			console.log(res.match[1]);

			switch(true){
				case /check/.test(res.match[1]):
					tmp = res.match[1].split(" ");
					addr = tmp[1];
					getBalanceByAddr(addr, function(err, data){
						if(err){
							res.send("Cannot get balance of " + addr);
							return;
						}
						console.log(data.data[0].balance);
						res.send("Balance : " + data.data[0].balance/UNIT + "ETH");
					});
				break;
				case /add/.test(res.match[1]):
					user = res.message.user.name.toLowerCase();
					tmp = res.match[1].split(" ");
					console.log("Add address :", tmp[1], "to user :", user,"[",new Date(), "]");

					if(tmp.length < 2){
						res.send("Syntax error");
						return;
					}
					addAddrToUser(tmp[1], user, function(err, data){
						if(err){
							res.send(err);
						}else{
							res.send(data);
						}
					});
				break;
				case /(rm)|(delete)|(remove)/.test(res.match[1]):
					user = res.message.user.name.toLowerCase();
					tmp = res.match[1].split(" ");
					console.log("remove address :", tmp[1], "from user :", user,"[",new Date(), "]");

					if(tmp.length < 2){
						res.send("Syntax error");
						return;
					}
					deleteAddrToUser(tmp[1], user, function(err, data){
						if(err){
							res.send(err);
						}else{
							res.send(data);
						}
					});
				break;
				case res.match[1] == "list":
					user = res.message.user.name.toLowerCase();
					listAddrFromUser(user, function(err, data){
						if(err){
							res.send(err);
						}else{
							tmp = "";
							for(var i =0; i<data.length; i++){
								tmp += data[i]+"\n";
							}
							res.send(tmp);
						}
					});
				break;
				case /transaction (.*)/.test(res.match[1]):
					user = res.message.user.name.toLowerCase();
					tmp = res.match[1].split(" ");
					getTransactionByAddr(addr, function(err,data){
						if(err){
							console.error(err);
						}
					});
				break;
				case res.match[1] == "transaction":
					user = res.message.user.name.toLowerCase();
					getTransactionByUser(user, function(err,data){
						if(err){
							console.error(err);
							res.send("Can't  get transation for the user :" + user);
							return;
						}
						tmp = "";
						console.log(data);
						var m, dateString;

						for(var i = 0; i< data.length && i < 10; i++){
							m = new Date(data[i].time);
							dateString = m.getUTCFullYear() +"/"+
								("0" + (m.getUTCMonth()+1)).slice(-2) +"/"+
								("0" + m.getUTCDate()).slice(-2) + " " +
								("0" + m.getUTCHours()).slice(-2) + ":" +
								("0" + m.getUTCMinutes()).slice(-2) + ":" +
								("0" + m.getUTCSeconds()).slice(-2);
							tmp += "From : [`" + data[i].sender + "`] to [`" + data[i].recipient + "`] amount : `" + data[i].amount/UNIT + " ETH` Date " + dateString +"\n";
						}
						res.send("List of latest transactions \n" + tmp);

					});
				break;

				case res.match[1] == "nanopool":
				case res.match[1] == "nanopool balance":
					console.log(res.match[1]);
					user = res.message.user.name.toLowerCase();
					tmp = "";
					var total = 0;
					getNanopoolBalanceByUser(user, function(err, balances){
						console.log(err,balances);
						if(err){
							console.error(err);
							res.send(err);
							return;
						}
						data = balances.data;
						if(err){
							res.send("Cannot get balance for user :", user);
							return;
						}
						for(var i = 0; i < data.length; i++){
							tmp += "Adress : [" + data[i].addr + "] balance : ["+ data[i].balance + " ETH] \n";
							total += data[i].balance;
						}
						tmp += "-------\n";
						tmp += "Total : " + total + " ETH over " + data.length + " account(s)";
						res.send(tmp);

					});
					break;
				case /balance (.*)/.test(res.match[1]) :

					tmp = res.match[1].split(" ");
					var currencyMult; 
					if(tmp[1] == "$" || tmp[1] == "€"){
						currencyMult = robot.brain.get("ether_price")[currencyToA[tmp[1]]];
					}
					else if(tmp[1] == "eur" || tmp[1] == "usd"){
						currencyMult = robot.brain.get("ether_price")[tmp[1]];
					}else{
						res.send("Currency not found");
					}
					user = res.message.user.name.toLowerCase();
					tmp = "";
					var total = 0;
					getBalanceByUser(user, function(err,balances){
						if(err){
							res.send("Cannot get balance for user :", user);
							return;
						}
						data = balances.data;
						for(var i=0; i < data.length; i++){
							tmp += "Adress : [" + data[i].addr + "] balance : ["+ (data[i].balance/UNIT) * currencyMult + "] \n";
							total += data[i].balance;
						}
						tmp += "-------\n";
						tmp += "Total : " + (total/UNIT) * currencyMult + " over " + data.length + " account(s)";
						res.send(tmp);
					});
				break;
				case res.match[1] == "balance" :
					user = res.message.user.name.toLowerCase();
					tmp = "";
					var total = 0;
					getBalanceByUser(user, function(err,balances){
						if(err){
							res.send("Cannot get balance for user :", user);
							return;
						}
						data = balances.data;
						for(var i=0; i < data.length; i++){
							tmp += "Adress : [" + data[i].addr + "] balance : ["+ data[i].balance/UNIT + " ETH] \n";
							total += data[i].balance;
						}
						tmp += "-------\n";
						tmp += "Total : " + total/UNIT + " ETH over " + data.length + " account(s)";
						res.send(tmp);
					});
				break;
				case res.match[1] == "price":
						getPrice(function(err, data){
							if(err){
								console.error("Erreur");
								res.send("Can't get price");
								return;
							}
							res.send("Current value of ether : "+ parseFloat(data.price.eur).toFixed(3) + "€" + " ($" + parseFloat(data.price.usd).toFixed(3) + ")");
						});
					break;
				case res.match[1] == "?":
				case res.match[1] == "help":
					res.send(getHelp());
					break;

				default:
					res.send(getHelp());
					break;
			}
		}
	});

	function addAddrToUser(addr, user, callback){
		var list = robot.brain.get("ether_" + user) || [];

		if(list.indexOf(addr) == -1){
			list.push(addr);
			robot.brain.set("ether_" + user, list);
			callback(null, "Address added !");
		}else{
			callback("Address already exist", null);
		}
	}

	function deleteAddrToUser(addr, user, callback){
		var list = robot.brain.get("ether_" + user) || [];
		var pos = list.indexOf(addr);
		if( pos !== -1){
			list.splice(pos, 1);
			robot.brain.set("ether_" + user, list);
			callback(null, "Address deleted !");
		}else{
			callback("Address doesn't exist !", null);
		}
	}

	function listAddrFromUser(user, callback){
		var list = robot.brain.get("ether_" + user) || [];
		if(list.length > 0){
			callback(null, list);
		}else{
			callback("No address found for user : "+ user , null);
		}
	}

	function getNanopoolBalanceByAddr(addr, callback){

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
	}

	function getBalanceByAddr(addr, callback){
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
	}

	function getBalanceByUser(user, callback){
		listAddrFromUser(user, function(err, list){
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
	}

	function getTransactionByAddr(addr, offset, callback){
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
	}

	function getTransactionByUser(user, callback){
		console.log("user : ", user);
		listAddrFromUser(user, function(err, list){
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
	}
	
	function getNanopoolBalanceByUser(user, callback){
		listAddrFromUser(user, function(err, list){
			var accounts = {};
				accounts.data = [];
			var done = 0;

			if(err){
				return callback(err, null);
			}
			for(var i = 0; i < list.length; i++){
				(function(l, index, output){
					var addr = l[index];
					getNanopoolBalanceByAddr(addr, function(err, data){
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
	}

	function getPrice(callback){
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
	}

	function getHelp(){
		return [
			"Ethereum commands",
				" - add <address> : Attach address to your user",
				" - list : list addresses from the current user",
				" - check <address> : Get balance from the address provided",
				" - balance : Get the balance of the current user",
				" - nanopool [balance] : Get nanopool balance of the current user (if the miner has mined something)",
				" - ethpool [balance] : Get ethpool balance of the current user (if the miner has mined something)",
				" - ethereumpool [balance] : Get ethereumpool balance of the current user (if the miner has mined something)",
				" - transaction : List latest transaction of the current user",
				" - price : value of ethereum",
				" - p : alias for price"
				].join("\n\t");
	}
}

module.exports = main;

