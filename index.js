var express = require('express');
const bodyParser = require('body-parser');

var fs = require('fs');
var app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow requests from any origin
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var http = require('http').Server(app);
var io = require('socket.io')(http, {
    maxHttpBufferSize: 1e8, pingTimeout: 60000,
    transports: ["polling", "websocket", "webtransport"] // WebTransport is not enabled by default
});

let Multiplayer = require("./Multiplayer")

var metaServer = process.env.METASERVER || null;
if (metaServer != null) {
	var Client = require('node-rest-client').Client;
	var client = new Client();
}
new Multiplayer(io, metaServer);

app.use(express.static(__dirname + '/jsonverse'));
// app.use(express.static(__dirname));
var router = express.Router();
router.route('/servers')
        .get(function(req, res) {
			// console.log(res);
		try {
			if (metaServer != "") {
				client.get(metaServer+"/api/servers/", function(gameServers, response){
					console.log(gameServers);
					res.json(JSON.parse(gameServers));
				});
			}
		} catch (e) {
			console.error("Start meta server first.");
			console.log(e);
		}
        });
router.route('/group')
  .post(function(req, res) {
    try {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      const visit = req.body;
      // console.log(req.body);
      res.json(visit);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "An error occurred" });
    }
  });
router.route('/petnames')
  .post(function(req, res) {
    try {
      // console.log("receiving", req.body);
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      // console.log("receiving2", req.body);
      let data = JSON.parse(fs.readFileSync(__dirname + "/jsonverse/javascripts/petnames.json"));
      // console.log("reading", data);
      const from = req.body[0];
      const relationship = req.body[1];
      const to = req.body[2];
      // console.log(from, relationship, to);

      if (from && relationship && to) {
        let sanitizedFrom = from.replace(/[<>&]/g, " ");
        let sanitizedRelationship = relationship.replace(/[<>&]/g, " ");
        let sanitizedTo = to.replace(/[<>&]/g, " ");

        data.push([sanitizedFrom, sanitizedRelationship, sanitizedTo]);
        // console.log("writing", data);
        fs.writeFileSync(__dirname + "/jsonverse/javascripts/petnames.json", JSON.stringify(data));
      }

      // console.log("sending", data);
      res.json(data);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "An error occurred" });
    }
  });
app.use('/api', router);

var defaultPort = 8088;

http.listen(process.env.X3DJSONPORT || defaultPort);

console.log('go to http://localhost:%s/ or '+metaServer+' in your browser or restart after typing $ export X3DJSONPORT=8088 # at your terminal prompt', process.env.X3DJSONPORT || defaultPort);
console.log('go to http://localhost:%s/jsonverse/apache.html or '+metaServer+' in your browser or restart after typing $ export X3DJSONPORT=8088 # at your terminal prompt', process.env.X3DJSONPORT || defaultPort);
console.log('go to http://localhost:%s/petnames.html or '+metaServer+' in your browser or restart after typing $ export X3DJSONPORT=8088 # at your terminal prompt', process.env.X3DJSONPORT || defaultPort);


http.on('error', function (e) {
  if (e.code == 'EADDRINUSE') {
    console.log('Address in use, exiting...');
  }
});
