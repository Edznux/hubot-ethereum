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

var DEFAULT_PRICE_CURRENCY = "eur";
var SECOND_PRICE_CURRENCY = "usd";

function main(robot){
	
	var UNIT = 1000000000000000000;

	var hu = require("./lib/hubot_utils.js");
	hu.setRobot(robot);
	var eu = require("./lib/ethereum_utils.js");
	eu.setRobot(robot);
	var nanopool = require("./lib/nanopool.js");
	
	robot.hear(/ethereum( .*)?/i, function(res){
		if(res.message.rawText.match(/^ethereum/i)){

			res.match[1] = res.match[1].trim();
			switch(true){
				case /check/.test(res.match[1]):
					_check(res);
					break;
				case /add/.test(res.match[1]):
					_addAddr(res);
					break;
				case /(rm)|(delete)|(remove)/.test(res.match[1]):
					_deleteAddr(res);
					break;
				case res.match[1] == "list":
					_getList(res);
					break;
				case /transaction (.*)/.test(res.match[1]):
					_getTransactionByAddr(res);
					break;
				case res.match[1] == "transaction":
					_getTransaction(res);
					break;
				case /nanopool (.*)/.test(res.match[1]):
					_getNanopoolBalanceByCurrency(res);
					break;
				case res.match[1] == "nanopool":
				case res.match[1] == "nanopool balance":
					_getNanopoolBalance(res);
					break;

				case /balance (.*)/.test(res.match[1]) :
					_getBalanceByCurrency(res);
					break;

				case res.match[1] == "balance" :
					_getBalance(res);
					break;

				case res.match[1] == "price":
					_getPrice(res);
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
				" - balance <€ or $>: Get the balance of the current user in the provided currency",
				" - nanopool [balance] : Get nanopool balance of the current user (if the miner has mined something)",
				" - nanopool <€ or $> : Get nanopool balance of the current user in the provided currency",
				" - transaction : List latest transaction of the current user",
				" - price : value of ethereum",
				" - p : alias for price"
				].join("\n\t");
	}

	function _getBalance(res){
		var user = res.message.user.name.toLowerCase();
		var tmp = "";
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
	}

	function _getBalanceByCurrency(res){
		var currency = res.match[1].split(" ")[1];

		var user = res.message.user.name.toLowerCase();
		eu.getBalanceByUser(user, function(err,balances){
			var tmp = "";
			var data = balances.data;
			var total = 0;
			var value;

			if(err){
				res.send("Cannot get balance for user :", user);
				return;
			}
			
			for(var i=0; i < data.length; i++){
				value = hu.ethToCurrency(data[i].balance/UNIT, currency).value;
				tmp += "Adress : [`" + data[i].addr + "`] balance : [`" + value+ "`] \n";
				total += data[i].balance;
			}
			
			tmp += "-------\n";
			tmp += "Total : " + parseFloat(hu.ethToCurrency(total/UNIT, currency).value).toFixed(3) + currency + " over " + data.length + " account(s)";
			
			res.send(tmp);
		});
	}

	function _getTransaction(res){
		var user = res.message.user.name.toLowerCase();
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
	}

	function _getTransactionByAddr(res){
		var user = res.message.user.name.toLowerCase();
		var tmp = res.match[1].split(" ");
		var addr = tmp[2];
		eu.getTransactionByAddr(addr, function(err,data){
			if(err){
				console.error(err);
			}
			res.send(data);
		});
	}
	function _getNanopoolBalance(res){
		var user = res.message.user.name.toLowerCase();
		var tmp = "";
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
	}

	function _getNanopoolBalanceByCurrency(res){
		var user = res.message.user.name.toLowerCase();
		var tmp = "";
		var currency = res.match[1].split(" ")[1];
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
				tmp += "Adress : [" + data[i].addr + "] balance : ["+ parseFloat(hu.ethToCurrency(data[i].balance, currency).value).toFixed(3) + " "+ currency +"] \n";
				total += data[i].balance;
			}
			tmp += "-------\n";
			tmp += "Total : " + parseFloat(total*currencyMult).toFixed(3) + " "+ currency+ " over " + data.length + " account(s)";
			res.send(tmp);

		});
	}

	function _getList(res){
		var user = res.message.user.name.toLowerCase();
		var tmp = "";
		hu.listAddrFromUser(user, function(err, data){
			if(err){
				res.send(err);
			}else{
				for(var i =0; i<data.length; i++){
					tmp += data[i]+"\n";
				}
				res.send(tmp);
			}
		});
	}

	function _deleteAddr(res){
		var user = res.message.user.name.toLowerCase();
		var tmp = res.match[1].split(" ");

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
	}

	function _addAddr(res){
		var user = res.message.user.name.toLowerCase();
		var tmp = res.match[1].split(" ");
		console.log("Add address :", tmp[1], "to user :", user, "[", new Date(), "]");

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
	}

	function _check(res){
		var tmp = res.match[1].split(" ");
		var addr = tmp[1];
		eu.getBalanceByAddr(addr, function(err, data){
			if(err){
				res.send("Cannot get balance of " + addr);
				return;
			}
			console.log(data.data[0].balance);
			res.send("Balance : " + data.data[0].balance/UNIT + "ETH");
		});
	}
	function _getPrice(res){
		eu.getPrice(function(err, data){
			if(err){
				console.error("Erreur");
				res.send("Can't get price");
				return;
			}
			res.send("Current value of ether : "+ parseFloat(data.price[DEFAULT_PRICE_CURRENCY]).toFixed(3) + "€" + " ($" + parseFloat(data.price[SECOND_PRICE_CURRENCY]).toFixed(3) + ")");
		});
	}
}

module.exports = main;
