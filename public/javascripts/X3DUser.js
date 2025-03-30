function LOG () {
    Browser.print('X3D Scene', ...arguments);
}

nodesShapes = {};
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
const addNodeTransform = function(node) {

	// Create sphere for node
	const nodeTransform = Browser.currentScene.createNode('Transform');
	Browser.currentScene.addNamedNode(node.id, nodeTransform);

	const shape = Browser.currentScene.createNode('Shape');
	const appearance = Browser.currentScene.createNode('Appearance');
	const material = Browser.currentScene.createNode('Material');
	setField(material, 'diffuseColor', '1.0 1.0 1.0');
	setField(material, 'transparency', '0.0'); // Start fully opaque
	setField(appearance, 'material', material);

	const sphere = Browser.currentScene.createNode('Sphere');
	setField(sphere, 'radius', 20);

	setField(shape, 'appearance', appearance);
	setField(shape, 'geometry', sphere);
	setMFField(nodeTransform, 'children', shape);
	return nodeTransform;

}
const addLinkTransform = function(index, sourceNode, targetNode) {
	const shape = Browser.currentScene.createNode('Shape');
	const appearance = Browser.currentScene.createNode('Appearance');
	const material = Browser.currentScene.createNode('Material');
	const linkTransform = Browser.currentScene.createNode('Transform');
	Browser.currentScene.addNamedNode('trans'+index, linkTransform);

	setField(material, 'diffuseColor', "1 1 1");
	setField(material, 'emissiveColor', "1 1 1");
	setField(appearance, 'material', material);
	const lineSet = Browser.currentScene.createNode('LineSet');
	const coordinates = Browser.currentScene.createNode('Coordinate');
	if (coordinates && typeof sourceNode.x !== 'undefined') {
		setField(coordinates, 'point', new MFVec3f(
			new SFVec3f(sourceNode.x, sourceNode.y, sourceNode.z),
			new SFVec3f(targetNode.x, targetNode.y, targetNode.z))
		);
	}
	setField(lineSet, 'vertexCount', '2');
	Browser.currentScene.addNamedNode("point"+index, coordinates);
	setField(lineSet, 'coord', coordinates);
	setField(shape, 'appearance', appearance);
	setField(shape, 'geometry', lineSet);
	setMFField(linkTransform, 'children', shape);
	return linkTransform;
}

const setField = function(node, fieldName, value) {
	node.getField(fieldName).setValue(value);
}

const setMFField = function(node, fieldName, value) {
	let field = node.getField(fieldName);
	let children = field.getValue();
	children.push(value);
	field.setValue(children);
}

const x3d_serveravatar = function(usernumber, dml, allowedToken) {
      dml.forEach((line, index) => {
	let dind = line.lastIndexOf("}");
	if (dind > 0) {
	      line = line.substr(dind+1);
	}
	LOG(line);
	const command = line.split("|");
	if (command[0] === "NODE") {
		let node = nodes.find(n => n.id === command[1]);
		if (!node) {
			node = {};
		}
		node.id = command[1];
		node.sql = command[2];
		let nodeGroup = Browser.currentScene.getNamedNode('nodeGroup');
		let nodeTransform = null;
		try {
			nodeTransform = Browser.currentScene.getNamedNode(node.id);
		} catch (e) {
			Browser.print(e);
		}
		if (nodeTransform === null) {
			nodeTransform = addNodeTransform(node);
		}
		if (node.sql === 'UPDATE') {
			node.x = parseFloat(command[7]);
			node.y = parseFloat(command[8]);
			node.z = parseFloat(command[9]);
			setField(nodeTransform, 'translation', new SFVec3f(node.x, node.y, node.z));
			LOG("COORD", node.id, `${node.x} ${node.y} ${node.z}`);
			nodesShapes[node.id] = nodeTransform;
		} else if (node.sql === 'INSERT') {
			if (!nodesShapes[node.id]) {
				if (nodeGroup !== null) {
					setMFField(nodeGroup, 'children', nodeTransform);
				} else {
					LOG("FATAL NODE", node.id);
				}
				nodesShapes[node.id] = nodeTransform;
				nodes.push(node);
			}
		}
	} else if (command[0] === "SEGMENT") {
		const sourceNode = nodes.find(n => n.id === command[3]);
		const targetNode = nodes.find(n => n.id === command[4]);
		let sql = command[2];
		if (sourceNode && targetNode) {
		  let linkGroup = Browser.currentScene.getNamedNode('linkGroup');
		  let linkTransform = null;
		  try {
		  	linkTransform = Browser.currentScene.getNamedNode('trans'+index);
		  } catch (e) {
			Browser.print(e);
		  }
		  if (linkTransform === null) {
			linkTransform = addLinkTransform(index, sourceNode, targetNode);
			if (!linksShapes[`${sourceNode.id}-${targetNode.id}-${index}`]) {
		  		linksShapes[`${sourceNode.id}-${targetNode.id}-${index}`] = linkTransform;
				  if (linkGroup !== null) {
					setMFField(linkGroup, 'children', linkTransform);
				  } else {
					LOG("FATAL LINK", index);
				  }
			}
		  }
		  if (sql === 'UPDATE') {
			  let coordinates = Browser.currentScene.getNamedNode('point'+index);
			  if (coordinates) {
				  if (typeof sourceNode.x !== 'undefined') {
					setField(coordinates, 'point',
						new MFVec3f(
							new SFVec3f(sourceNode.x, sourceNode.y, sourceNode.z),
							new SFVec3f(targetNode.x, targetNode.y, targetNode.z))
					);
					LOG("SUCCESSFUL COORDINATE", index, `${sourceNode.id} ${sourceNode.x} ${sourceNode.y} ${sourceNode.z}, ${targetNode.id} ${targetNode.x} ${targetNode.y} ${targetNode.z}`);
				  } else {
					LOG("FATAL COORDINATE", index, `${sourceNode.id} ${sourceNode.x} ${sourceNode.y} ${sourceNode.z}, ${targetNode.id} ${targetNode.x} ${targetNode.y} ${targetNode.z}`);
				  }
						
			  } else {
				LOG("COULDN'T FIND COORDINATE", index)
		          }

		  }
		  // Create arrow for directed relationship
		  //createArrow(sourceNode, targetNode, link);

		  // Create property label for link
		  //createArcLabel(link, sourceNode, targetNode, index);
		}
	} else {
		Browser.print("DEBUG", line);
	}
      });
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
					X3DUser.LOG("Found x3d_serverupdate", sessionname, sessiontoken, UserGlobalSessions);
					x3duser._sockets[sessionname].on('x3d_serverupdate', x3d_serverupdate);
				} else {
					X3DUser.LOG("FATAL skeleton reconnect Can't service x3d_serverupdate", sessionname, sessiontoken);
				}
				if (x3d_serveravatar !== null) {
					X3DUser.LOG("Found x3d_serveravatar", sessionname, sessiontoken, UserGlobalSessions);
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

