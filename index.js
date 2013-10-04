var express = require('express');
var OpenIDProvider = require('./provider.js');

var oidp = new OpenIDProvider("http://localhost:3000/", {
	association_expires: 60
});

var app = express();
//app.use(express.logger());
app.use(express.bodyParser());

app.get('/', function (req, res) {
	console.log(req.method + " " + req.path, req.body['openid.mode']);
	res.header('Content-Type', 'application/xrds+xml;charset=utf-8');
	var r = oidp.XRDSDocument();
	res.send(r);
	res.end();
});

app.get('/id/:name', function (req, res) {
	console.log(req.method + " " + req.path, req.body['openid.mode']);
	res.header('Content-Type', 'application/xrds+xml;charset=utf-8');
	var r = oidp.XRDSDocument(req.params.name);
	res.send(r);
	res.end();
});

app.get('/login', function (req, res) {
	console.log(req.method + " " + req.path, req.query['openid.mode']);
	var r = oidp.handleRequest(req, res);
	res.send(r);
	res.end();
});

app.post('/*', function (req, res) {
	console.log(req.method + " " + req.path, req.body['openid.mode']);
	var r = oidp.handleRequest(req, res);
	res.send(r);
	res.end();
});

app.listen(3000);
console.log("Serving on port 3000");