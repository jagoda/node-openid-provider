var PORT = 3000;
var RESOURCE = "http://localhost:3000/openid/"

var express = require('express');
var OpenIDProvider = require('./provider.js');

var oidp = new OpenIDProvider(RESOURCE, {
	association_expires: 60,
});
var app = express();

app.use('/openid', oidp.middleware({
	logging: true
}));
app.use(express.cookieParser());
app.use(express.bodyParser());

app.get('/', function(req, res) {
	res.end(  '<!DOCTYPE html>\n'
			+ '<html>\n'
			+ '	<head>\n'
			+ '		<title>OpenID Provider</title>\n'
			+ '		<link rel="openid2.provider" href="' + RESOURCE + '">\n'
			+ '	</head>\n'
			+ '	<body>\n'
			+ '		<h1>Homepage for the openid provider</h1>\n'
			+ '		<p>By specifying the link "openid2.provider" in the head section, an openid consumer can find the provider from the root of a website</p>\n'
			+ '	</body>\n'
			+ '</html>\n');
});

app.get('/user/:id', function(req, res) {
	res.end(  '<!DOCTYPE html>\n'
			+ '<html>\n'
			+ '	<head>\n'
			+ '		<title>OpenID Provider - User Page</title>\n'
			+ '		<link rel="openid2.local_id" href="' + RESOURCE + 'id/' + req.params.id + '">\n'
			+ '	</head>\n'
			+ '	<body>\n'
			+ '		<h1>User page for the openid provider</h1>\n'
			+ '		<p>By specifying the link "openid2.local_id" in the head section, an openid consumer can find the provider and automatically determine which user wants to authenticate</p>\n'
			+ '	</body>\n'
			+ '</html>\n');
})

app.all('/openid', function (req, res, next) {
	var options = {}
	if(req.method.toUpperCase() == "GET") {
		options = req.query;
	}
	else if(req.method.toUpperCase() == "POST") {
		options = req.body;
	}
	res.statusCode = 302;
	res.header('Location', '/login');
	res.cookie('oidpSession', JSON.stringify(options), {
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
	res.end();
});

app.listen(PORT);
console.log("Listening on port " + PORT);
