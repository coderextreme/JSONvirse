var socket = io({
    maxHttpBufferSize: 1e9, pingTimeout: 60000,
    transports: [ "polling", "websocket" ]
});

if (socket === null) {
	console.log("Oops, didn't connect!");
}

var nameToToken = {};
var players = [];
var thisplayer = -1;
var x3d_serverupdate =  function (playernumber, position, orientation, petName) {
	console.log("oops!", playernumber, position, orientation, petName);
}
var UserGlobalGroups = null;
