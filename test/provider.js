var assert = require("assert");
var OpenIDProvider = require("../lib/Provider.js");
var url = require("url");

function Request(method, options) {
	this.method = method.toUpperCase();
	
	if (method === "POST") {
		this.body = options;
	}
	else {
		this.query = options;
	}
}

function Response() {
	this.data = undefined;
	this.ended = false;
}

Response.prototype.end = function() {
	this.ended = true;
};

Response.prototype.send = function(data) {
	this.data = data;
};

suite("Provider Tests", function() {
	var OPENID_ENDPOINT = "http://localhost/login";
	var provider;
	
	setup(function() {
		provider = new OpenIDProvider(OPENID_ENDPOINT);
	});
	
	suite("middleware", function() {
		var middleware;
		
		setup(function() {
			middleware = provider.middleware();
		});
		
		test("Parse options from GET request", function() {
			var handled = false;
			var options = {
				"openid.ns": "http://specs.openid.net/auth/2.0",
				"openid.mode": "checkid_setup"
			};
			var request = new Request("GET", options);
			var response = new Response();
			
			function done() {
				var expectedOptions = {
					ns: "http://specs.openid.net/auth/2.0",
					mode: "checkid_setup"
				};
				
				assert.ok(request.oidp, "Request should have `oidp` options.");
				assert.deepEqual(request.oidp, expectedOptions);
				assert.equal(response.data, undefined, "Response should not have data.");
				assert.equal(response.ended, false, "Response should not have ended.");
				handled = true;
			}
			
			assert.ok(request.query, "Request should have a query hash.");
			assert.equal(request.body, undefined, "Request should not have a body.");
			middleware(request, response, done);
			assert.ok(handled, "Middleware failed to handle request.");
		});
		
		test("Parse options from POST request", function() {
			var handled = false;
			var options = {
				"openid.ns": "http://specs.openid.net/auth/2.0",
				"openid.mode": "checkid_setup"
			};
			var request = new Request("POST", options);
			var response = new Response();
			
			function done() {
				var expectedOptions = {
					ns: "http://specs.openid.net/auth/2.0",
					mode: "checkid_setup"
				};
				
				assert.ok(request.oidp, "Request should have `oidp` options.");
				assert.deepEqual(request.oidp, expectedOptions);
				assert.equal(response.data, undefined, "Response should not have data.");
				assert.equal(response.ended, false, "Response should not have ended.");
				handled = true;
			}
			
			assert.ok(request.body, "Request should have a body.");
			assert.equal(request.query, undefined, "Request should not have a query hash.");
			middleware(request, response, done);
			assert.ok(handled, "Middleware failed to handle request.");
		});
	});
	
	test("Generate error response", function() {
		var options = { return_to: "http://example.com/foo" };
		var parsedUrl = url.parse(provider.error(options, "An error."), true);
		
		assert.equal(parsedUrl.query["openid.mode"], "error", "Incorrect mode.");
		assert.equal(parsedUrl.query["openid.ns"], "http://specs.openid.net/auth/2.0", "Incorrect namespace.");
		assert.equal(parsedUrl.query["openid.error"], "An error.", "Incorrect message.");
		assert.equal(parsedUrl.hostname, "example.com", "Incorrect hostname.");
		assert.equal(parsedUrl.pathname, "/foo", "Incorrect path.");
	});
});
