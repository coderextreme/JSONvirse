class HTMLUser {
	static LOG () {
	    console.log('HTML', ...arguments);
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
	constructor(sessions) {
	      let user = this;
	      this._user = this;
	      this._sockets = {};
	      this.sessions = sessions;
	      this._sockets = sessions._sockets;
	      user._sessions = sessions;
	      user._sockets = sessions._sockets;
	      HTMLUser.LOG("Creating HTMLUser Event handlers");
	      $('#sessionbutton').click(function() {
		    user.reconnect();
		    user.updateSessions();
	      });
	      $('#disconnectbutton').click(function() {
		    user.disconnect();
	      });
	      $('#fetchbutton').click(function() {
			let message = $('#m').val();
		        if (user && message.startsWith("http")) {
			    user.emit('clientmessage', message);
			    const request = {
			      method: 'GET'
			    };
			    fetch(message, request)
			      .then(response => response.text())
			      .then(data => {
					$('#x3d').val(data);
					$('#m').val('');
			      })
			      .catch(error => console.error('Error:', error));
			} else {
				alert("Can't fetch that!");
			}
	      });
	      $('#publishbutton').click(function() {
			let message = $('#m').val();
			let username = $('#username').val();
			user.emit('clientmessage', username+" is publishing.");
		        if (username.trim() === "") {
				alert("Please set your user name");
			} else if (message.trim().startsWith("http://") || message.trim().startsWith("https://")) {
				user.emit('clientpublish', message);
				$('#m').val('');
			} else if ($('#x3d').val().trim() !== "") {
				user.emit('clientpublish', $('#x3d').val().replace(/\n/g, ""));
			} else {
				user.emit('clientmessage', username+" publishing failed?");
			}
	      });
	      $("#username").on('keyup', function (e) {
    		  if (e.key === 'Enter' || e.keyCode === 13) {
				  try {
					  let username = $('#username').val();
					  while (username.trim() === "") {
						username = prompt("Please specify a username:");
						$('#username').val(username);
					  }
					  user.emit('clientactivename', username);
		    			  user.reconnect();
			  	  } catch (error) {
		      		HTMLUser.LOG(error.message);
		            alert(error.message);
		          }
		      }
	      });
	      $("#m").on('keyup', function (e) {
    		if (e.key === 'Enter' || e.keyCode === 13) {
				try {
					let message = $('#m').val();
					user.emit('clientmessage', message);
					$('#m').val('');
				} catch (error) {
					HTMLUser.LOG(error.message);
					alert(error.message);
				}
    		}
	      });

             $('#session').on('change',function(){
                   let session = $(this).val();
                   if (session !== "common room") {
		       let user = new HTMLUser(usersessions);
                       user.reconnect();
                   }
             });
	      HTMLUser.LOG("Done creating HTMLUser Event handlers");
             // user.reconnect();

	}
	emit(api, message) {
		for (let sn in usersessions._sockets) {
			let socket = usersessions._sockets[sn];
			if (socket !== null) {
        			socket.emit(api, message);
			} else {
				HTMLUSer.LOG("failed to send", api, message);
			}
		}
	}
	updateSessions() {
		return this.sessions.updateSessions();
	}
	reconnect() {
		this.sessions.reconnect();
		this._sockets = this.sessions._sockets;
	}
	disconnect() {
		this.sessions.disconnect();
	}
}

let user = new HTMLUser(usersessions);
user.reconnect();
