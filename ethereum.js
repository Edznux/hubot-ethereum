// Description:
//   Allows hubot query ethereum blockchain and few ethereum api
//
// Dependencies:
//   hubot-brain-redis
//
// Configuration:
//   none
//
// Commands:
//   ethereum balance
//   ethereum check <address>
//
// Author:
//   Edouard SCHWEISGUTH <edznux@gmail.com> (https://edouard.schweisguth.fr)
//

var https = require("https");


function main(robot){
	
	var UNIT = 1000000000000000000;
	var aToCurrency = {"usd": "$", "eur":"€"};
	var currencyToA = {"$":"usd", "€": "eur"};
	var hu = require("./lib/hubot_utils.js");
	hu.setRobot(robot);
	console.log(hu);
	var eu = require("./lib/ethereum_utils.js");
	console.log(eu);
	var nanopool = require("./lib/nanopool.js");
	console.log(nanopool);
	


/*
	setInterval(function(){
		eu.getPrice(function(err,data){
			robot.brain.set("ether_price", data.price);
			console.log(robot.brain.get("ether_price"));
		}
	}), 60000);
*/
	robot.hear(/ethereum( .*)?/i, function(res){
		var addr, tmp, user;
		
		if(res.message.rawText.match(/^ethereum/i)){

			res.match[1] = res.match[1].trim();
			console.log(res.match[1]);

			switch(true){
				case /check/.test(res.match[1]):
					tmp = res.match[1].split(" ");
					addr = tmp[1];
					eu.getBalanceByAddr(addr, function(err, data){
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
					hu.addAddrToUser(tmp[1], user, function(err, data){
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
					hu.deleteAddrToUser(tmp[1], user, function(err, data){
						if(err){
							res.send(err);
						}else{
							res.send(data);
						}
					});
				break;
				case res.match[1] == "list":
					user = res.message.user.name.toLowerCase();
					hu.listAddrFromUser(user, function(err, data){
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
					eu.getTransactionByAddr(addr, function(err,data){
						if(err){
							console.error(err);
						}
					});
				break;
				case res.match[1] == "transaction":
					user = res.message.user.name.toLowerCase();
					eu.getTransactionByUser(user, function(err,data){
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
					nanopool.getBalanceByUser(user, function(err, balances){
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
					eu.getBalanceByUser(user, function(err,balances){
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
					eu.getBalanceByUser(user, function(err,balances){
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
						eu.getPrice(function(err, data){
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

