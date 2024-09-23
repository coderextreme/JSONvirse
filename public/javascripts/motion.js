// NOTE: Not used.  See ConnectionScript.js
var io = require('socket.io-client');

var socket = io("https://localhost:8080/yottzumm/socket.io", {
    maxHttpBufferSize: 1e9, pingTimeout: 60000,
    transports: [ "polling", "websocket" ]
});

if (socket === null) {
	console.log("Didn't connect!");
} else {
	console.log("Connect!");
}

var nameToToken = {};
var players = [];
var thisplayer = -1;
var x3d_serverupdate =  function (playernumber, position, orientation, petName) {
	console.log("oops!", playernumber, position, orientation, petName);
}
var UserGlobalGroups = null;
