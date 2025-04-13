function LOG () {
    Browser.print('X3D Avatar', ...arguments);
}

const addHAnimJoint = function(node) {
	const hAnimJoint = Browser.currentScene.createNode('HAnimJoint');
	Browser.currentScene.addNamedNode(node.id, hAnimJoint);
	updateJointPosition(node, hAnimJoint);
	return hAnimJoint;
}

const dotProduct = function(vector1, vector2) {
  return vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
}

const crossProduct = function(vector1, vector2) {
  return [
    vector1.y * vector2.z - vector1.z * vector2.y,
    vector1.z * vector2.x - vector1.x * vector2.z,
    vector1.x * vector2.y - vector1.y * vector2.x
  ];
}

function angleBetweenVectors(vector1, vector2) {
    const dot = dotProduct(vector1, vector2);
    const magnitude1 = vectorMagnitude(vector1);
    const magnitude2 = vectorMagnitude(vector2);

    if (magnitude1 === 0 || magnitude2 === 0) {
        return NaN; // Handle zero-length vectors (cannot define an angle)
    }

    const angle = Math.acos(dot/magnitude1/magnitude2)  // Use atan2 for correct quadrant
    return angle;
}

function vectorMagnitude(vector) {
    return Math.sqrt(dotProduct(vector, vector));
}

const normalize = function(vec) {
	const mag = vectorMagnitude(vec);
	if (mag != 0) {
		vec.x = vec.x/mag;
		vec.y = vec.y/mag;
		vec.z = vec.z/mag;
	}
	return vec
}

const updateJointPosition = function(node, hAnimJoint) {
	if (!hAnimJoint.center) {  // Joint center should be set in X3D file
		hAnimJoint.center = new SFVec3f(node.x, node.y, node.z);
	}
	let newOffset = {
		x: node.x - hAnimJoint.center.x,
		y: node.y - hAnimJoint.center.y,
		z: node.z - hAnimJoint.center.z
	};
	newOffset = normalize(newOffset);
	if (typeof node.oldOffset === 'undefined') {
		node.oldOffset = newOffset;
	}
	let angle = angleBetweenVectors(node.oldOffset, newOffset);
	let axis = crossProduct(node.oldOffset, newOffset);
	axis.x = axis[0];
	axis.y = axis[1];
	axis.z = axis[2];
	axis = normalize(axis);
	if (!isNaN(angle)) {
		hAnimJoint.rotation = new SFRotation( axis.x, axis.y, axis.z, angle);
	}
	node.oldOffset = newOffset;
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
      debugger;
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
	const NODE = 1;
	const ID = 2;
	const SQL = 3;
	const SOURCE = 4;
	const TARGET = 5;
	const X = 4;
	const Y = 5;
	const Z = 6;
	const JOINT = 7;
	let nick = command[NICK];


	if (command[NODE] === "J") { // JOINT
		let node = nodes.find(n => n.id === nick+"_"+command[JOINT]);
		if (!node) {
			node = {};
		}
		node.id = nick+"_"+command[JOINT];
		node.sql = command[SQL];
		node.x = parseFloat(command[X]);
		node.y = parseFloat(command[Y]);
		node.z = parseFloat(command[Z]);
		node.joint = command[JOINT];

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
			hAnimJoints[node.id] = hAnimJoint;
			nodes.push(node);
		}
	} else if (command[NODE] === "S") { // SEGMENT
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

const reconnect = function (x3duser) {
    'use strict';
	try {
	        x3duser._sockets = x3duser._sessions._sockets;
		LOG("reconnect!");
		let UserGlobalSessions = x3duser.updateSessions();
		for (let g in UserGlobalSessions) {
			let session = UserGlobalSessions[g];
			let sessionname = session['Session Petname'];
			let sessiontoken = session['Session Token'];
			let socket = x3duser._sockets[sessionname];
			if (socket !== null) {
				if (x3d_serveravatar !== null) {
					x3duser._sockets[sessionname].on('x3d_serveravatar', x3d_serveravatar);
				} else {
					LOG("reconnect Can't service x3d_serveravatar", sessionname, sessiontoken);
				}
			} else {
				LOG("Couldn't connect to", sessionlink);
			}
		}
	} catch (e) {
		LOG("ERROR RECONNECTING", e);
	}
};


reconnect(x3duser);
