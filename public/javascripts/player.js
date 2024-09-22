function Player() {
}

const LOG = function() {
    // Browser.print('BROWSER', ...arguments);
};

Player.prototype = {
	updateGroups: function() {
		try {
			let UserGlobalGroups = JSON.parse($('#sessionjson').val());
			socket.emit('clientgroups', UserGlobalGroups);
			// updateURLsAndGroups(X3D.getBrowser(), UserGlobalGroups);
			return UserGlobalGroups;
		} catch (e) {
			LOG(e);
			alert(e);
		}
	},
	servermessage: function(msg) {
		$('#messages').append($('<li>').text(msg));
		LOG("message from server", msg);
		scrollToBottom();
	},
	serverpublish: function(msg) {
		LOG("Receiving publish", msg)
		UserGlobalGroups = Player.prototype.updateGroups();
		// if Prompt begins with http, get it
		if (msg[0].startsWith("http://") || msg[0].startsWith("https://")) {
			loadURL("#scene", msg[0], UserGlobalGroups);
		} else {
			loadJS("#scene", msg[0], UserGlobalGroups);
		}
	},
	servergroups: function(msg) {
		$('#group').empty();
		let groups = msg;
		LOG(groups);
		let noop = $("<option>", {
		  value: "Not connected",
		  text: "Not connected"
		});
		$('#group').append(noop);

		for (let g in groups) {
			let group = groups[g];
			LOG(group);
			let option = $("<option>", {
			  value: group['Group Petname'],  // could be token
			  text: group['Group Petname'] 
			});

			$('#group').append(option);
		}
	},
	serverpeers: function(msg) {
		$('#score').empty();
		$('#score').append($('<li>').text("Group members:"));
		if (typeof msg === 'object') {
			for (m in msg) {
				$('#score').append($('<li>').text(msg[m]));
			}
		} else {
			$('#score').append($('<li>').text(msg));
		}
	},
	serverupdate: function(player) {
		// Player.prototype.servermessage(player.username+"#"+player.playernumber+" at "+player.position+" turns "+player.orientation);
	},
	serverheal: function() { LOG(arguments);},
	serverdamage: function() { LOG(arguments);},
	servercollision: function() { LOG(arguments);},
	serverorderchange: function() { LOG(arguments);},
	serverdie: function() { LOG(arguments);},
	servererror: function() { LOG(arguments);},
	serverroompurge: function() { LOG(arguments);},
	serverroomready: function() { LOG(arguments);},
	serverpowerplay: function() { LOG(arguments);},
	servercounter: function() { LOG(arguments);},
	serverturnbegin: function() { LOG(arguments);},
	serverturnend: function() { LOG(arguments);},
	servercapability: function() {
		if ( history.pushState ) {
			var href = location.href;
			var i = href.indexOf("?");
			if (i >= 0) {
				href = href.substring(0, i);
			}
			history.pushState( {}, document.title, href+"?"+arguments[0].id );
		}
		thisplayer = arguments[1];
	}
};
async function sendData(socket, url) {
  try {
	if (url.startsWith("http")) {
		// sent the link to the server to avoid CORS
		socket.emit('clientpublish', url);
	} else {
		// Grab the JSON in the text area
		socket.emit('clientpublish', $('#json').val().replace(/\n/g, ""));
	}
  } catch (error) {
    console.error(error.message);
  }
}
      $('#send').click(function(){
	let message = $('#m').val();
	let username = $('#username').val();
        socket.emit('clientactivename', username);
	      /*
        socket.emit('clientsdp', {
"v":0,
"o":[username, 3724394400, 3724394405, "IN","IP","lc-soc-lc.at"],
"s":"common room",
"c":["IN","IP4","lc-soc-lc.at"],
"t":[3724394400, 3724398000, "Mon 8-Jan-2018 10:00-11:00 UTC"]});
	*/
        socket.emit('clientmessage', message);
        $('#m').val('');
	  try {
		if (message.startsWith("http")) {
			// sent the link to the server to avoid CORS
			socket.emit('clientpublish', message);
		} else if ($('#json').val() !== "") {
			// Grab the JSON in the text area
			socket.emit('clientpublish', $('#json').val().replace(/\n/g, ""));
		}
	  } catch (error) {
	    console.error(error.message);
	  }
        return false;
      });

      $('#session').click(function() {
	    Player.prototype.updateGroups();
      });

     $(document).on('change','#group',function(){
	    let group = $(this).val();
	    if (group !== "common room" && group !== "Not connected") {
	    	socket.emit('clientactivegroup', group);
	    }
      });

  socket.on('servermessage', Player.prototype.servermessage);
  socket.on('serverpublish', Player.prototype.serverpublish);
  socket.on('serverpeers', Player.prototype.serverpeers);
  socket.on('servergroups', Player.prototype.servergroups);
  socket.on('serverupdate', Player.prototype.serverupdate);
  socket.on('serverheal', Player.prototype.serverheal);
  socket.on('serverdamage', Player.prototype.serverdamage);
  socket.on('servercollision', Player.prototype.servercollision);
  socket.on('serverorderchange', Player.prototype.serverorderchange);
  socket.on('serverdie', Player.prototype.serverdie);
  socket.on('servererror', Player.prototype.servererror);
  socket.on('serverroompurge', Player.prototype.serverroompurge);
  socket.on('serverroomready', Player.prototype.serverroomready);
  socket.on('serverscore', Player.prototype.serverscore);
  socket.on('serverpowerplay', Player.prototype.serverpowerplay);
  socket.on('servercounter', Player.prototype.servercounter);
  socket.on('serverturnbegin', Player.prototype.serverturnbegin);
  socket.on('serverturnend', Player.prototype.serverturnend);
  socket.on('servercapability', Player.prototype.servercapability);
  socket.on('serverdeal', Player.prototype.serverdeal);
  socket.emit('clientrejoin', location.href);
  // socket.emit('clientmove', [0,0,0], [0,0,0]);
  // socket.emit('clientjoin');
