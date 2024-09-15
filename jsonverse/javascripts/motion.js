var socket = io({
  transports: ["polling", "websocket", "webtransport"]
});
var players = [];
var thisplayer = -1;
