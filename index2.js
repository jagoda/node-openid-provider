var express = require('express');
var OpenIDProvider = require('./provider.js');

var oidp = new OpenIDProvider("http://localhost:3000/login");

var app = express();
//app.use(express.logger());
app.use(express.bodyParser());

app.get('/', function (req, res) {
	res.header('Content-Type', 'application/xrds+xml;charset=utf-8');
	var r = oidp.XRDSDocument();
	res.send(r);
	res.end();
});

app.get('/id/:name', function (req, res) {
	var ID_HOST = "http://localhost:3000/id/" + req.params.name;
	res.header('Content-Type', 'application/xrds+xml;charset=utf-8');
	var r = oidp.XRDSDocument(ID_HOST);
	res.send(r);
	res.end();
});

app.get('/login', function (req, res) {
	var r = oidp.handleRequest(req.query);
	res.send(r);
	res.end();
});

app.post('/*', function (req, res) {
	var r = oidp.handleRequest(req.body);
	res.send(r);
	res.end();
});

app.listen(3000);
console.log("Serving on port 3000");