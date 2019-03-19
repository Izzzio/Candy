const Candy = require('../../candy.js');

const MESSAGE_ID = 'test';

function sendMessage(to, message){
	let msg = candy.starwave.createMessage(message,to,undefined, MESSAGE_ID);
	candy.starwave.sendMessage(msg);
	console.log('Sending ',message);
}

let pingCount = 0;

var candy = new Candy(["ws://176.9.104.200:6031"]).start();
candy.recieverAddress = 'first';
candy.onready = function () {
	setInterval(function(){
		pingCount ++;
		sendMessage('second', 'Ping '+pingCount);
	}, 1000);
};
