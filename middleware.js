var express = require('express');

function configuration(defaults, options) {
	for(var key in options || {}) {
		defaults[key] = options[key];
	}
	return defaults;
}

function logging(req, res, next) {
	console.log(req.method + " " + req.path, (req.body || req.query)['openid.mode']);
	next();
}

/** OPTIONS:
 * logging: [bool false] Set to true to enable logging
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

	//id handler
	app.get('/id/:name', function(req, res) {
		var r = oidp.XRDSDocument(req.params.name);
		res.send(r);
		res.end();
	});

	//openid method handler
	app.all('/', function(req, res, next) {
		var acceptedMethods = {
			associate: true,
			checkid_setup: true,
			checkid_immediate: true,
			check_authentication: true
		};
		var options = req.body || req.query;
		if(!options['openid.mode']) {
			res.header('Content-Type', 'application/xrds+xml;charset=utf-8');
			res.send(oidp.XRDSDocument());
			res.end();
		}
		else if(options['openid.mode'].toLowerCase() in acceptedMethods) {
			var r = oidp[options['openid.mode'].toLowerCase()](options, next);
			if(r) {
				res.send(r);
				res.end();
			}
		}
		else {
			res.statusCode = 400;
			res.end("OpenIDModeNotFoundException: "+options['openid.mode']);
			//throw new OpenIDModeNotFoundException(options['openid.mode']);
		}
	});

	return app;
}