var express = require('express');
var OpenIDProvider = require('./provider.js');

var HOSTNAME = "http://localhost:3000/openid/"
var app = express();
var oidp = new OpenIDProvider(HOSTNAME, {
	association_expires: 60
});
app.use('/openid', oidp.middleware({
	logging: true
}));

app.get('/', function(req, res) {
	res.end('<!DOCTYPE html><html><head><link rel="openid2.provider" href="http://localhost:3000/openid/login"></head><body><h1>Hello World</h1></body></html>');
});

app.listen(3000);
console.log("Listening on port 3000");
