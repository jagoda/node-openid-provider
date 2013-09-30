module.exports = function(OPENID_OP_ENDPOINT, options) {
	var oidp = new OpenIDProvider(OPENID_OP_ENDPOINT, options);
	var does_user_exist_callback = options['user_exists_callback'];
	var authurl
	return function(req, res, next) {
		parts = [];
		for(var part in req.url.split('/')) {
			if(part.length) {
				parts.push(part);
			}
		}

		if(req.url == "/") {
			res.header('Content-Type', 'application/xrds+xml;charset=utf-8');
			res.send(oidp.XRDSDocument());
			res.end();
		}
		else if(req.url.slice(0,4) == "/id/" && req.url.length > 4) {
			res.header('Content-Type', 'application/xrds+xml;charset=utf-8');
			res.send(oidp.XRDSDocument(req.url.slice(4)));
			res.end();
		}
		else if(req.url == "/login") {
			res.send(oidp.handleRequest(req.body || req.query));
			res.end();
		}
		else {
			res.statusCode = 404;
			res.send("Not Found");
			res.end();
		}
	}
}

/* EXAMPLE EXPRESS/CONNECT MIDDLEWARE
module.exports = function cookieParser(secret){
  return function cookieParser(req, res, next) {
    if (req.cookies) return next();
    var cookies = req.headers.cookie;

    req.secret = secret;
    req.cookies = {};
    req.signedCookies = {};

    if (cookies) {
      try {
        req.cookies = cookie.parse(cookies);
        if (secret) {
          req.signedCookies = utils.parseSignedCookies(req.cookies, secret);
          req.signedCookies = utils.parseJSONCookies(req.signedCookies);
        }
        req.cookies = utils.parseJSONCookies(req.cookies);
      } catch (err) {
        err.status = 400;
        return next(err);
      }
    }
    next();
  };
};
*/
