var fs = require('fs');
var express = require('express');
//var templates = require('./templates');
var openid = require('./openid.js').openid;

var app = express();
//app.use(express.logger());
app.use(express.bodyParser());

app.get('/id/:name', function(req, res) {
	console.log(req.method, req.path);
	fs.readFile('./static/user.xrds.xml', function(err, data) {
		res.header('Content-Type', 'application/xrds+xml;charset=utf-8');
		res.send(data);
		res.end();
	});
});

app.get('/yadis/:name', function(req, res) {
	console.log(req.method, req.path);
	fs.readFile('./static/user.xrds.xml', function(err, data) {
		res.header('Content-Type', 'application/xrds+xml;charset=utf-8');
		res.send(data);
		res.end();
	});
});

app.get('/', function(req, res) {
	console.log(req.method, req.path);
	fs.readFile('./static/server.xrds.xml', function(err, data) {
		res.header('Content-Type', 'application/xrds+xml;charset=utf-8');
		res.send(data);
		res.end();
	});
});

app.get('/login', function(req, res) {
	console.log(req.method, req.path);
	res.send(openid(req, res));
	res.end();
});

app.post('/*', function(req, res) {
	console.log(req.method, req.path);
	res.send(openid(req, res));
	res.end();
});

app.get('/*', function(req, res) {
	console.log(req.method, req.path, "NOT HANDLED");
	//res.send(openid(req, res));
	res.end();
});

app.listen(3000);
console.log("serving on port 3000");