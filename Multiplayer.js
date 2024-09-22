// Polyfill fixed in Node.js 22
// Polyfill From Google AI
if (!Set.prototype.difference) {
  Set.prototype.difference = function(otherSet) {
    const differenceSet = new Set();
    for (const element of this) {
      if (!otherSet.has(element)) {
        differenceSet.add(element);
      }
    }
    return differenceSet;
  };
}

// Polyfill From Claude AI
if (!Set.prototype.intersection) {
  Set.prototype.intersection = function(...sets) {
    // Convert all arguments to Sets, in case they aren't already
    const otherSets = sets.map(s => s instanceof Set ? s : new Set(s));

    // Create a new Set with elements that exist in this Set
    // and all other Sets
    return new Set(
      [...this].filter(element =>
        otherSets.every(set => set.has(element))
      )
    );
  };
}

// Polyfill From Claude AI
if (!Set.prototype.union) {
  Set.prototype.union = function(...sets) {
    // Create a new Set with all elements from this Set
    const unionSet = new Set(this);

    // Add all elements from the other Sets
    for (const set of sets) {
      for (const elem of set) {
        unionSet.add(elem);
      }
    }

    return unionSet;
  };
}
class Multiplayer {
    constructor(io, metaServer) {
        let mp = this;
            this.maxplayers = 0;
            this.players = {};
            this.oldplayers = {};
        if (io === null) {
            console.log("Couldn't start socket.io server, can't connect clients");
        }
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
          });
          socket.on('clientactivename', function() {
            if (mp.getPlayer(socket)) {
                mp.clientactivename(socket, arguments);
            } else {
                socket.emit('servermessage', "You need to join before sending username");
            }
          });
          socket.on('clientactivegroup', function() {
            if (mp.getPlayer(socket)) {
                mp.clientactivegroup(socket, arguments);
            } else {
                socket.emit('servermessage', "You need to join before sending room");
            }
          });
          socket.on('clientgroups', function() {
            if (mp.getPlayer(socket)) {
                mp.clientgroups(socket, arguments);
            } else {
                socket.emit('servermessage', "You need to join before sending groups");
            }
          });
          socket.on('clientsdp', function() {
            if (mp.getPlayer(socket)) {
                mp.clientsdp(socket, arguments);
            } else {
                socket.emit('servermessage', "You need to join before sending SDP");
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
            console.log(...arguments);
            if (mp.getPlayer(socket)) { // if joined
                mp.clientmove(socket, arguments[0], arguments[1]);
            } else {
                socket.emit('servermessage', "Something wrong with socket or player");
            }
          });
          socket.on('clientrejoin', function () {
            if (mp.getPlayer(socket)) {
                socket.emit('servermessage', "You're already joined, not rejoining");
            } else {
                mp.clientrejoin(socket, arguments);
            }
          });
          socket.on('clientjoin', function () {
            if (mp.getPlayer(socket)) {
                socket.emit('servermessage', "You're already joined");
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
                socket.emit('servermessage', "You need to connect before disconnecting");
            }
          });
        });
    }
    disconnect(socket, args) {
        let player = this.getPlayer(socket);
        if (player) {
            console.log('servermessage', player.playernumber+" quit.");
            if (player.room) {
                this.sendRoomMessage(player, player.username+"#"+player.playernumber+"@"+player.room+" quit.");
            }
            this.oldplayers[socket.client.id] = player;
            socket.leave(player.room);
            this.sendPeersTo(player.room);
            delete this.players[socket.client.id];
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
        this.sendApiMessageToRoom('serverpeers', names, room);
    }
    clientgroups(socket, msg) {
        let player = this.getPlayer(socket);
        let oldgroups = player.groups;
        // console.log("old group", oldgroups);
        try {
            player.groups = msg[0];
        } catch (e) {
            console.error(e, msg[0]);
        }
        let newgroups = player.groups;

        let oldset = new Set(oldgroups);
		if (!oldset) {
			oldset = new Set([]);
		}
        let newset = new Set(newgroups);
		if (!newset) {
			newset = new Set([]);
		}
        let diff = newset.difference(oldset);
        let inter = newset.intersection(oldset);
        let onlynew = diff.union(inter);
        let toremove = oldset.difference(newset);
    
        for (let og in toremove) {
            let oldgroup = toremove[og];
            // console.log("old", group);
            let oldname = oldgroup["Group Petname"];
            let oldtoken = oldgroup["Group Token"];
            oldgroup["Group Active?"] = false;
            this.sendApiMessageToRoom('servermessage', player.username+"#"+player.playernumber+" left "+oldname+".", oldtoken);
            socket.leave(oldtoken);
            this.sendPeersTo(oldtoken);
        }
        for (let ng in onlynew) {
            let newgroup = onlynew[ng];
            let newname = newgroup["Group Petname"];
            let newtoken = newgroup["Group Token"];
            newgroup["Group Active?"] = false;
            socket.join(newtoken);
            this.sendPeersTo(newtoken);
            this.sendApiMessageToRoom('servermessage', player.username+"#"+player.playernumber+"@"+newname+" joined.", newtoken);
        }
        socket.emit("servergroups", newgroups);
    }
    clientactivegroup(socket, msg) {
        let newroom = "unknown";
        let player = this.getPlayer(socket);
        let oldroom = player.room;
        player.room = this.getRoom(player, msg[0]);
        if (player && player.room) {
            console.log("player", player.username, player.room);
        } else {
            console.log("Couldn't find player (not connected?)", player.username, player.room);
        }
        if (oldroom !== player.room) {
            if (this.getPetName(oldroom)) {
                this.io.to(oldroom).emit('servermessage', player.username+"#"+player.playernumber+"@"+this.getPetName(oldroom)+" went idle in "+oldroom);
                socket.leave(oldroom);
                this.sendPeersTo(oldroom);
            } else {
                console.log("Room", oldroom, "doesn't have a petname");
            }
            if (!player.room) {
                console.log("Oops", player.username+"#"+player.playernumber, "doesn't have a room setting to", msg[0]);
                player.room = msg[0];
            }
            if (player.room) {
                socket.join(player.room);
                    this.sendPeersTo(player.room);
                for (let g in player.groups) {
                    console.log("tokens", player.groups[g]['Group Token'], player.room);
                    if (player.groups[g]['Group Token'] === player.room) {
                        newroom = player.groups[g]['Group Petname'];
                        player.groups[g]['Group Active?'] = true;
                    } else {
                        player.groups[g]['Group Active?'] = false;
                    }
                }
                this.sendRoomMessage(player, player.username+"#"+player.playernumber+"@"+newroom+" became active.");
                console.log(player.username+"#"+player.playernumber+"@"+newroom+" became active.");
            }
        } else {
            console.log(oldroom, '===', player.room);
        }
    }
    clientactivename(socket, msg) {
        let player = this.getPlayer(socket);
        let oldusername = player.username;
        player.username = msg[0];
        if (oldusername !== player.username) {
            // console.log(oldusername, "!==", player.username);
            this.sendRoomMessage(player, oldusername+"#"+player.playernumber+" changed their name to "+player.username+"#"+player.playernumber+".");
            this.sendPeersTo(player.room);
        } else {
            // console.log(oldusername, "===", player.username);
        }
    }
    clientsdp(socket, sdp) {
        this.clientactivegroup(socket, [sdp['0'].s]);
        this.clientactivename(socket, [sdp['0'].o[0]]);
    }
    clientmessage(socket, msg) {
        if (msg[0]) {
            let player = this.getPlayer(socket);
            if (player.room) {
                this.sendRoomMessage(player, "<"+player.username+"#"+player.playernumber+"> "+msg[0]);
            }
        }
    }
    clientpublish(socket, msg) {
        console.log("publishing to all", msg);
        let player = this.getPlayer(socket);
        if (player.room) {
            this.sendApiMessageToPlayerRoom('serverpublish', msg, player);
        }
    }
    clientmove(socket, position, orientation) {
        console.log("clientmove position", position);
        console.log("clientmove orientation", orientation);
        let player = this.getPlayer(socket);
        if (!player) {
            console.log("Couldn't find player on this socket");
            return;
        } else {
            player.position = position;
            player.orientation = orientation;
            console.log("Could find player on this socket");
        }
        /*
        if (typeof player.position !== 'undefined') {
            var newposition = position;
            var oldposition = player.position;
            var delta = [newposition[0] - oldposition[0], 
                newposition[1] - oldposition[1], 
                newposition[2] - oldposition[2]];
            var distance = Math.sqrt(delta[0]*delta[0]+delta[1]*delta[1]+delta[2]*delta[2]);
            if (distance > 1) { // maximum distance player can travel
                delta = [delta[0]/distance, delta[1]/distance, delta[2]/distance];
                player.position = [oldposition[0]+delta[0],
                    oldposition[1]+delta[1],
                    oldposition[2]+delta[2]];
            } else {
                player.position = newposition;
            }
            player.orientation = orientation;
        } else {
            player.position = [0,0,0];
            player.orientation = orientation;
        }
        // console.log('serverupdate', player);
        */
        if (player.room) {
            console.log("sending server update to room", player.room, player.username, player.playernumber, player.position, player.orientation);
            this.sendApiMessageToPlayerRoom('serverupdate', player, player);
            this.getRoomSend(player).emit('x3d_serverupdate', player.playernumber, player.position, player.orientation, player.room);
        } else {
            console.log("warning, room does not exist", player.username, "#", player.playernumber, "@", player.room);
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
        for (var p in this.players) {
            // test collisions
            if (p != socket.client.id) {
                if (typeof this.players[p].position !== 'undefined') {
                    // player has moved
                    if (inRange(this.players[p], player)) {
                        // COLLISION
                        // reset to beginning
                        this.players[p].position = [0,0,0];
                        player.score++;
                        if (typeof orientation[0] === 'number') {
                            //console.log('serverupdate', this.players[p]);
                            this.io.emit('serverupdate', this.players[p]);
                        }
                        this.io.emit('serverscore', player.playernumber, player.score);
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
                let player = this.getPlayer(socket);
                if (player.room) {
                    socket.join(player.room);
                    this.sendRoomMessage(player, player.username+"#"+player.playernumber+"@"+player.room+" rejoined.");
                    this.sendPeersTo(player.room);
                }
                this.reportPlayers(socket);
                socket.emit('servercapability', player, player.playernumber);
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
        let player = this.getPlayer(socket);
        if (player.room) {
            socket.join(player.room);
            this.sendPeersTo(player.room);
            this.sendRoomMessage(player, player.playernumber+" joined.");
        }
        this.reportPlayers(socket);
        socket.emit('servercapability', player, player.playernumber);
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

    getRoomTo(room) {
        console.log("1. Sending info to", room);
        return this.io.to(room);
    }

    getRoomSend(player) {
        console.log("2. Sending", player.username, "@", player.room);
        return this.getRoomTo(player.room);
    }

    sendRoomMessage(player, msg) {
        console.log("3. Sending servermessage '", msg, "' to", player.username);
        this.sendApiMessageToPlayerRoom('servermessage', msg, player);
    }
    getRoom(player, petName) {
        for (let g in player.groups) {
            if (player.groups[g]['Group Petname'] === petName) {
                return player.groups[g]['Group Token'];
            }
        }
    }
    getPetName(player, token) {
        for (let g in player.groups) {
            if (player.groups[g]['Group Token'] === token) {
                console.log("returing petname", player.groups[g]['Group Petname']);
                return player.groups[g]['Group Petname'];
            }
        }
        console.log("couldn't find room", token);
    }
    sendApiMessageToRoom(api, msg, room) {
        console.log("4. Sending", api, "'", msg, "'", "@", room);
        this.getRoomTo(room).emit(api, msg);
    }
    sendApiMessageToPlayerRoom(api, msg, player) {
        if (player.room) {
            console.log("5. Sending", api, "'", msg, "'", player, "@", player.room);
            this.getRoomSend(player).emit(api, msg);
        } else {
            console.log("Attempted to send", msg, "to ", player.username, "but player is not in room");
        }
    }
}

module.exports = Multiplayer;
