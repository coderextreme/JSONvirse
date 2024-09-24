let sockets = {};

const LOG = function() {
    console.log('X3D', ...arguments);
};

class X3DUser {
	constructor() {
	}
	emit(api, UserGlobalSessions) {
        	this.socket.emit(api, UserGlobalSessions);
	}
	updateSessions() {
		try {
			let UserGlobalSessions = JSON.parse($('#sessionjson').val());
			return UserGlobalSessions;
		} catch (e) {
			LOG(e);
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
				 	   LOG('Error importing X3D scene:', error);
			       });
			} else {
				alert("X_ITE could not replaceWorld in loadX3D()");
				LOG("X_ITE could not replaceWorld in loadX3D()", selector, x3d);
			}
		} catch (e) {
			LOG(e);
		}
	}

	loadURL(selector, url) {
		try {
			/*
			document.querySelector("#scene").setAttribute("url", "\""+url+"\"");
			*/
			if (typeof Browser !== 'undefined') {
				   // Import the X3D scene and handle the Promise
				   LOG("url type", typeof url, url);
				   Browser.loadURL(new X3D.MFString (url))
				       .then(() => {
					       LOG('Success importing URL:', url);
					   })
					   .catch(function(error) {
					       LOG('Error importing URL:', error);
					   });
			} else {
				LOG("X_ITE could not load URL in loadURL()", selector, url);
			}
		} catch (e) {
			LOG(e);
		}
	}
	serverpublish(msg) {
		LOG("Receiving publish", msg);
		if (msg[0].startsWith("http://") || msg[0].startsWith("https://")) {
			user.loadURL("#scene", msg[0]);
		} else {
			user.loadX3D("#scene", msg[0]);
		}
		reconnect();
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

let user = new X3DUser();


const x3d_serverupdate =  function (usernumber, position, orientation, allowedToken) {
    'use strict';
    LOG("Called x3d_serverupdate with", usernumber, position, orientation, allowedToken);
    LOG("Relevant extra info", allowedToken, token_test(allowedToken));
    if (position !== null && orientation !== null && token_test(allowedToken) && position[0] ===  protoParameterName) {
        orientation[0] = parseFloat(orientation[0]);
        let ps = Browser.currentScene.getNamedNode("protoSensor");
        let t = Browser.currentScene.getNamedNode("protoTransform");
        let txt = Browser.currentScene.getNamedNode("protoText");
        if (shader) {
            LOG("old", shader.getField(protoParameterName).getValue());
            shader.getField(protoParameterName).setValue(orientation[0] * protoScale);
            LOG("new", shader.getField(protoParameterName).getValue());
        } else {
            LOG('ComposedShader not found');
        }
        if (txt) {
            let stringField = txt.getField("string");
            LOG("old", stringField.getValue());
            let label = protoParameterName;
            stringField.setValue(new MFString(label+"="+(orientation[0] * protoScale).toFixed(2)));
            LOG("new", stringField.getValue());
        } else {
            LOG('ComposedShader not found');
        }
        if (ps) {
            ps.offset = new SFVec3f(orientation[0], ps.offset[1], ps.offset[2]);
        } else {
            LOG("Not found protoSensor");
        }
        if (t) {
            t.translation = new SFVec3f(orientation[0], t.translation[1], t.translation[2]);
        } else {
            LOG("Not found protoTransform");
        }
    }
};

const reconnect = function () {
    'use strict';
	try {
		LOG("Reconnecting");
		let UserGlobalSessions = user.updateSessions();
		LOG("reconnect UGG", UserGlobalSessions);
		for (let sn in sockets) {
			sockets[sn].disconnect();
			sockets[sn] = null;
		}
		sockets = {};
		if (UserGlobalSessions !== null && (typeof UserGlobalSessions === 'object') && UserGlobalSessions.length > 0) {
			for (let g in UserGlobalSessions) {
				if (UserGlobalSessions.hasOwnProperty(g) && parseInt(g, 10) >= 0) {
					let session = UserGlobalSessions[g];
					let sessionname = session['Group Petname'];
					let sessiontoken = session['Group Token'];
					let sessionlink = session['Group Link'];
					let socket = null;
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
						LOG("Connect!");
						sockets[sessionname] = socket;
						socket.emit('x3d_clientjoin');
						socket.emit("x3d_clientsessions", UserGlobalSessions);
						socket.emit("x3d_clientactivesession", sessiontoken);
						if (x3d_serverupdate !== null) {
							LOG("Found x3d_serverupdate", sessionname, sessiontoken, UserGlobalSessions);
							sockets[sessionname].on('x3d_serverupdate', x3d_serverupdate);
						} else {
							LOG("reconnect Can't service x3d_serverupdate", sessionname, sessiontoken);
						}
						$(document).on('change','#session',function(){
							let session = $(this).val();
							if (session !== "common room" && session !== "Not connected") {
								socket.emit('x3d_clientactivesession', session);
							}
							reconnect();
						 });
						 socket.on('serverpublish', X3DUser.prototype.serverpublish);
						 socket.on('servercapability', X3DUser.prototype.servercapability);
						 socket.emit('clientrejoin', location.href);
						 // socket.emit('clientmove', [0,0,0], [0,0,0]);
						 // socket.emit('clientjoin');
					} else {
						LOG("Couldn't connect to", sessionlink);
					}
				}
			}
		}
	} catch (e) {
		LOG("ERROR RECONNECTING", e);
	}
};

const token_test = function(test_token) {
    'use strict';
    let UserGlobalSessions = user.updateSessions();
    if (UserGlobalSessions && UserGlobalSessions.length > 0) {
        for (let g in UserGlobalSessions) {
            let session = UserGlobalSessions[g];
            let sessiontoken = session['Group Token'];
            if (test_token === sessiontoken) {
                return true;
            }
        }
	user.emit("x3d_clientsessions", UserGlobalSessions);
    } else {
        LOG("UserGlobalSessions is not set right", UserGlobaSessions);
    }
    return false;
};

const initialize = function () {
    'use strict';
    LOG("Called intialize");
    reconnect();
};

const newTranslation = function(Value) {
    'use strict';
    LOG("newTranslation", petNames);
    for (let p in petNames) {
        let petName = petNames[p];
        if (sockets[petName] !== null && typeof sockets[petName] !== 'undefined') {
            protoValue_changed = Value.x * protoScale;
            protoText_changed = new MFString(protoParameterName+'='+protoValue_changed.toFixed(2));
            LOG("update", petName, protoText_changed, protoValue_changed);
            LOG("x3d_clientmove", petName, [protoParameterName],[Value.x]);
            sockets[petName].emit("x3d_clientmove", [protoParameterName],[Value.x]);
        } else {
            LOG("No socket for ", petName);
        }
    }
};
