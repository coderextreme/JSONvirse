class Sessions {
	static LOG () {
	    console.log('SESSIONS', ...arguments);
	}
	get user() {
	    return this._user;
	}
	set user(value) {
	    this._user = value;
	}
	get sockets() {
	    return this._sockets;
	}
	set sockets(value) {
	    this._sockets = value;
	}
	constructor() {
	      this._user = this;
	      this._sockets = {};
	      this.reconnect();

	}
	operateOnSessions(callback) {
		let UserGlobalSessions = JSON.parse($('#sessionjson').val());
		if (UserGlobalSessions !== null && (typeof UserGlobalSessions === 'object') && UserGlobalSessions.length > 0 && typeof this._user !== 'undefined') {
			for (let g in UserGlobalSessions) {
				if (UserGlobalSessions.hasOwnProperty(g) && parseInt(g, 10) >= 0) {
					let session = UserGlobalSessions[g];
					let sessionname = session['Group Petname'];
					callback(sessionname, session, this);
				}
			}
		}
	}
	updateSessions() {
		// try {
			let UserGlobalSessions = JSON.parse($('#sessionjson').val());
			this.operateOnSessions(function (sessionname, session, user) {
				let socket = user._sockets[sessionname];
				if (socket) {
					Sessions.LOG("Loading", UserGlobalSessions);
					socket.emit('clientsessions', UserGlobalSessions);
				}
			});
			return UserGlobalSessions;
		/*
		} catch (e) {
			Sessions.LOG(e);
		}
		*/
	}
	disconnect() {
	    // try {
		for (let sn in this._sockets) {
			Sessions.LOG("disconnecting "+sn);
			let socket = this._sockets[sn];
			if (socket !== null) {
				socket.disconnect();
				delete this._sockets[sn];
			}
		}
		this._sockets = {};
		/*
            } catch (e) {
		    Sessions.LOG(e);
		    alert(e);
	    }
	    */
	}
	reconnect() {
		'use strict';
		// try {
			Sessions.LOG("Reconnecting");
			let username = $('#username').val();
			while (username.trim() === "") {
				username = prompt("Please specify a username:");
				$('#username').val(username);
			}
			this.disconnect();
			this.operateOnSessions(function (sessionname, session, user) {
				let sessiontoken = session['Group Token'];
				let sessionlink = session['Group Link'];
				let socket = user._sockets[sessionname];
				if (!socket) {
					if (sessionlink && typeof sessionlink === 'string') {
						// try {
							socket = null;
							socket = io(sessionlink, {
								maxHttpBufferSize: 1e8, pingTimeout: 60000,
								transports: [ "polling" ]
							});
							Sessions.LOG('Connected to remote scene server', sessionlink);
						/*
						} catch (e) {
							Sessions.LOG(e);
						}
						*/
					} else {
						// Sessions.LOG('Group Link must be specificed in Session Description for scene collaboration');
					}
					if (socket === null || typeof socket === 'undefined') {
					     // if all else fails, connect back to same host
					     // try {
						 socket = io({
							maxHttpBufferSize: 1e8, pingTimeout: 60000,
							transports: [ "polling" ]
						});
						Sessions.LOG('Connected to chat server');
						/*
						} catch (e) {
							Sessions.LOG(e);
						}
						*/
					}
					if (socket !== null) {
						user._sockets[sessionname] = socket;
						socket.on('servermessage', user.servermessage);
						socket.on('serverpeers', user.serverpeers);
						socket.on('serversessions', user.serversessions);
						socket.on('serverupdate', user.serverupdate);
						socket.on('servercapability', user.servercapability);
						socket.emit('clientjoin');
						// socket.emit("clientsessions", UserGlobalSessions);
						// socket.emit('clientrejoin', location.href);
						socket.emit("clientactivesession", sessiontoken);
						socket.emit('clientactivename', username);
						// socket.emit('clientmove', [0,0,0], [0,0,0]);
					} else {
						Sessions.LOG("Couldn't connect to", sessionlink);
					}
				}
			});
		/*
		} catch (e) {
			Sessions.LOG("ERROR RECONNECTING", e);
		}
		*/
	}
	serversessions(msg) {
		let oldsession = $('#session').val();
		$('#session').empty();
		let sessions = msg;
		HTMLUser.LOG(sessions);
		let noop = $("<option>", {
		  value: "common room",
		  text: "common room"
		});
		$('#session').append(noop);

		for (let g in sessions) {
		    if (sessions.hasOwnProperty(g) && parseInt(g, 10) >= 0) {
			let session = sessions[g];
			HTMLUser.LOG(session);
			let option = $("<option>", {
			  value: session['Group Petname'],  // could be token
			  text: session['Group Petname'] 
			});

			$('#session').append(option);
		    }
		}
		$('#session').val(oldsession);
	}
	servermessage (msg) {
		$('#messages').append($('<li>').text(msg));
		HTMLUser.LOG("message from server", msg);
		scrollToBottom();
	}
	serverpeers(msg) {
		$('#score').empty();
		$('#score').append($('<li>').text("Session members:"));
		if (typeof msg === 'object') {
			for (let m in msg) {
				if (!msg[m].startsWith("x3dbot#")) {
					$('#score').append($('<li>').text(msg[m]));
				}
			}
		} else {
			$('#score').append($('<li>').text(msg));
		}
	}
	serverupdate(p) {
		this.servermessage(p.username+"#"+p.usernumber+" at "+p.position+" turns "+p.orientation);
	}
	servercapability() {
		if ( history.pushState ) {
			var href = location.href;
			var i = href.indexOf("?");
			if (i >= 0) {
				href = href.substring(0, i);
			}
			history.pushState( {}, document.title, href+"?"+arguments[0].id );
		}
	}
}

var usersessions = new Sessions();
