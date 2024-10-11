import { io } from 'socket.io-client';

var socket = io("https://lc-soc-lc.at:8443/socket.io", {
    maxHttpBufferSize: 1e9, pingTimeout: 60000,
    transports: [ "polling", "websocket" ]
});

if (socket === null) {
	console.log("Didn't connect!");
} else {
	console.log("Connect!");
}
