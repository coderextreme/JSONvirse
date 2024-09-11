function Player() {
}

Player.prototype = {
	servermessage: function(msg) {
		$('#messages').append($('<li>').text(msg));
		console.log("message from server", msg);
		scrollToBottom();
	},
	serverpublish: function(msg) {
		console.log("Receiving publish", msg)
		// if Prompt begins with http, get it
		if (msg[0].startsWith("http://") || msg[0].startsWith("https://")) {
			loadURL("#scene", msg[0]);
		} else {
			loadJS("#scene", msg[0]);
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
		// document.querySelector("field[name='"+position[0]+"']").setAttribute("value", orientation[0]);
		console.log("position",position,"orientation",orientation);
		if (position[0] == 'a' || position[0] == 'b' ||position[0] == 'c' || position[0] == 'd' ||position[0] == 'tdelta' || position[0] == 'pdelta') {
			orientation[0] = parseFloat(orientation[0]);
			console.log(position[0]+" PlaneSensor[DEF='"+position[0]+"Sensor']");
			let ps = X3D.getBrowser().currentScene.getNamedNode(position[0] + "Sensor");
			let t = X3D.getBrowser().currentScene.getNamedNode(position[0] + "Transform");
			let txt = X3D.getBrowser().currentScene.getNamedNode(position[0] + "Text");
			let shader = X3D.getBrowser().currentScene.getNamedNode('x_iteShader');
			if (shader) {
			    console.log("old", shader.getField(position[0]).getValue());
			    let mult = 1;
			    if ('a' == position[0] || 'b' == position[0]) {
				    mult = 30;
			    } else if ('c' == position[0] || 'd' == position[0]) {
				    mult = 20;
			    }
			    shader.getField(position[0]).setValue(orientation[0] * mult);
			    console.log("new", shader.getField(position[0]).getValue());
			} else {
			    console.error('ComposedShader not found');
			}
			if (txt) {
			    let stringField = txt.getField("string");
			    console.log("old", stringField.getValue());
			    let mult = 1;
			    if ('a' == position || 'b' == position) {
				    mult = 30;
			    } else if ('c' == position || 'd' == position) {
				    mult = 20;
			    }
			    let label = position[0];
			    if (label == "pdelta") {
				    label = "phi delta";
			    } else if (label == "tdelta") {
				    label = "theta delta";
			    }
			    stringField.setValue(new X3D.MFString(label+"="+(orientation[0] * mult).toFixed(2)));
			    console.log("new", stringField.getValue());
			} else {
			    console.error('ComposedShader not found');
			}
			if (ps) {
				ps.offset = new X3D.SFVec3f(orientation[0], ps.offset[1], ps.offset[2]);
			} else {
				console.log("Not found", position[0] + "Sensor");
			}
			if (t) {
				t.translation = new X3D.SFVec3f(orientation[0], t.translation[1], t.translation[2]);
			} else {
				console.log("Not found", position[0] + "Transform");
			}
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
      $('form').submit(function(){
	let message = $('#m').val();
        socket.emit('clientmessage', message);
        $('#m').val('');
	  try {
		if (message.startsWith("http")) {
			// sent the link to the server to avoid CORS
			socket.emit('clientpublish', message);
		} else {
			// Grab the JSON in the text area
			socket.emit('clientpublish', $('#json').val().replace(/\n/g, ""));
		}
	  } catch (error) {
	    console.error(error.message);
	  }
        return false;
      });
  socket.on('servermessage', Player.prototype.servermessage);
  socket.on('serverpublish', Player.prototype.serverpublish);
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
