let sockets = {};

const LOG = function() {
    console.log('HTML', ...arguments);
};

class HTMLUser {
	constructor() {
	      let user = this;
	      this.usersocket = null;
	      $('#sessionbutton').click(function() {
		    user.usersocket = user.reconnect();
	      });
	      $('#disconnectbutton').click(function() {
		    user.disconnect();
	      });
	      $("#username").on('keyup', function (e) {
    		  if (e.key === 'Enter' || e.keyCode === 13) {
				  try {
					  let username = $('#username').val();
					  while (username.trim() === "") {
						username = prompt("Please specify a username:");
						$('#username').val(username);
					  }
					  user.usersocket.emit('clientactivename', username);
		    			  user.usersocket = user.reconnect();
			  	  } catch (error) {
		      		LOG(error.message);
		            alert(error.message);
		          }
		      }
	      });
	      $("#m").on('keyup', function (e) {
    		if (e.key === 'Enter' || e.keyCode === 13) {
				try {
					let message = $('#m').val();
					if (message.startsWith("http")) {
						// sent the link to the server to avoid CORS
						user.usersocket.emit('clientpublish', message);
					} else if ($('#x3d').val() !== "") {
						// Grab the JSON in the text area
						user.usersocket.emit('clientpublish', $('#x3d').val().replace(/\n/g, ""));
					}
					user.usersocket.emit('clientmessage', message);
					$('#m').val('');
				} catch (error) {
					LOG(error.message);
					alert(error.message);
				}
    		}
	      });

             $(document).on('change','#session',function(){
                   let session = $(this).val();
                   if (session !== "common room") {
                       user.usersocket = user.reconnect();
                   }
             });
	      user.usersocket = user.reconnect();

	}
	emit(api, UserGlobalSessions) {
        	user.usersocket.emit(api, UserGlobalSessions);
	}
	updateSessions() {
		try {
			let UserGlobalSessions = JSON.parse($('#sessionjson').val());
			if (user.usersocket) {
				user.usersocket.emit('clientsessions', UserGlobalSessions);
			}
			return UserGlobalSessions;
		} catch (e) {
			LOG(e);
		}
	}
	servermessage (msg) {
		$('#messages').append($('<li>').text(msg));
		LOG("message from server", msg);
		scrollToBottom();
	}
	serversessions(msg) {
		let oldsession = $('#session').val();
		$('#session').empty();
		let sessions = msg;
		LOG(sessions);
		let noop = $("<option>", {
		  value: "common room",
		  text: "common room"
		});
		$('#session').append(noop);

		for (let g in sessions) {
		    if (sessions.hasOwnProperty(g) && parseInt(g, 10) >= 0) {
			let session = sessions[g];
			LOG(session);
			let option = $("<option>", {
			  value: session['Group Petname'],  // could be token
			  text: session['Group Petname'] 
			});

			$('#session').append(option);
		    }
		}
		$('#session').val(oldsession);
	}
	serverpeers(msg) {
		$('#score').empty();
		$('#score').append($('<li>').text("Session members:"));
		if (typeof msg === 'object') {
			for (let m in msg) {
				$('#score').append($('<li>').text(msg[m]));
			}
		} else {
			$('#score').append($('<li>').text(msg));
		}
	}
	serverupdate(p) {
		user.servermessage(p.username+"#"+p.usernumber+" at "+p.position+" turns "+p.orientation);
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
	disconnect() {
	    try {
		for (let sn in sockets) {
			LOG("disconnecting "+sn);
			let socket = sockets[sn];
			if (socket !== null) {
				socket.disconnect();
				delete sockets[sn];
			}
		}
            } catch (e) {
		    LOG(e);
		    alert(e);
	    }
	}
	reconnect() {
	    'use strict';
		try {
			let username = $('#username').val();
			while (username.trim() === "") {
				username = prompt("Please specify a username:");
				$('#username').val(username);
				if (user && user.usersocket) {
					user.usersocket.emit('clientactivename', username);
					user.usersocket = user.reconnect();
				}
			}
			let socket = user.usersocket;
			let socketreturn = null;
			LOG("Reconnecting");
			let UserGlobalSessions = this.updateSessions();
			if (UserGlobalSessions !== null && (typeof UserGlobalSessions === 'object') && UserGlobalSessions.length > 0) {
				for (let g in UserGlobalSessions) {
					if (UserGlobalSessions.hasOwnProperty(g) && parseInt(g, 10) >= 0) {
						let session = UserGlobalSessions[g];
						let sessionname = session['Group Petname'];
						let lastsessiontoken = session['Group Token'];
						let sessionlink = session['Group Link'];
						socket = null;
						if (sessionlink && typeof sessionlink === 'string') {
							try {
								socket = io(sessionlink, {
									maxHttpBufferSize: 1e8, pingTimeout: 60000,
									transports: [ "polling", "websocket" ]
								});
								LOG('Connected to remote scene server', sessionlink);
							} catch (e) {
								LOG(e);
							}
						} else {
							// LOG('Group Link must be specificed in Session Description for scene collaboration');
						}
						if (socket === null || typeof socket === 'undefined') {
						     try {
							 socket = io({
								maxHttpBufferSize: 1e8, pingTimeout: 60000,
								transports: [ "polling", "websocket" ]
							});
							LOG('Connected to chat server');
							} catch (e) {
								LOG(e);
							}
						}
						if (socket !== null) {
							if (user.usersocket !== null) {
		    						user.disconnect();
								user.usersocket = null;
							}
							sockets[sessionname] = socket;
							socketreturn = socket;
							socket.on('servermessage', HTMLUser.prototype.servermessage);
							socket.on('serverpeers', HTMLUser.prototype.serverpeers);
							socket.on('serversessions', HTMLUser.prototype.serversessions);
							socket.on('serverupdate', HTMLUser.prototype.serverupdate);
							socket.on('serverscore', HTMLUser.prototype.serverscore);
							socket.on('servercapability', HTMLUser.prototype.servercapability);
							socket.on('serverdeal', HTMLUser.prototype.serverdeal);
							socket.emit('clientjoin');
							socket.emit("clientsessions", UserGlobalSessions);
							// socket.emit('clientrejoin', location.href);
							socket.emit("clientactivesession", lastsessiontoken);
							socket.emit('clientactivename', username);
							// socket.emit('clientmove', [0,0,0], [0,0,0]);
						} else {
							LOG("Couldn't connect to", sessionlink);
						}
					}
				}
			}
			if (socketreturn === null) {
				socketreturn = user.usersocket;
			}
			return socketreturn;
		} catch (e) {
			LOG("ERROR RECONNECTING", e);
		}
	}
}

let user = new HTMLUser();
