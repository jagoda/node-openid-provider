var HOSTNAME = 'localhost';
var PORT = 3000;
function OPENID_ENDPOINT() {
	return "http://"+HOSTNAME+":"+PORT+"/";
}
function OPENID_USER_ENDPOINT(username) {
	return "http://"+HOSTNAME+":"+PORT+"/"+username.toLowerCase();
}

var express = require('express');
var OpenIDProvider = require('../lib/Provider.js');

//create new openidprovider
var oidp = new OpenIDProvider(OPENID_ENDPOINT());

//create an express application
var app = express();

//the openid provider middleware requires bodyParser
app.use(express.bodyParser());
app.use(oidp.middleware());

//create an XRDS Document for the server
app.get('/', function(req, res, next) {
	res.header('Content-Type', "application/xrds+xml");
	res.send(oidp.XRDSDocument());
	res.end();
});

//handle authentication
app.post('/', function(req, res, next) {
	if(req.oidp) {
		//assume the user 'Chris' is already logged in
		var url = oidp.checkid_setup_complete(req.oidp, OPENID_USER_ENDPOINT('Chris'));
		res.redirect(303, url);
		res.end();
	}
	else {
		console.log('Invalid OpenID Request');
		res.header('Content-Type', "application/xrds+xml");
		res.send(oidp.XRDSDocument());
		res.end();
	}
});

//create an XRDS Document for a user
app.get('/:username', function(req, res, next) {
	res.header('Content-Type', "application/xrds+xml");
	res.send(oidp.XRDSDocument(OPENID_USER_ENDPOINT(req.params.username)));
	res.end();
});

app.listen(PORT);
console.log("Listening on port "+PORT);