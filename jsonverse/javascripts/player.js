function Player() {
}

Player.prototype = {
	updateGroups: function() {
		let groupsdescription = $('#sessionjson').val();
		socket.emit('clientgroups', groupsdescription);
		try {
			let UserGlobalGroups = JSON.parse(groupsdescription);
			// updateURLsAndGroups(X3D.getBrowser(), UserGlobalGroups);
			return UserGlobalGroups;
		} catch (e) {
			console.log(e);
			alert(e);
		}
	},
	servermessage: function(msg) {
		$('#messages').append($('<li>').text(msg));
		console.log("message from server", msg);
		scrollToBottom();
	},
	serverpublish: function(msg) {
		console.log("Receiving publish", msg)
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
		console.log(groups);
		let noop = $("<option>", {
		  value: "Not connected",  // could be token
		  text: "Not connected"
		});
		$('#group').append(noop);

		for (let g in groups) {
			let group = groups[g];
			console.log(group);
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
	serverupdate: function(playernumber, position, orientation) {
		if (typeof orientation[0] === 'string') {
			Player.prototype.servermessage(playernumber+" at "+position+" turns "+printCard(orientation[0].substr(4)));
		} else {
			Player.prototype.servermessage(playernumber+" at "+position+" turns "+orientation);
		}
		// orientation: stack, number, card, visibility
		if (typeof players[playernumber] === 'undefined') {
			players[playernumber] = {
				position: position,
				orientation: orientation,
			};
		} else {
			players[playernumber].position = position;
			players[playernumber].orientation = orientation;
		}
		//onLocationfound = function(e){
			for (var player in players) {
				console.log("last update "+player+" position "+players[player].position+" orientation "+players[player].orientation);

			}
		//}
        },
	serverheal: function() { console.log(arguments);},
	serverdamage: function() { console.log(arguments);},
	servercollision: function() { console.log(arguments);},
	serverorderchange: function() { console.log(arguments);},
	serverdie: function() { console.log(arguments);},
	servererror: function() { console.log(arguments);},
	serverroompurge: function() { console.log(arguments);},
	serverroomready: function() { console.log(arguments);},
	serverpowerplay: function() { console.log(arguments);},
	servercounter: function() { console.log(arguments);},
	serverturnbegin: function() { console.log(arguments);},
	serverturnend: function() { console.log(arguments);},
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
	    socket.emit('clientactivegroup', group);
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
  socket.emit('clientmove', [0,0,0], [0,0,0]);
  // socket.emit('clientjoin');
