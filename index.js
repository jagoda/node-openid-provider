var express = require('express');
var OpenIDProvider = require('./provider.js');

var HOSTNAME = "http://localhost:3000/openid/"
var oidp = new OpenIDProvider(HOSTNAME, {
	association_expires: 60,
});
var app = express();

app.use('/openid', oidp.middleware({
	logging: true
}));
app.use(express.cookieParser());
app.use(express.bodyParser());

app.get('/', function(req, res) {
	res.end('<!DOCTYPE html><html><head><link rel="openid2.provider" href="http://localhost:3000/openid"></head><body><h1>Homepage for openid-provider</h1></body></html>');
});

app.all('/openid', function (req, res, next) {
	var options = req.body || req.query;
	var s = JSON.stringify(options);

	res.statusCode = 302;
	res.header('Location', '/login');
	res.cookie('oidpSession', s, {
		expires: new Date(Date.now() + 2*60*1000),
		path: '/',
//		secure: true,
//		httpOnly: true
	});
	res.end();
});

app.get('/login', function(req, res) {
 	res.end('<a href="/auth?username=chris">Log in as Chris</a>');
});

app.get('/auth', function(req, res) {
	var options = JSON.parse(req.cookies['oidpSession']);
	var username = req.query['username'];
	var url = oidp.checkid_setup_complete(username, options);
	res.statusCode = 302;
	res.header('Location', url);
	res.end("DONE");
});

app.listen(3000);
console.log("Listening on port 3000");
