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
	app.get('/:name', function(req, res) {
		//res.header('Content-Type', 'application/xrds+xml;charset=utf-8');
		//var r = oidp.XRDSDocument(req.params.name);
		res.header('Content-Type', 'text/html');
		var r   = '<!doctype html>\n'
				+ '<html>\n'
				+ '	<head>\n'
				+ '		<link rel="openid2.provider" href="http://localhost:3000/openid/">\n'
				+ '		<link rel="openid2.local_id" href="http://localhost:3000/openid/'+req.params.name+'">\n'
				+ '	</head>\n'
				+ '	<body>\n'
				+ '		<h1>'+req.params.name+'\'s Page</h1>\n'
				+ '	</body>\n'
				+ '</html>\n';
		res.send(r);
		res.end();
	});

	//server handler
	app.get('/', function (req, res, next) {
		// res.header('Content-Type', 'application/xrds+xml;charset=utf-8');
		// res.send(oidp.XRDSDocument());
		res.header('Content-Type', 'text/html');
		var r   = '<!doctype html>\n'
				+ '<html>\n'
				+ '	<head>\n'
				+ '		<link rel="openid2.provider" href="http://localhost:3000/openid/">\n'
				+ '	</head>\n'
				+ '	<body>\n'
				+ '		<h1>Home Page</h1>\n'
				+ '	</body>\n'
				+ '</html>\n';
		res.send(r);
		res.end();
	});

	//openid method handler
	app.post('/', function(req, res, next) {
		var acceptedMethods = {
			associate: true,
			checkid_setup: true,
			checkid_immediate: true,
			check_authentication: true
		};
		var options = req.body;
		if(options['openid.mode'].toLowerCase() in acceptedMethods) {
			var r = oidp[options['openid.mode'].toLowerCase()](options, next);
			res.send(r);
			res.end();
		}
		else {
			//throw new OpenIDModeNotFoundException(options['openid.mode']);
			next();
		}
	});

	return app;
}