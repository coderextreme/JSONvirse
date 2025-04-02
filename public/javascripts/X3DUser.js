function LOG () {
    Browser.print('X3D Scene', ...arguments);
}

hAnimJoints = {};
linksShapes = {};
nodes = [];


class X3DUser {
	static LOG () {
	    Browser.print('X3D Browser', ...arguments);
	}
	get sockets() {
	    return this._sockets;
	}
	set sockets(value) {
	    this._sockets = value;
	}
	constructor(sessions) {
	      let x3duser = this;
	      this._x3duser = this;
	      this._sessions = sessions;
	      this._sockets = this._sessions._sockets;
	}
	emit(api, UserGlobalSessions) {
        	this.socket.emit(api, UserGlobalSessions);
	}
	updateSessions() {
		try {
			let UserGlobalSessions = JSON.parse($('#sessionjson').val());
			let unpackedSessions = [];
			for (let g in UserGlobalSessions) {
				if (UserGlobalSessions.hasOwnProperty(g) && parseInt(g, 10) >= 0) {
					let session = UserGlobalSessions[g];
					let sessionnames = session['Session Petname'].split(":");
					let sessiontokens = session['Session Token'].split(":");
					if (sessionnames.length != sessiontokens.length) {
						alert("Corrupted sessions, see matching colons");
					} else {
						for (let us in sessiontokens) {
							let unpackedSession = {
								"Session Petname" :sessionnames[us],
								"Session Token" :sessiontokens[us],
								"Session Type" :session["Session Type"],
								"Session Link" :session["Session Link"]
							}
							unpackedSessions.push(unpackedSession);
						}
					}
				}
			}
			UserGlobalSessions = unpackedSessions;
			$('#sessionjson').val(JSON.stringify(UserGlobalSessions, null, 2));
			return UserGlobalSessions;
		} catch (e) {
			X3DUser.LOG(e);
		}
	}
	loadX3D(selector, x3d) {
        try {
            if (typeof Browser !== 'undefined') {
			   // Import the X3D scene and handle the Promise
			   Browser.createX3DFromString(x3d)
			       .then(function(importedScene) {
					   // Replace the current world with the imported scene
					   Browser.replaceWorld(importedScene);
			       })
			       .catch(function(error) {
				 	   X3DUser.LOG('Error importing X3D scene:', error);
			       });
			} else {
				alert("X_ITE could not replaceWorld in loadX3D()");
				X3DUser.LOG("X_ITE could not replaceWorld in loadX3D()", selector, x3d);
			}
		} catch (e) {
			X3DUser.LOG(e);
		}
	}

	loadURL(selector, url) {
		try {
			if (typeof Browser !== 'undefined') {
				   // Import the X3D scene and handle the Promise
				   Browser.loadURL(new X3D.MFString (url))
				       .then(() => {
					       X3DUser.LOG('Success importing URL:', url);
					   })
					   .catch(function(error) {
					       X3DUser.LOG('Error importing URL:', error);
					   });
			} else {
				X3DUser.LOG("X_ITE could not load URL in loadURL()", selector, url);
			}
		} catch (e) {
			X3DUser.LOG(e);
		}
	}
	serverpublish(msg) {
		x3duser = new X3DUser(usersessions);
		X3DUser.LOG("Receiving publish", msg);
		if (msg[0].startsWith("http://") || msg[0].startsWith("https://")) {
			x3duser.loadURL("#scene", msg[0]);
		} else {
			x3duser.loadX3D("#scene", msg[0]);
		}
		reconnect(x3duser);
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
const addHAnimJoint = function(node) {
	const hAnimJoint = Browser.currentScene.createNode('HAnimJoint');
	Browser.currentScene.addNamedNode(node.id, hAnimJoint);
	updateJointPosition(node, hAnimJoint);
	return hAnimJoint;
}

const updateJointPosition = function(node, hAnimJoint) {
	hAnimJoint.center = new SFVec3f(node.x, node.y, node.z);
	hAnimJoint.translation = new SFVec3f(node.offsetx, node.offsety, node.offsetz);
}

const updateJointSphere = function(node, hAnimSegment) {
	// update Sphere color
	hAnimSegment.children[0].children[0].appearance.material.diffuseColor = new SFColor(node.red, node.green, node.blue);
	hAnimSegment.children[0].children[0].appearance.material.emissiveColor = new SFColor(node.red, node.green, node.blue);
	
	// update Sphere position
	hAnimSegment.children[0].translation = new SFVec3f(node.x + node.offsetx, node.y + node.offsety, node.z + node.offsetz);
}

const addHAnimSegment = function(link, sourceNode, targetNode) {
	// set up bone geometry
	const shape = Browser.currentScene.createNode('Shape');
	const appearance = Browser.currentScene.createNode('Appearance');
	const material = Browser.currentScene.createNode('Material');
	const hAnimSegment = Browser.currentScene.createNode('HAnimSegment');
	Browser.currentScene.addNamedNode('trans'+link, hAnimSegment);

	// set up joint geometry
	const transform = Browser.currentScene.createNode('Transform');
	const shape2 = Browser.currentScene.createNode('Shape');
	const appearance2 = Browser.currentScene.createNode('Appearance');
	const material2 = Browser.currentScene.createNode('Material');
	const sphere = Browser.currentScene.createNode('Sphere');

	sphere.radius = 3;
	material2.transparency = 0.0; // Start fully opaque
	appearance2.material = material2;
	shape2.geometry = sphere;
	shape2.appearance = appearance2;
	addChild(transform, shape2);
	addChild(hAnimSegment, transform);

	material.diffuseColor = new SFColor(1.0, 1.0, 1.0);
	material.emissiveColor = new SFColor(1.0, 1.0, 1.0);
	appearance.material = material;
	const lineSet = Browser.currentScene.createNode('LineSet');
	const coordinate = Browser.currentScene.createNode('Coordinate');
	if (coordinate && typeof sourceNode.x !== 'undefined') {
		coordinate.point = new MFVec3f(
			new SFVec3f(
				sourceNode.x + sourceNode.offsetx,
				sourceNode.y + sourceNode.offsety,
				sourceNode.z + sourceNode.offsetz),
			new SFVec3f(
				targetNode.x + targetNode.offsetx,
				targetNode.y + targetNode.offsety,
				targetNode.z + targetNode.offsetz));
	}
	Browser.currentScene.addNamedNode('point'+link, coordinate);
	lineSet.coord = coordinate;
	lineSet.vertexCount = new MFInt32(2);
	shape.appearance = appearance;
	shape.geometry = lineSet;
	addChild(hAnimSegment, shape);
	/*
	LOG("LineSet created", JSON.stringify({
	  source: [sourceNode.x, sourceNode.y, sourceNode.z],
	  target: [targetNode.x, targetNode.y, targetNode.z],
	  vertexCount: lineSet.vertexCount,
	  hasCoord: lineSet.coord !== null
	}));
	*/
	return hAnimSegment;
}

const addChild = function(node, value) {
	node.children.push(value);
}

const ensureHumanoidExists = function(nick, humanoidGroup) {
  let hAnimHumanoid = null;
  let humanoidDEF = nick+'_humanoid';
  try {
    hAnimHumanoid = Browser.currentScene.getNamedNode(humanoidDEF);
  } catch (e) {
    // Create the hAnimHumanoid if it doesn't exist
    hAnimHumanoid = Browser.currentScene.createNode('HAnimHumanoid');
    Browser.currentScene.addNamedNode(humanoidDEF, hAnimHumanoid);

    humanoidGroup.children.push(hAnimHumanoid);
  }
  return hAnimHumanoid;
}

const x3d_serveravatar = function(usernumber, dml, allowedToken) {
      let header = ["0", "0"];
      let command = ["DUMMY"];
      dml.forEach((line, index) => {
        let header_command = line.split(",");
	if (header_command.length == 1) {
		command = header_command[0].split("|");
	} else if (header_command.length == 2) {
      		header = header_command[0].split("|");
		command = header_command[1].split("|");
	}

	let timestamp = parseInt(header[0]);
	let sequence = parseInt(header[1]);
	const NICK = 0;
	const GEOMETRY = 1;
	const ID = 2;
	const SQL = 3;
	const RED = 4;
	const SOURCE = 4;
	const GREEN = 5;
	const TARGET = 5;
	const BLUE = 6;
	const X = 7;
	const Y = 8;
	const Z = 9;
	const OFFSET_X = 10;
	const OFFSET_Y = 11;
	const OFFSET_Z = 12;
	let nick = command[NICK];


	if (command[GEOMETRY] === "J") { // JOINT
		let node = nodes.find(n => n.id === nick+command[ID]);
		if (!node) {
			node = {};
		}
		node.id = nick+command[ID];
		node.sql = command[SQL];
		node.red = parseFloat(command[RED]);
		node.green = parseFloat(command[GREEN]);
		node.blue = parseFloat(command[BLUE]);
		node.x = 10 * parseFloat(command[X]);
		node.y = 10 * parseFloat(command[Y]);
		node.z = parseFloat(command[Z]);
		node.offsetx = parseFloat(command[OFFSET_X]);
		node.offsety = parseFloat(command[OFFSET_Y]);
		node.offsetz = parseFloat(command[OFFSET_Z]);

		// TODO humanoidGroup must be present in scene
		let humanoidGroup = Browser.currentScene.getNamedNode('humanoidGroup');
		let hAnimHumanoid = ensureHumanoidExists(nick, humanoidGroup);
		let hAnimJoint = null;
		try {
			hAnimJoint = Browser.currentScene.getNamedNode(node.id);
		} catch (e) {
			hAnimJoint = null;
		}
		if (hAnimJoint === null) {
			hAnimJoint = addHAnimJoint(node);
		}
		if (node.sql === 'U') {  // UPDATE
			updateJointPosition(node, hAnimJoint);
		}
		if (!hAnimJoints[node.id]) {
			if (hAnimHumanoid !== null) {
				hAnimHumanoid.skeleton.push(hAnimJoint);
				// LOG("SUCCESSFUL JOINT", node.id, node.x, node.y, node.z);
			} else {
				LOG("FATAL JOINT", node.id);
			}
			hAnimJoints[node.id] = hAnimJoint;
			nodes.push(node);
		} else {
			hAnimJoints[node.id] = hAnimJoint;
		}
	} else if (command[GEOMETRY] === "S") {  // SEGMENT
		const sourceNode = nodes.find(n => n.id === nick+command[SOURCE]);
		const targetNode = nodes.find(n => n.id === nick+command[TARGET]);
		let sql = command[SQL];
		let link = nick+command[SOURCE]+command[TARGET];
		if (sourceNode && targetNode) {
		  let hAnimSegment = null;
		  try {
		  	hAnimSegment = Browser.currentScene.getNamedNode('trans'+link);
		  } catch (e) {
		  	hAnimSegment = null;
		  }
		  if (hAnimSegment === null) {
			hAnimSegment = addHAnimSegment(link, sourceNode, targetNode);
			if (hAnimSegment !== null && !linksShapes[`${sourceNode.id}-${targetNode.id}-${link}`]) {
		  		linksShapes[`${sourceNode.id}-${targetNode.id}-${link}`] = hAnimSegment;
				addChild(hAnimJoints[sourceNode.id], hAnimSegment);
				LOG("SUCCESSFUL SEGMENT", link, sourceNode.id, targetNode.id);
			}
		  }
		  updateJointSphere(sourceNode, hAnimSegment);
		  if (sql === 'U') { // UPDATE
			  let coordinate = Browser.currentScene.getNamedNode('point'+link);
			  if (coordinate) {
				  if (typeof sourceNode.x !== 'undefined') {
					coordinate.point = new MFVec3f(
						new SFVec3f(
							sourceNode.x + sourceNode.offsetx,
							sourceNode.y + sourceNode.offsety,
							sourceNode.z + sourceNode.offsetz),
						new SFVec3f(
							targetNode.x + targetNode.offsetx,
							targetNode.y + targetNode.offsety,
							targetNode.z + targetNode.offsetz));
					// LOG("SUCCESSFUL COORDINATE", link, coordinate.point);
				  } else {
					LOG("FATAL COORDINATE", link, `${sourceNode.id} ${sourceNode.x} ${sourceNode.y} ${sourceNode.z}, ${targetNode.id} ${targetNode.x} ${targetNode.y} ${targetNode.z}`);
				  }
						
			  } else {
				LOG("COULDN'T FIND COORDINATE", link)
		          }

		  }
		  // Create arrow for directed relationship
		  //createArrow(sourceNode, targetNode, link);

		  // Create property label for link
		  //createArcLabel(link, sourceNode, targetNode, link);
		}
	} else {
		Browser.print("DEBUG", line);
	}
      });
      /*
      var xml = Browser.currentScene.toXMLString();
      if (document.querySelector("#x3d").innerHTML !== xml) {
      	document.querySelector("#x3d").innerHTML = xml;
      }
      */
}

const x3d_serverupdate =  function (usernumber, position, orientation, allowedToken) {
    'use strict';
    X3DUser.LOG("Called x3d_serverupdate with", usernumber, position, orientation, allowedToken);
    X3DUser.LOG("Relevant extra info", allowedToken, token_test(allowedToken));
    if (position !== null && orientation !== null && token_test(allowedToken) && position[0] ===  protoParameterName) {
        orientation[0] = parseFloat(orientation[0]);
        let ps = Browser.currentScene.getNamedNode("protoSensor");
        let t = Browser.currentScene.getNamedNode("protoTransform");
        let txt = Browser.currentScene.getNamedNode("protoText");
        if (shader) {
            X3DUser.LOG("old", shader.getField(protoParameterName).getValue());
            shader.getField(protoParameterName).setValue(orientation[0] * protoScale);
            X3DUser.LOG("new", shader.getField(protoParameterName).getValue());
        } else {
            X3DUser.LOG('ComposedShader not found');
        }
        if (txt) {
            let stringField = txt.getField("string");
            X3DUser.LOG("old", stringField.getValue());
            let label = protoParameterName;
            stringField.setValue(new MFString(label+"="+(orientation[0] * protoScale).toFixed(2)));
            X3DUser.LOG("new", stringField.getValue());
        } else {
            X3DUser.LOG('ComposedShader not found');
        }
        if (ps) {
            ps.offset = new SFVec3f(orientation[0], ps.offset[1], ps.offset[2]);
        } else {
            X3DUser.LOG("Not found protoSensor");
        }
        if (t) {
            t.translation = new SFVec3f(orientation[0], t.translation[1], t.translation[2]);
        } else {
            X3DUser.LOG("Not found protoTransform");
        }
    }
};

const reconnect = function (x3duser) {
    'use strict';
	try {
	        x3duser._sockets = x3duser._sessions._sockets;
		X3DUser.LOG("reconnect!");
		let UserGlobalSessions = x3duser.updateSessions();
		for (let g in UserGlobalSessions) {
			let session = UserGlobalSessions[g];
			let sessionname = session['Session Petname'];
			let sessiontoken = session['Session Token'];
			let socket = x3duser._sockets[sessionname];
			if (socket !== null) {
				// socket.emit('x3d_clientjoin');
				socket.emit("x3d_clientsessions", UserGlobalSessions);
				socket.emit("x3d_clientactivesession", sessiontoken);
				if (x3d_serverupdate !== null) {
					x3duser._sockets[sessionname].on('x3d_serverupdate', x3d_serverupdate);
				} else {
					X3DUser.LOG("FATAL skeleton reconnect Can't service x3d_serverupdate", sessionname, sessiontoken);
				}
				if (x3d_serveravatar !== null) {
					x3duser._sockets[sessionname].on('x3d_serveravatar', x3d_serveravatar);
				} else {
					X3DUser.LOG("reconnect Can't service x3d_serveravatar", sessionname, sessiontoken);
				}
				$('#session').on("change",function(){
					reconnect(x3duser);
				 });
				 socket.on('serverpublish', X3DUser.prototype.serverpublish);
				 socket.on('servercapability', X3DUser.prototype.servercapability);
				 // No need to rejoin, since Sessions.js does
				 // socket.emit('clientrejoin', location.href);
				 // socket.emit('clientmove', [0,0,0], [0,0,0]);
				 // socket.emit('clientjoin');
			} else {
				X3DUser.LOG("Couldn't connect to", sessionlink);
			}
		}
	} catch (e) {
		X3DUser.LOG("ERROR RECONNECTING", e);
	}
};

const token_test = function(test_token) {
        'use strict';
        let UserGlobalSessions = x3duser.updateSessions();
        for (let g in UserGlobalSessions) {
            let session = UserGlobalSessions[g];
            let sessiontoken = session['Session Token'];
            if (test_token === sessiontoken) {
                return true;
            }
        }
	x3duser.emit("x3d_clientsessions", UserGlobalSessions);
	return false;
};

const initialize = function () {
    'use strict';
    X3DUser.LOG("Called intialize");
    reconnect(x3duser);
};

const newTranslation = function(Value) {
    'use strict';
    for (let p in petNames) {
        let petName = petNames[p];
        if (x3duser._sockets[petName] !== null && typeof x3duser._sockets[petName] !== 'undefined') {
            protoValue_changed = Value.x * protoScale;
            protoText_changed = new MFString(protoParameterName+'='+protoValue_changed.toFixed(2));
            x3duser._sockets[petName].emit("x3d_clientmove", [protoParameterName],[Value.x]);
        } else {
            X3DUser.LOG("No socket for ", petName);
        }
    }
};

let x3duser = new X3DUser(usersessions);
reconnect(x3duser);

