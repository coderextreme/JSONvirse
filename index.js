var express = require('express');
var app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow requests from any origin
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var http = require('http').Server(app);
var io = require('socket.io')(http, {
    maxHttpBufferSize: 1e8, pingTimeout: 60000,
    transports: ["polling", "websocket", "webtransport"] // WebTransport is not enabled by default
});

var metaServer = process.env.METASERVER || "";
if (metaServer != "") {
	var Client = require('node-rest-client').Client;
	var client = new Client();
}
app.use(express.static(__dirname + '/jsonverse'));
// app.use(express.static(__dirname));
var router = express.Router();
var cardsTaken = {};
router.route('/servers')
        .get(function(req, res) {
			// console.log(res);
		try {
			if (metaServer != "") {
				client.get(metaServer+"/api/servers/", function(gameServers, response){
					console.log(gameServers);
					res.json(JSON.parse(gameServers));
				});
			}
		} catch (e) {
			console.error("Start meta server first.");
			console.log(e);
		}
        });
app.use('/api', router);


function Multiplayer() {
}

var maxplayers = 0;
var players = {};
var oldplayers = {};

function reportPlayers(socket) {
	var numPlayers = 0;
	for (var p in players) {
		numPlayers++;
	}
	io.emit('servermessage', "The server has "+numPlayers+" resident"+(numPlayers > 1 ? "s." : "."));
	var uri = socket.handshake.headers.referer;
	if (typeof uri !== 'undefined') {
		var hostIndex = uri.indexOf("//")+2;
		var trailing = uri.indexOf("/", hostIndex)-hostIndex;
		var hostport = uri.substr(hostIndex, trailing);
		var portIndex = -1;
		portIndex = hostport.indexOf(":");
		var host = "localhost";
		var port = 51000;
		if (portIndex >= 0) {
			host = hostport.substr(0, portIndex);
			port = hostport.substr(portIndex+1);
		} else {
			host = hostport;
			port = 80;
		}
		var args = { path:{"host": host, port: port, players: numPlayers}};
		try {
			if (metaServer != "") {
				console.log("Connecting to meta server at ", metaServer+"/api/servers/"+host+"/"+port+"/"+numPlayers);
				client.get(metaServer+"/api/servers/${host}/${port}/${players}", args, function(data, response){
				// console.log(data);
				// console.log(response);
				});
			}
		} catch (e) {
			console.log(e);
		}
	}
}

function getPlayer(socket) {
	return players[socket.client.id];
}

function getRoomSend(socket) {
	return io.to(getPlayer(socket).room);
}

function sendRoomMessage(socket, msg) {
	getRoomSend(socket).emit('servermessage', msg);
}

Multiplayer.prototype = {
	clientsdp: function(socket, sdp) {
		console.log(sdp);
		var oldusername = getPlayer(socket).username;
		var oldroom = getPlayer(socket).room;
		getPlayer(socket).username = sdp['0']['o'][0];
		getPlayer(socket).room = sdp['0']['s'];
		if (oldroom !== getPlayer(socket).room) {
			if (oldroom) {
				io.to(oldroom).emit('servermessage', oldusername+"#"+getPlayer(socket).playernumber+" left.");
				socket.leave(oldroom);
			}
			if (getPlayer(socket).room) {
				socket.join(getPlayer(socket).room);
				sendRoomMessage(socket, getPlayer(socket).username+"#"+getPlayer(socket).playernumber+"@"+getPlayer(socket).room+" joined.");
			}
		}
	},
	clientmessage: function(socket, msg) {
		if (msg[0]) {
			if (getPlayer(socket).room) {
				sendRoomMessage(socket, "<"+getPlayer(socket).username+"#"+getPlayer(socket).playernumber+"> "+msg[0]);
			}
		}
	},
	clientpublish: function(socket, msg) {
		console.log("publishing to all", msg);
		if (getPlayer(socket).room) {
			getRoomSend(socket).emit('serverpublish', msg);
		}
	},
	clientmove: function(socket, position, orientation) {
		console.log(position);
		console.log(orientation);
		if (typeof getPlayer(socket).position !== 'undefined') {
			var newposition = position;
			var oldposition = getPlayer(socket).position;
			var delta = [newposition[0] - oldposition[0], 
				newposition[1] - oldposition[1], 
				newposition[2] - oldposition[2]];
			var distance = Math.sqrt(delta[0]*delta[0]+delta[1]*delta[1]+delta[2]*delta[2]);
			if (distance > 1) { // maximum distance player can travel
				delta = [delta[0]/distance, delta[1]/distance, delta[2]/distance];
				getPlayer(socket).position = [oldposition[0]+delta[0],
					oldposition[1]+delta[1],
					oldposition[2]+delta[2]];
			} else {
				getPlayer(socket).position = newposition;
			}
			getPlayer(socket).orientation = orientation;
		} else {
			getPlayer(socket).position = [0,0,0];
			getPlayer(socket).orientation = orientation;
		}
		// console.log('serverupdate', getPlayer(socket).playernumber, getPlayer(socket).position, getPlayer(socket).orientation);
		if (getPlayer(socket).room) {
			getRoomSend(socket).emit('serverupdate', getPlayer(socket).playernumber, getPlayer(socket).position, getPlayer(socket).orientation);
		}
		function close(v1, v2) {
			return Math.abs(v1 - v2) < 0.01;
		}
		function inRange(p1, p2) {
			return (close(p1.position[0], p2.position[0]) &&
				close(p1.position[1], p2.position[1]) &&
				close(p1.position[2], p2.position[2]));
		}
		/*
		for (var player in players) {
			// test collisions
			if (player != socket.client.id) {
				if (typeof players[player].position !== 'undefined') {
					// player has moved
					if (inRange(players[player], getPlayer(socket))) {
						// COLLISION
						// reset to beginning
						players[player].position = [0,0,0];
						getPlayer(socket).score++;
						if (typeof orientation[0] === 'number') {
							//console.log('serverupdate', players[player].playernumber, players[player].position, players[player].orientation);
							io.emit('serverupdate', players[player].playernumber, players[player].position, players[player].orientation);
						}
						io.emit('serverscore', getPlayer(socket).playernumber, getPlayer(socket).score);
					}
				}
			}
		}
		*/
	},
	clientrejoin: function(socket, msg) {
		var i = msg[0].indexOf("?");
		if (i >= 0) {
			var id = msg[0].substring(i+1);
			if (typeof oldplayers[id] !== 'undefined') {
				players[socket.client.id] = { playernumber: oldplayers[id].playernumber, id: socket.client.id, score: oldplayers[id].score, username:oldplayers[id].username, room:oldplayers[id].room};
				//socket.emit('servermessage', 'Your previous id was '+id);
				//socket.emit('servermessage', 'Your current id is '+socket.client.id);
				//console.log(players[socket.client.id]);
				if (getPlayer(socket).room) {
					sendRoomMessage(socket, getPlayer(socket).username+"#"+getPlayer(socket).playernumber+"@"+getPlayer(socket).room+" joined.");
				}
				reportPlayers(socket);
				socket.emit('servercapability', getPlayer(socket), getPlayer(socket).playernumber);
			} else {
				Multiplayer.prototype.clientjoin(socket);
			}
		} else {
			Multiplayer.prototype.clientjoin(socket);
		}
	},
	clientjoin: function(socket) {
		players[socket.client.id] = {playernumber: maxplayers, id: socket.client.id, score:0, username:"newbee", room:"common"};
		// console.log(players[socket.client.id]);
		maxplayers++;
		if (getPlayer(socket).room) {
			socket.join(getPlayer(socket).room);
			sendRoomMessage(socket, getPlayer(socket).playernumber+" joined.");
		}
		reportPlayers(socket);
		socket.emit('servercapability', getPlayer(socket), getPlayer(socket).playernumber);
	}
};

io.on('connection', function(socket){
  console.log("Connection from", socket.client.id);
  socket.on('clientpublish', function() {
	if (getPlayer(socket)) {
		Multiplayer.prototype.clientpublish(socket, arguments);
	} else {
		socket.emit('servermessage', "You need to join before publishing documents");
	}
  }),
  socket.on('clientsdp', function() {
	if (getPlayer(socket)) {
		Multiplayer.prototype.clientsdp(socket, arguments);
	} else {
		socket.emit('servermessage', "You need to join before sending username and room");
	}
  });
  socket.on('clientmessage', function() {
	if (getPlayer(socket)) {
		Multiplayer.prototype.clientmessage(socket, arguments);
	} else {
		socket.emit('servermessage', "You need to join before sending messages");
	}
  });
  socket.on('clientmove', function() {
	if (getPlayer(socket)) { // if joined
		// console.log(arguments);
		Multiplayer.prototype.clientmove(socket, arguments[0], arguments[1]);
	}
  });
  socket.on('clientrejoin', function () {
	if (getPlayer(socket)) {
	} else {
		Multiplayer.prototype.clientrejoin(socket, arguments);
	}
  });
  socket.on('clientjoin', function () {
	if (getPlayer(socket)) {
	} else {
		Multiplayer.prototype.clientjoin(socket);
	}
  });
  socket.on('error', function(e){
	console.log(e);
  });
  socket.on('disconnect', function(){
	if (getPlayer(socket)) {
		socket.leave(getPlayer(socket).room);
		console.log('servermessage', getPlayer(socket).playernumber+" quit.");
		if (getPlayer(socket).room) {
			sendRoomMessage(socket, getPlayer(socket).username+"#"+getPlayer(socket).playernumber+"@"+getPlayer(socket).room+" quit.");
		}
		oldplayers[socket.client.id] = getPlayer(socket);
		for (var card in getPlayer(socket).cards) {
			delete cardsTaken[card];
			delete getPlayer(socket).cards[card];
		}
		delete getPlayer(socket);
		reportPlayers(socket);
	}
  });
});

var defaultPort = 8088;

http.listen(process.env.X3DJSONPORT || defaultPort);

console.log('go to http://localhost:%s or '+metaServer+' in your browser or restart after typing $ export X3DJSONPORT=8088 # at your terminal prompt', process.env.X3DJSONPORT || defaultPort);


http.on('error', function (e) {
  if (e.code == 'EADDRINUSE') {
    console.log('Address in use, exiting...');
  }
});
