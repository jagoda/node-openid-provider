var PORT = 3000;
var RESOURCE = "http://localhost:"+PORT+"/"

var express = require('express');
var OpenIDProvider = require('./provider.js');

//create new openidprovider
var oidp = new OpenIDProvider(RESOURCE, {
	association_expires: 60,
	request_data: 'oidp'
});
//create new express app
var app = express();
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(oidp.middleware());

//home page handler
app.get('/home', function(req, res, next) {
	res.header('Content-Type', 'text/html');
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

// //openid handler
// app.post('/login', function(req, res, next) {
// 	var NAMESPACE = "openid.";
// 	var ACCEPTED_METHODS = {
// 		associate: true,
// 		checkid_setup: true,
// 		checkid_immediate: true,
// 		check_authentication: true
// 	};
// 	var options = {};
// 	for(var opt in req.body) {
// 		if(opt.indexOf("openid.") == 0) {
// 			var key = opt.substr(NAMESPACE.length);
// 			options[key.toLowerCase()] = req.body[opt];
// 		}
// 	}
// 	if(options.mode.toLowerCase() in ACCEPTED_METHODS) {
// 		req.oidp = options;
// 		var r = oidp[options.mode.toLowerCase()](options, req, res, next);
// 		if(r) {
// 			res.send(r);
// 			res.end();
// 		}
// 		else {
// 			next();
// 		}
// 	}
// 	else {
// 		//throw new OpenIDModeNotFoundException(options['openid.mode']);
// 		next();
// 	}
// });

//openid login handler
app.all('/', function(req, res, next) {
	if(req.oidp) {
		//lets assume they are already logged in and just redirect
		res.redirect(303, oidp.checkid_setup_complete(req.oidp, "http://localhost:"+PORT+"/user/chris"));
		res.end();
		return;
	}
	//do the standard user login page
	res.header('Content-Type', 'text/html');
	res.end(  '<!DOCTYPE html>\n'
			+ '<html>\n'
			+ '	<head>\n'
			+ '		<title>OpenID Provider</title>\n'
			+ '		<link rel="openid2.provider" href="' + RESOURCE + '">\n'
			+ '	</head>\n'
			+ '	<body>\n'
			+ '		<h1>Login page for the openid provider</h1>\n'
			+ '	</body>\n'
			+ '</html>\n');
});

//user page handler
app.get('/user/:username', function(req, res, next) {
	//user page
	//needs to have the openid link rel tag
	res.header('Content-Type', 'text/html');
	res.end(  '<!DOCTYPE html>\n'
			+ '<html>\n'
			+ '	<head>\n'
			+ '		<title>OpenID Provider - User Page</title>\n'
			+ '		<link rel="openid2.provider" href="' + RESOURCE + '">\n'
			+ '		<link rel="openid2.local_id" href="http://localhost:'+PORT+'/user/' + req.params.username + '">\n'
			+ '	</head>\n'
			+ '	<body>\n'
			+ '		<h1>User page for the openid provider</h1>\n'
			+ '		<p>By specifying the link "openid2.local_id" in the head section, an openid consumer can find the provider and automatically determine which user wants to authenticate</p>\n'
			+ '	</body>\n'
			+ '</html>\n');
});

app.listen(PORT);
console.log("Listening on port " + PORT);
