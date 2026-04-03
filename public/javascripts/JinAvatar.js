function LOG () {
    Browser.print('X3D Avatar', ...arguments);
}

const addHAnimJoint = function(node) {
	const hAnimJoint = Browser.currentScene.createNode('HAnimJoint');
	Browser.currentScene.addNamedNode(node.DEF, hAnimJoint);
	return hAnimJoint;
}

/*
const dotProduct = function(vector1, vector2) {
  return vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
}
*/

/*
const crossProduct = function(vector1, vector2) {
  return [
    vector1.y * vector2.z - vector1.z * vector2.y,
    vector1.z * vector2.x - vector1.x * vector2.z,
    vector1.x * vector2.y - vector1.y * vector2.x
  ];
}
*/

/*
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
*/

/*
function vectorMagnitude(vector) {
    return Math.sqrt(dotProduct(vector, vector));
}
*/

/*
const normalize = function(vec) {
	const mag = vectorMagnitude(vec);
	if (mag != 0) {
		vec.x = vec.x/mag;
		vec.y = vec.y/mag;
		vec.z = vec.z/mag;
	}
	return vec
}
*/

/**
 * Converts a normalized quaternion to an axis and angle representation.
 * @param {number[]} q The quaternion as an array [x, y, z, w].
 * @returns {object} An object containing the axis [x, y, z] and angle (in radians).
 */
function quaternionToAxisAngle(q) {
    // Ensure the quaternion is normalized (optional, but good practice to avoid errors)
    // In practice, rotation quaternions are usually already normalized.
    // If not, you should normalize it first.
    // const length = Math.sqrt(q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3]);
    // q = [q[0]/length, q[1]/length, q[2]/length, q[3]/length];

    const angle = 2 * Math.acos(q[3]); // Angle in radians
    let s = Math.sqrt(1 - q[3] * q[3]); // sin(angle/2)

    // Handle the case where the angle is close to zero or 180 degrees to prevent division by zero
    if (s < 0.001) {
        // If s is close to zero, then the angle is close to 0 or 180 degrees (pi radians).
        // If angle is 0, any axis will work (no rotation).
        // If angle is 180 (pi), the axis is the vector part of the quaternion.
        // The direction of the axis may not be important in this case.
        return {
            axis: [q[0], q[1], q[2]],
            angle: angle
        };
    } else {
        // Normalise the axis
        return {
            axis: [q[0] / s, q[1] / s, q[2] / s],
            angle: angle
        };
    }
}

const updateJointRotation = function(sourceJoint, node) {
	
	if (!sourceJoint.center) {  // Joint center should be set in X3D file
		LOG("Center isn't set", JSON.stringify(sourceNode));
	}
	if (!isNaN(node.angle)) {
		if (!sourceJoint.name.endsWith("knee") &&
		    // !sourceJoint.name.endsWith("hips") &&
		    !sourceJoint.name.endsWith("sacroiliac") &&
		    !sourceJoint.name.endsWith("vt1")) {
			const myQuaternion = [ node.pitch, node.yaw, node.roll, node.angle ];
			const rotation = quaternionToAxisAngle(myQuaternion);
		    	if (sourceJoint.name.endsWith("hip")) {
				sourceJoint.rotation = new SFRotation(0, 1, 0, 0);
				console.log(sourceJoint.name, "rotation", sourceJoint.rotation.x, sourceJoint.rotation.y, sourceJoint.rotation.z, sourceJoint.rotation.angle);
			} else {
				sourceJoint.rotation = new SFRotation(rotation.axis[0], rotation.axis[1], rotation.axis[2], rotation.angle);
				console.log(sourceJoint.name, "rotation", sourceJoint.rotation.x, sourceJoint.rotation.y, sourceJoint.rotation.z, sourceJoint.rotation.angle);
			}
		}
	}
}

const updateJointLocation = function(sourceJoint, node) {
	
	if (!sourceJoint.center) {  // Joint center should be set in X3D file
		LOG("Center isn't set", JSON.stringify(sourceNode));
	}
	// sourceJoint.center = new SFVec3f( node.x, (3 - node.y) / 2, node.z );
	// console.log("center", sourceJoint.center.x, sourceJoint.center.y, sourceJoint.center.z);
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

const x3d_serveravatar = function(usernumber, command, allowedToken) {
	// console.log(command);
	const JOINT = 0;
	const X = 1;
	const Y = 2;
	const Z = 3;
	const Pitch = 4;
	const Yaw = 5;
	const Roll = 6;
	const Angle = 7;
	let nick = "Joe";

	let node = {};
	node.joint = command[JOINT].replace("\n", "");
	node.DEF = nick+"_"+node.joint;
	node.x = parseFloat(command[X]);
	node.y = parseFloat(command[Y]);
	node.z = parseFloat(command[Z]);
	node.pitch = parseFloat(command[Pitch]);
	node.yaw = parseFloat(command[Yaw]);
	node.roll = parseFloat(command[Roll]);
	node.angle = parseFloat(command[Angle]);

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
	}
	updateJointLocation(hAnimJoint, node);
	updateJointRotation(hAnimJoint, node);
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
