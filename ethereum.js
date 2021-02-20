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
import {version} from './package.json';

var DEFAULT_PRICE_CURRENCY = "EUR";
var SECOND_PRICE_CURRENCY = "USD";

function main(robot){
	console.log("hubot ethereum version", version)
	var UNIT = 1000000000000000000;

	var hu = require("./lib/hubot_utils.js");
	hu.setRobot(robot);
	var eu = require("./lib/ethereum_utils.js");
	eu.setRobot(robot);
	var nanopool = require("./lib/nanopool.js");

	robot.hear(/(?:ethereum|eth)( .*)?/i, function(res){
		if(res.message.rawText.match(/^(?:ethereum|eth)/i)){

			res.match[1] = res.match[1].trim();
			switch(true){
				case /check/.test(res.match[1]):
					if(/\$|\€/.test(res.match[1])){
						console.info("€ or $ found");
						_checkByCurrency(res);
					}else{
						console.info("€ or $ NOT found");
						_check(res);
					}
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
				case /graph(.*)/.test(res.match[1]):
					_printGraph(res);
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
				case res.match[1] == "version":
						res.send(require("./package.json").version);
					break;

				case res.match[1] == "?":
				case res.match[1] == "help":
					res.send(getHelp());
					break;
				case /convert (.*)/.test(res.match[1]):
					_getConvertion(res);
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
				" - delete <address> : Delete address from your user",
				" - remove <address> : Alias for delete",
				" - rm <address> : Alias for delete",
				" - list : list addresses from the current user",
				" - balance : Get the balance of the current user",
				" - balance <€ or $> : Get the balance of the current user in the provided currency",
				" - nanopool [balance] : Get nanopool balance of the current user (if the miner has mined something)",
				" - nanopool <€ or $> : Get nanopool balance of the current user in the provided currency",
				" - transaction : List latest transaction of the current user",
				" - check <address> : Get balance from the address provided",
				" - price : value of ethereum",
				" - convert <value> <from> <to> : convert value from currency to another (<to> default = eth)",
				" - p : alias for price",
				" - graph [<period> <format>]",
				" - version : Print current version of hubot-ethereum",
				" - help : Print this help",
				" - ? : Alias for help"
				].join("\n\t");
	}

	/*
	* eth graph [<period> <format>]
	* period in [24h, 7d, 30d, 1y] 
	* Format in [png,svg]
	* Send the graph link in response
	*
	* Print the btc graph for the period giver
	* @params :
	*       - res : response from robot
	*/

	function _printGraph(res){
		
		var user = res.message.user.name.toLowerCase();
		var split = res.match[1].split(" ");
		var period = split[1] || "24h";
		var format = split[2] || "png";

		if( !(format == "svg" || format == "png")){
			return res.send("Unsupported format");
		}
		
		if( !(period == "24h" || period == "7d" || period == "30d" || period == "1y") ){
			return res.send("Format not in 24h, 7d, 30d, 1y");
		}

		var url = "https://cryptohistory.org/charts/dark/eth-usdt/"+period+"/"+format+"?nonce="+Math.floor(Math.random()*10000);
		
		res.send("Graph : ETH / usdt over " + period+ "\n"+ url )
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
			console.error("======", balances);
			data = balances.data;
			for(var i=0; i < data.length; i++){
				tmp += "Adress : [`" + data[i].addr + "`] balance : [`"+ data[i].balance/UNIT + " ETH`] \n";
				total += data[i].balance;
			}
			tmp += "-------\n";
			tmp += "Total : `" + parseFloat(total/UNIT).toFixed(3) + "` ETH over " + data.length + " account(s)";
			res.send(tmp);
		});
	}

	function _getBalanceByCurrency(res){
		var currency = res.match[1].split(" ")[1];

		var user = res.message.user.name.toLowerCase();
		eu.getBalanceByUser(user, function(err,balances){
			var tmp = "";
			var data;
			var total = 0;
			var value;
			
			if(balances.data){
				data = balances.data;
			}else{
				err = "Empty balances"
			}

			if(err){
				res.send("Cannot get balance for user :", user);
				return;
			}
			try{
				for(var i=0; i < data.length; i++){
					value = hu.ethToCurrency(data[i].balance/UNIT, currency);
					tmp += "Adress : [`" + data[i].addr + "`] balance : [`" + value+ "`] \n";
					total += data[i].balance;
				}
				tmp += "-------\n";
				tmp += "Total : `" + parseFloat(hu.ethToCurrency(total/UNIT, currency)).toFixed(3) + currency + "` over " + data.length + " account(s)";

				res.send(tmp);

			}catch(e){
				res.send("Cannot get balance by currency : " + e);
			}

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
				tmp += "Adress : [`" + data[i].addr + "`] balance : [`"+ data[i].balance + " ETH`] \n";
				total += data[i].balance;
			}
			tmp += "-------\n";
			tmp += "Total : `" + total + " ETH` over " + data.length + " account(s)";
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

			try{
				for(var i = 0; i < data.length; i++){
					tmp += "Adress : [`" + data[i].addr + "`] balance : [`"+ parseFloat(hu.ethToCurrency(data[i].balance, currency)).toFixed(3) + " "+ currency +"`] \n";
					total += data[i].balance;
				}
				tmp += "-------\n";
				tmp += "Total : `" + parseFloat(total*currencyMult).toFixed(3) + " "+ currency+ "` over " + data.length + " account(s)";
				res.send(tmp);

			}catch(e){
				res.send("Cannot get nanopool balance by currency : " +e);
				return;
			}

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
			res.send("Balance : `" + data.data[0].balance/UNIT + " ETH`");
		});
	}

	function _checkByCurrency(res){
		var tmp = res.match[1].split(" ");
		var addr = tmp[1];
		var currency = tmp[2];
		eu.getBalanceByAddr(addr, function(err, data){
			if(err){
				res.send("Cannot get balance of " + addr);
				return;
			}
			console.log(data.data[0].balance);
			try{
				res.send("Balance : `" + parseFloat(hu.ethToCurrency(data.data[0].balance/UNIT, currency)).toFixed(3) + " " +currency + "`");
			}catch(e){
				res.send("Cannot check address by currency : " + e);
			}
		});
	}

	function _getPrice(res){
		eu.getPrice(function(err, data){
			if(err){
				console.error("Error" + err);
				res.send("Can't get price");
				return;
			}
			console.log("Current data is : ", data)
			res.send("Current value of ether : `"+ parseFloat(data[DEFAULT_PRICE_CURRENCY]).toFixed(3) + DEFAULT_PRICE_CURRENCY + " (" + parseFloat(data[SECOND_PRICE_CURRENCY]).toFixed(3) + SECOND_PRICE_CURRENCY + ")`");
		});
	}

	function _getConvertion(res){
		var split = res.match[1].split(" ");
		//split 0 == "convert"
		var value = split[1];
		var base = split[2];
		var dest = split[3] || "eth"; // "eth" not required
		console.log("Value :", value);
		console.log("base :", base);
		console.log("dest :", dest);

		if(dest == "€" || dest == "$"){
			res.send(value + " " + base + " = " + parseFloat( hu.ethToCurrency(value, dest) ).toFixed(3) + " "+ dest);
		}else if(dest == "eth"){
			res.send(value + " " + base + " = " + parseFloat( hu.currencyToEth(value, base) ).toFixed(3) + " "+ dest);
		}

	}
}

module.exports = main;
