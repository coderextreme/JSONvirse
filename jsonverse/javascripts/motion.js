var socket = io({
  transports: ["polling", "websocket", "webtransport"]
});
var sockets = {};
var nameToToken = {};
var players = [];
var thisplayer = -1;
var x3d_serverupdate =  function (playernumber, position, orientation, petName) {
	console.log("oops!", playernumber, position, orientation, petName);
}
var UserGlobalGroups = null;
