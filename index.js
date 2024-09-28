var express = require('express');
const bodyParser = require('body-parser');
const Handlebars = require("handlebars");

var fs = require('fs');
var app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow requests from any origin
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

var http = require('http').Server(app);
var io = require('socket.io')(http, {
    maxHttpBufferSize: 1e9, pingTimeout: 60000,
    transports: [ "polling", "websocket" ]
});

let Multiplayer = require("./Multiplayer")

var metaServer = process.env.METASERVER || null;
if (metaServer != null) {
	var Client = require('node-rest-client').Client;
	var client = new Client();
}
new Multiplayer(io, metaServer);

app.use(express.static(__dirname + '/public'));
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
      let data = JSON.parse(fs.readFileSync(__dirname + "/public/javascripts/petnames.json"));
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
        fs.writeFileSync(__dirname + "/public/javascripts/petnames.json", JSON.stringify(data));
      }

      // console.log("sending", data);
      res.json(data);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "An error occurred" });
    }
  });
app.use('/api', router);

var router2 = express.Router();
router2.route('/template/:SessionName/:SessionPassword/:WebSocket')
  .get(function(req, res) {
	console.log("Got template request");
        let templatecode = fs.readFileSync(__dirname + "/public/template.html").toString();
	const template = Handlebars.compile(templatecode);
	  // TODO validation
	const templateparams = {
		sessionName : req.params.SessionName,
		sessionPassword : req.params.SessionPassword,
		webSocket : req.params.WebSocket
	}
	res.send(template(templateparams));
  });
router2.route('/templateapache/:SessionName/:SessionPassword/:WebSocket')
  .get(function(req, res) {
	console.log("Got templateapache request");
        let templatecode = fs.readFileSync(__dirname + "/public/templateapache.html").toString();
	const template = Handlebars.compile(templatecode);
	  // TODO validation
	if (req.params.WebSocket === '"null"' || req.params.WebSocket === 'null') {
		req.params.WebSocket === null;
	}
	const templateparams = {
		sessionName : req.params.SessionName,
		sessionPassword : req.params.SessionPassword,
		webSocket : req.params.WebSocket
	}
	res.send(template(templateparams));
  });
app.use('/tapi', router2);


var defaultPort = 8088;

var port = process.env.X3DJSONPORT || defaultPort;

http.listen(port);

console.log('go to the following in your browser or restart after typing $ export X3DJSONPORT=8088 # at your terminal prompt:');
console.log('\thttp://localhost:%s/', port);
console.log('\thttp://localhost:%s/tapi/template/yottzumm/Unique%20Super%20Secret%20Password/ws%3A%2F%2Flocalhost%3A8088', port);
console.log('\thttp://localhost:%s/tapi/templateapache/yottzumm/Unique%20Super%20Secret%20Password/ws%3A%2F%2Flocalhost%3A8088', port);
console.log('\thttp://localhost:%s/yottzumm.html', port);
console.log('\thttp://localhost:%s/yottzumm2.html', port);
console.log('\thttp://localhost:%s/petnames.html', port);
console.log('\thttps://lc-soc-lc.at:%s/yottzumm/public/index.html', 8443);
console.log('\thttps://lc-soc-lc.at:%s/yottzumm/tapi/templateapache/yottzumm/Unique%20Super%20Secret%20Password/null', 8443);
console.log('\thttps://lc-soc-lc.at:8443/yottzumm/public/tapi/templateapache/yottzumm/Unique%20Super%20Secret%20Password/null', 8443);
console.log('\thttps://lc-soc-lc.at:%s/yottzumm/public/yottzumm.html', 8443);
console.log('\thttps://lc-soc-lc.at:%s/yottzumm/public/yottzumm2.html', 8443);
console.log('\thttps://lc-soc-lc.at:%s/yottzumm/public/lc-soc-lc.html', 8443);
/*
console.log('\thttps://lc-soc-lc.at:%s/yottzumm/public/petnames.html', 8443);
*/
if (metaServer === null) {
	console.log('You may wish to type $ export METASERVER=8088 # at your terminal prompt to atttach to the metaserver after launching the meta server');
} else {
	console.log('\t'+metaServer);
}


http.on('error', function (e) {
  if (e.code == 'EADDRINUSE') {
    console.log('Address in use, exiting...');
  }
});
