let sockets = {};

const LOG = function() {
    Browser.print('BROWSER', ...arguments);
};

const reconnect = function () {
    'use strict';
    let g = null, group = null, groupname = null, grouptoken = null, grouplink = null, socket = null;
    LOG("Reconnecting");
    let UserGlobalGroups = Player.prototype.updateGroups();
    LOG("reconnect UGG", UserGlobalGroups);
    sockets = {};
    if (UserGlobalGroups !== null && (typeof UserGlobalGroups === 'object') && UserGlobalGroups.length > 0) {
        for (g in UserGlobalGroups) {
            if (UserGlobalGroups.hasOwnProperty(g) && parseInt(g, 10) >= 0) {
                group = UserGlobalGroups[g];
                groupname = group['Group Petname'];
                grouptoken = group['Group Token'];
                grouplink = group['Group Link'];
                socket = null;
                if (grouplink && typeof grouplink === 'string') {
                    try {
                        socket = io(grouplink, {
                            maxHttpBufferSize: 1e8, pingTimeout: 60000,
                            transports: [ "polling", "websocket" ]
                        });
                        LOG('Connected to remote scene server', grouplink);
                    } catch (e) {
                        LOG(e);
                    }
                } else {
                    LOG('Group Link must be specificed in Session Description for scene collaboration');
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
                    sockets[groupname] = socket;
                    socket.emit('clientjoin');
                    socket.emit("clientgroups", UserGlobalGroups);
                    socket.emit("clientactivegroup", grouptoken);
                    if (x3d_serverupdate !== null) {
                        LOG("Found x3d_serverupdate", groupname, grouptoken, UserGlobalGroups);
                        sockets[groupname].on('x3d_serverupdate', x3d_serverupdate);
                    } else {
                        LOG("reconnect Can't service x3d_serverupdate", groupname, grouptoken);
                    }
                } else {
                    LOG("Couldn't connect to", grouplink);
                }
            }
        }
    }
};

const x3d_serverupdate =  function (playernumber, position, orientation, allowedToken) {
    'use strict';
    LOG("Called x3d_serverupdate with", playernumber, position, orientation, allowedToken);
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
const token_test = function(test_token) {
    'use strict';
    let UserGlobalGroups = Player.prototype.updateGroups();
    if (UserGlobalGroups && UserGlobalGroups.length > 0) {
        for (let g in UserGlobalGroups) {
            let group = UserGlobalGroups[g];
            let grouptoken = group['Group Token'];
            if (test_token === grouptoken) {
                return true;
            }
        }
        socket.emit("clientgroups", UserGlobalGroups);
    } else {
        LOG("UserGlobalGroups is not set right", UserGlobaGroups);
    }
    return false;
};

const initialize = function () {
    'use strict';
    LOG("Called intialize");
    reconnect();
    for (let p in petNames) {
        let petName = petNames[p];
        LOG("adding event handler server update", petName, protoParameterName);
        if (typeof sockets[petName] !== 'undefined') {
            LOG("init socket is ", sockets[petName]);
            if (x3d_serverupdate !== null) {
                sockets[petName].on('x3d_serverupdate', x3d_serverupdate);
            } else {
                LOG("init Can't service x3d_serverupdate", petName);
            }
        } else {
            LOG("Can't find socket for petName", petName);
        }
    }
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
            LOG("clientmove", petName, [protoParameterName],[Value.x]);
            sockets[petName].emit("clientmove", [protoParameterName],[Value.x]);
        } else {
            LOG("No socket for ", petName);
        }
    }
};
