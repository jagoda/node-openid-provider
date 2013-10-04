var express = require('express');
var OpenIDProvider = require('./provider.js');

var HOSTNAME = "http://localhost:3000/openid/"
var app = express();
var oidp = new OpenIDProvider(HOSTNAME, {
	association_expires: 60,
});
app.use('/openid', oidp.middleware({
	logging: true
}));

app.get('/', function(req, res) {
	res.end('<!DOCTYPE html><html><head><link rel="openid2.provider" href="http://localhost:3000/openid"></head><body><h1>Hello World</h1></body></html>');
});

app.all('/openid', function (req, res, next) {
	var options = req.body || req.query;
	var s = JSON.stringify(options);
	res.end('<a href="/auth?username=chris&openid='+escape(s)+'">Log in as Chris</a>');
});

// app.get('/login', function(req, res) {
// 	res.ee
// });

app.get('/auth', function(req, res) {
	var options = JSON.parse(unescape(req.query['openid']));
	var username = req.query['username'];
	var url = oidp.checkid_setup_complete(username, options);
	res.writeHead(302, {
		'Location': url
	});
	res.end("DONE");
});

app.listen(3000);
console.log("Listening on port 3000");
