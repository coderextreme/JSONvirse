function LOG () {
    Browser.print('X3D Avatar', ...arguments);
}

const addHAnimJoint = function(node) {
	const hAnimJoint = Browser.currentScene.createNode('HAnimJoint');
	Browser.currentScene.addNamedNode(node.DEF, hAnimJoint);
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

const updateJointRotation = function(sourceNode, sourceJoint, targetNode, targetJoint) {
	if (!sourceJoint.center) {  // Joint center should be set in X3D file
		LOG("Center isn't set", JSON.stringify(sourceNode));
	} else {
		let newRay = {
			x: targetNode.x - sourceJoint.center.x,
			y: targetNode.y - sourceJoint.center.y,
			z: targetNode.z - sourceJoint.center.z
		};
		newRay = normalize(newRay);
		if (typeof sourceNode.oldRay === 'undefined') {
			sourceNode.oldRay = newRay;
		}
		let angle = angleBetweenVectors(sourceNode.oldRay, newRay);
		let axis = crossProduct(sourceNode.oldRay, newRay);
		axis.x = axis[0];
		axis.y = axis[1];
		axis.z = axis[2];
		axis = normalize(axis);
		if (!isNaN(angle)) {
			sourceJoint.rotation = new SFRotation( axis.x, axis.y, axis.z, angle);
			if (sourceJoint.rotation !== {}) {
				if (angle !== 0) {
					LOG(sourceNode.DEF, sourceNode.id, targetNode.DEF, targetNode.id, angle);
				}
			}
		}
		sourceNode.oldRay = newRay;
	}
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
		let node = nodes.find(n => n.id === nick+command[ID]);
		if (!node) {
			node = {};
		}

		let side = (
			(command[ID].startsWith("l") || command[ID].startsWith("r")) &&
			!(command[JOINT].startsWith("l_") || command[JOINT].startsWith("r_"))
			? command[ID].substring(0,1)+"_"
			: "" );
		node.joint = side+command[JOINT].replace("\n", "");
		node.DEF = nick+"_"+node.joint;
		node.id = nick+command[ID];
		node.sql = command[SQL];
		node.x = parseFloat(command[X]);
		node.y = parseFloat(command[Y]);
		node.z = parseFloat(command[Z]);

		// TODO humanoidGroup must be present in scene
		let humanoidGroup = Browser.currentScene.getNamedNode('humanoidGroup');
		let hAnimHumanoid = ensureHumanoidExists(nick, humanoidGroup);
		let hAnimJoint = null;
		try {
			hAnimJoint = Browser.currentScene.getNamedNode(node.DEF);
		} catch (e) {
			hAnimJoint = null;
		}
		if (hAnimJoint === null) {
			hAnimJoint = addHAnimJoint(node);
			// LOG("ADDED JOINT", node.DEF);
		}
		if (!hAnimJoints[node.id]) {
			hAnimJoints[node.id] = hAnimJoint;
			nodes.push(node);
		}
		// LOG("Got node", JSON.stringify(node));
	} else if (command[NODE] === "S") { // SEGMENT
		const sourceNode = nodes.find(n => n.id === nick+command[SOURCE]);
		const targetNode = nodes.find(n => n.id === nick+command[TARGET]);
		if (sourceNode && targetNode) {
		  updateJointRotation(sourceNode, hAnimJoints[sourceNode.id], targetNode, hAnimJoints[targetNode.id]);
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
      					debugger;
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
