var express = require('express');

function configuration(defaults, options) {
	for(var key in options || {}) {
		defaults[key] = options[key];
	}
	return defaults;
}

function logging(req, res, next) {
	console.log(req.method + " " + req.path, req.query['openid.mode']);
	next();
}

/** OPTIONS:
 * logging: [bool] true or false
 */
module.exports = function(oidp, options) {
	var oidp = oidp;

	//default config
	var config = configuration({
		logging: false
	}, options);

	//setup app
	var app = express();
	if(config.logging) {
		app.use(logging);
	}
	app.use(express.bodyParser());

	app.get('/', function(req, res) {
		var r = oidp.XRDSDocument();
		console.log(r);
		res.send(r);
		res.end();
	});

	app.get('/id/:name', function(req, res) {
		var r = oidp.XRDSDocument(req.params.name);
		res.send(r);
		res.end();
	});

	app.all('/login', function(req, res) {
		var r = oidp.handleRequest(req, res);
		res.send(r);
		res.end();
	});

	return app;
}
