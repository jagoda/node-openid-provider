var express = require('express');
var myware = require('./middleware.js');

var app = express();

app.use('/openid', myware());

app.get('/', function(req, res) {
	res.end("<h1>Hello World</h1>");
});

app.listen(1337);
console.log("Listening on port 1337");
