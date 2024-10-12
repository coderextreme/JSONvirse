class AdminUser {
	static LOG () {
	    console.log('Admin', ...arguments);
	}
	get sockets() {
	    return this._sockets;
	}
	set sockets(value) {
	    this._sockets = value;
	}
	constructor(sessions) {
	      let adminuser = this;
	      this._user = this;
	      this._sockets = {};
	      this.sessions = sessions;
	      this._sockets = sessions._sockets;
	      adminuser._sessions = sessions;
	      adminuser._sockets = sessions._sockets;
	      AdminUser.LOG("Creating AdminUser Event handlers");
	      $('#hostbutton').click(function() {
			adminuser._sessions.serversessions(adminuser._sessions.updateSessions());
	      });
	      $('#blockbutton').click(function() {
	      });
	      $("#username").on('keyup', function (e) {
    		  if (e.key === 'Enter' || e.keyCode === 13) {
				  try {
					  let username = $('#username').val();
					  while (username.trim() === "") {
						username = prompt("Please specify a username:");
						$('#username').val(username);
					  }
					  adminuser.emit('clientactivename', username);
		    			  adminuser.reconnect();
			  	  } catch (error) {
		      		AdminUser.LOG(error.message);
		            alert(error.message);
		          }
		      }
	      });
	      $("#m").on('keyup', function (e) {
    		if (e.key === 'Enter' || e.keyCode === 13) {
				try {
					let message = $('#m').val();
					adminuser.emit('clientmessage', message);
					$('#m').val('');
				} catch (error) {
					AdminUser.LOG(error.message);
					alert(error.message);
				}
    		}
	      });

             $('#blocksessions').on('change',function(){
                   let blocksessions = $(this).val();
		   alert(blocksessions);
             });
	      AdminUser.LOG("Done creating AdminUser Event handlers");
             // user.reconnect();

	}
	emit(api, message) {
		for (let sn in usersessions._sockets) {
			let socket = usersessions._sockets[sn];
			if (socket !== null) {
        			socket.emit(api, message);
			} else {
				AdminUSer.LOG("failed to send", api, message);
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

let adminuser = new AdminUser(usersessions);
adminuser.reconnect();
