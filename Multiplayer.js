class Multiplayer {
	maxplayers = 0;
	players = {};
	oldplayers = {};
	io = null;
	metaServer = null;

	constructor(io, metaServer) {
		let mp = this;
		this.io = io;
		this.metaServer = metaServer;
		io.on('connection', function(socket) {
		  console.log("Connection from", socket.client.id);
		  socket.on('clientpublish', function() {
			if (mp.getPlayer(socket)) {
				mp.clientpublish(socket, arguments);
			} else {
				socket.emit('servermessage', "You need to join before publishing documents");
			}
		  }),
		  socket.on('clientactivename', function() {
			if (mp.getPlayer(socket)) {
				mp.clientactivename(socket, arguments);
			} else {
				socket.emit('servermessage', "You need to join before sending username and room");
			}
		  });
		  socket.on('clientactivegroup', function() {
			if (mp.getPlayer(socket)) {
				mp.clientactivegroup(socket, arguments);
			} else {
				socket.emit('servermessage', "You need to join before sending username and room");
			}
		  });
		  socket.on('clientgroups', function() {
			if (mp.getPlayer(socket)) {
				mp.clientgroups(socket, arguments);
			} else {
				socket.emit('servermessage', "You need to join before sending username and room");
			}
		  });
		  socket.on('clientsdp', function() {
			if (mp.getPlayer(socket)) {
				mp.clientsdp(socket, arguments);
			} else {
				socket.emit('servermessage', "You need to join before sending username and room");
			}
		  });
		  socket.on('clientmap', function() {
			if (mp.getPlayer(socket)) {
				mp.clientmap(socket, arguments);
			} else {
				socket.emit('servermessage', "You need to join before sending username and room");
			}
		  });
		  socket.on('clientmessage', function() {
			if (mp.getPlayer(socket)) {
				mp.clientmessage(socket, arguments);
			} else {
				socket.emit('servermessage', "You need to join before sending messages");
			}
		  });
		  socket.on('clientmove', function() {
			if (mp.getPlayer(socket)) { // if joined
				// console.log(arguments);
				mp.clientmove(socket, arguments[0], arguments[1]);
			}
		  });
		  socket.on('clientrejoin', function () {
			if (mp.getPlayer(socket)) {
			} else {
				mp.clientrejoin(socket, arguments);
			}
		  });
		  socket.on('clientjoin', function () {
			if (mp.getPlayer(socket)) {
			} else {
				mp.clientjoin(socket);
			}
		  });
		  socket.on('error', function(e){
			console.log(e);
		  });
		  socket.on('disconnect', function(){
			if (mp.getPlayer(socket)) {
				mp.disconnect(socket, arguments);
			} else {
				socket.emit('servermessage', "You need to join before sending messages");
			}
		  });
		});
	}
	disconnect(socket, args) {
		if (this.getPlayer(socket)) {
			console.log('servermessage', this.getPlayer(socket).playernumber+" quit.");
			if (this.getPlayer(socket).room) {
				this.sendRoomMessage(socket, this.getPlayer(socket).username+"#"+this.getPlayer(socket).playernumber+"@"+this.getPlayer(socket).room+" quit.");
			}
			this.oldplayers[socket.client.id] = this.getPlayer(socket);
			socket.leave(this.getPlayer(socket).room);
			delete this.getPlayer(socket);
			this.players[socket.client.id] = null;
			this.reportPlayers(socket);
		}
	}
	sendPeersTo(room) {
		let names = [];
		for (var player in this.players) {
			if (this.players[player] !== null && this.players[player].room === room) {
				names.push(this.players[player].username+"#"+this.players[player].playernumber);
			}
		}
		this.getRoomTo(room).emit('serverpeers', names);
	}
	clientgroups(socket, msg) {
		let oldgroups = this.getPlayer(socket).groups;
		// console.log("old", oldgroups);
		for (let g in oldgroups) {
			let group = oldgroups[g];
			// console.log("old", group);
			let name = group["Group Petname"];
			let token = group["Group Token"];
			// console.log("old token", token);
			this.getRoomTo(token).emit('servermessage', this.getPlayer(socket).username+"#"+this.getPlayer(socket).playernumber+" left "+name+".");
			socket.leave(token);
			this.sendPeersTo(token);
		}

		// console.log("new groups", msg[0]);
		try {
			this.getPlayer(socket).groups = JSON.parse(msg[0]);
		} catch (e) {
			console.error("Problems parsing", msg[0]);
		}
		let newgroups = this.getPlayer(socket).groups;
		// console.log("new", newgroups);
		for (let g in newgroups) {
			let group = newgroups[g];
			// console.log("new group", group);
			let name = group["Group Petname"];
			let token = group["Group Token"];
			// console.log("new token", token);
			let type = group["Group Type"];
			let link = group["Group Link"];
			socket.join(token);
			this.getRoomTo(token).emit('servermessage', this.getPlayer(socket).username+"#"+this.getPlayer(socket).playernumber+"@"+name+" joined.");
			this.sendPeersTo(token);
		}
		socket.emit("servergroups", newgroups);
	}
	clientactivegroup(socket, msg) {
		let newroom = "unknown";
		let oldroom = this.getPlayer(socket).room;
		this.getPlayer(socket).room = this.getRoom(socket, msg[0]);
		if (oldroom !== this.getPlayer(socket).room) {
			if (oldroom) {
				this.io.to(oldroom).emit('servermessage', this.getPlayer(socket).username+"#"+this.getPlayer(socket).playernumber+" went idle.");
				socket.leave(oldroom);
				this.sendPeersTo(oldroom);
			}
			if (this.getPlayer(socket).room) {
				socket.join(this.getPlayer(socket).room);
				for (let g in this.getPlayer(socket).groups) {
					console.log("tokens", this.getPlayer(socket).groups[g]['Group Token'], this.getPlayer(socket).room);
					if (this.getPlayer(socket).groups[g]['Group Token'] === this.getPlayer(socket).room) {
						newroom = this.getPlayer(socket).groups[g]['Group Petname'];
					}
				}
				this.sendRoomMessage(socket, this.getPlayer(socket).username+"#"+this.getPlayer(socket).playernumber+"@"+newroom+" became active.");
				console.log(this.getPlayer(socket).username+"#"+this.getPlayer(socket).playernumber+"@"+newroom+" became active.");
			}
		}
		this.sendPeers(socket);
	}
	clientactivename(socket, msg) {
		let oldusername = this.getPlayer(socket).username;
		this.getPlayer(socket).username = msg[0];
		if (oldusername !== this.getPlayer(socket).username) {
			// console.log(oldusername, "!==", this.getPlayer(socket).username);
			this.sendRoomMessage(socket, oldusername+"#"+this.getPlayer(socket).playernumber+" changed their name to "+this.getPlayer(socket).username+"#"+this.getPlayer(socket).playernumber+".");
			this.sendPeers(socket);
		} else {
			// console.log(oldusername, "===", this.getPlayer(socket).username);
		}
	}
	clientsdp(socket, sdp) {
		this.clientactivegroup(socket, [sdp['0']['s']]);
		this.clientactivename(socket, [sdp['0']['o'][0]]);
	}
	clientmessage(socket, msg) {
		if (msg[0]) {
			if (this.getPlayer(socket).room) {
				this.sendRoomMessage(socket, "<"+this.getPlayer(socket).username+"#"+this.getPlayer(socket).playernumber+"> "+msg[0]);
			}
		}
	}
	clientpublish(socket, msg) {
		console.log("publishing to all", msg);
		if (this.getPlayer(socket).room) {
			this.getRoomSend(socket).emit('serverpublish', msg);
		}
	}
	clientmove(socket, position, orientation) {
		console.log("clientmove position", position);
		console.log("clientmove orientation", orientation);
		if (typeof this.getPlayer(socket).position !== 'undefined') {
			var newposition = position;
			var oldposition = this.getPlayer(socket).position;
			var delta = [newposition[0] - oldposition[0], 
				newposition[1] - oldposition[1], 
				newposition[2] - oldposition[2]];
			var distance = Math.sqrt(delta[0]*delta[0]+delta[1]*delta[1]+delta[2]*delta[2]);
			if (distance > 1) { // maximum distance player can travel
				delta = [delta[0]/distance, delta[1]/distance, delta[2]/distance];
				this.getPlayer(socket).position = [oldposition[0]+delta[0],
					oldposition[1]+delta[1],
					oldposition[2]+delta[2]];
			} else {
				this.getPlayer(socket).position = newposition;
			}
			this.getPlayer(socket).orientation = orientation;
		} else {
			this.getPlayer(socket).position = [0,0,0];
			this.getPlayer(socket).orientation = orientation;
		}
		// console.log('serverupdate', this.getPlayer(socket).playernumber, this.getPlayer(socket).position, this.getPlayer(socket).orientation);
		if (this.getPlayer(socket).room) {
			console.log("sending server update to room", this.getPlayer(socket).room, this.getPlayer(socket).username, this.getPlayer(socket).playernumber, this.getPlayer(socket).position, this.getPlayer(socket).orientation);
			this.getRoomSend(socket).emit('serverupdate', this.getPlayer(socket).playernumber, this.getPlayer(socket).position, this.getPlayer(socket).orientation);
			this.getRoomSend(socket).emit('x3d_serverupdate', this.getPlayer(socket).playernumber, this.getPlayer(socket).position, this.getPlayer(socket).orientation);
		} else {
			console.log("warning, room does not exsit", this.getPlayer(socket).room, this.getPlayer(socket).playernumber, this.getPlayer(socket).room);
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
		for (var player in this.players) {
			// test collisions
			if (player != socket.client.id) {
				if (typeof this.players[player].position !== 'undefined') {
					// player has moved
					if (inRange(this.players[player], this.getPlayer(socket))) {
						// COLLISION
						// reset to beginning
						this.players[player].position = [0,0,0];
						this.getPlayer(socket).score++;
						if (typeof orientation[0] === 'number') {
							//console.log('serverupdate', this.players[player].playernumber, this.players[player].position, this.players[player].orientation);
							this.io.emit('serverupdate', this.players[player].playernumber, this.players[player].position, this.players[player].orientation);
						}
						this.io.emit('serverscore', this.getPlayer(socket).playernumber, this.getPlayer(socket).score);
					}
				}
			}
		}
		*/
	}
	clientrejoin(socket, msg) {
		var i = msg[0].indexOf("?");
		if (i >= 0) {
			var id = msg[0].substring(i+1);
			if (typeof this.oldplayers[id] !== 'undefined') {
				this.players[socket.client.id] = {
					playernumber: this.oldplayers[id].playernumber,
					id: socket.client.id,
					score: this.oldplayers[id].score,
					username:this.oldplayers[id].username,
					room:this.oldplayers[id].room};
				//socket.emit('servermessage', 'Your previous id was '+id);
				//socket.emit('servermessage', 'Your current id is '+socket.client.id);
				//console.log(this.players[socket.client.id]);
				if (this.getPlayer(socket).room) {
					this.sendRoomMessage(socket, this.getPlayer(socket).username+"#"+this.getPlayer(socket).playernumber+"@"+this.getPlayer(socket).room+" rejoined.");
					this.sendPeers(socket);
				}
				this.reportPlayers(socket);
				socket.emit('servercapability', this.getPlayer(socket), this.getPlayer(socket).playernumber);
			} else {
				this.clientjoin(socket);
			}
		} else {
			this.clientjoin(socket);
		}
	}
	clientjoin(socket) {
		// TODO reconnect SDP
		this.players[socket.client.id] = {playernumber: this.maxplayers, id: socket.client.id, score:0, username:"newbee", room:"common room"};
		// console.log(this.players[socket.client.id]);
		this.maxplayers++;
		if (this.getPlayer(socket).room) {
			socket.join(this.getPlayer(socket).room);
			this.sendRoomMessage(socket, this.getPlayer(socket).playernumber+" joined.");
			this.sendPeers(socket);
		}
		this.reportPlayers(socket);
		socket.emit('servercapability', this.getPlayer(socket), this.getPlayer(socket).playernumber);
	}

	reportPlayers(socket) {
		var numPlayers = 0;
		for (var p in this.players) {
			if (this.players[p] != null) {
				numPlayers++;
			}
		}
		this.io.emit('servermessage', "The server has "+numPlayers+" resident"+(numPlayers > 1 ? "s." : "."));
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
				if (this.metaServer != null) {
					console.log("Connecting to meta server at ", this.metaServer+"/api/servers/"+host+"/"+port+"/"+numPlayers);
					client.get(this.metaServer+"/api/servers/${host}/${port}/${players}", args, function(data, response){
					// console.log(data);
					// console.log(response);
					});
				}
			} catch (e) {
				console.log(e);
			}
		}
	}

	getPlayer(socket) {
		return this.players[socket.client.id];
	}

	sendPeers(socket) {
		this.sendPeersTo(this.getPlayer(socket).room);
	}

	getRoomTo(room) {
		console.log("Sending info to", room);
		return this.io.to(room);
	}

	getRoomSend(socket) {
		return this.getRoomTo(this.getPlayer(socket).room);
	}

	sendRoomMessage(socket, msg) {
		this.getRoomSend(socket).emit('servermessage', msg);
	}
	getRoom(socket, petName) {
		for (let g in this.getPlayer(socket).groups) {
			if (this.getPlayer(socket).groups[g]['Group Petname'] === petName) {
				return this.getPlayer(socket).groups[g]['Group Token'];
			}
		}
	}
}

module.exports = Multiplayer;
