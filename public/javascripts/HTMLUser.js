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
			if ($('#x3d').val().trim() !== "" && user) {
				let username = $('#username').val();
				user.emit('clientmessage', username+" is publishing.");
				user.emit('clientpublish', $('#x3d').val().replace(/\n/g, ""));
			} else if (user && message.startsWith("http")) {
				user.emit('clientpublish', message);
				$('#m').val('');
			} else {
				alert("Please set your user name, update session info, paste some X3D encoding text into the text area below the scene, and try republishing");
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
		for (let sn in this._sockets) {
			let socket = this._sockets[sn];
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
