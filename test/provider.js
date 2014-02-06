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
		
		test("Parse options from GET request", function(done) {
			var options = {
				"openid.ns": "http://specs.openid.net/auth/2.0",
				"openid.mode": "checkid_setup"
			};
			var request = new Request("GET", options);
			var response = new Response();
			
			function callback() {
				var expectedOptions = {
					ns: "http://specs.openid.net/auth/2.0",
					mode: "checkid_setup"
				};
				
				assert.ok(request.oidp, "Request should have `oidp` options.");
				assert.deepEqual(request.oidp, expectedOptions);
				assert.equal(response.data, undefined, "Response should not have data.");
				assert.equal(response.ended, false, "Response should not have ended.");
				done();
			}
			
			assert.ok(request.query, "Request should have a query hash.");
			assert.equal(request.body, undefined, "Request should not have a body.");
			middleware(request, response, callback);
		});
		
		test("Parse options from POST request", function(done) {
			var options = {
				"openid.ns": "http://specs.openid.net/auth/2.0",
				"openid.mode": "checkid_setup"
			};
			var request = new Request("POST", options);
			var response = new Response();
			
			function callback() {
				var expectedOptions = {
					ns: "http://specs.openid.net/auth/2.0",
					mode: "checkid_setup"
				};
				
				assert.ok(request.oidp, "Request should have `oidp` options.");
				assert.deepEqual(request.oidp, expectedOptions);
				assert.equal(response.data, undefined, "Response should not have data.");
				assert.equal(response.ended, false, "Response should not have ended.");
				done();
			}
			
			assert.ok(request.body, "Request should have a body.");
			assert.equal(request.query, undefined, "Request should not have a query hash.");
			middleware(request, response, callback);
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

suite("Extended Providers", function() {
	suite("Attribute Exchange", function() {
		var OPENID_ENDPOINT = "http://localhost/login";
		var middleware, provider;
		
		setup(function() {
			var extension = new OpenIDProvider.AttributeExchange();
			provider = new OpenIDProvider(OPENID_ENDPOINT);
			middleware = provider.middleware();
			provider.extend(extension);
			
			extension.getAttribute = function (schema, localId) {
				var attribute = null;
				
				if (schema === "http://example.com/schema/thing") {
					attribute = localId + "'s thing";
				}
				
				return attribute;
			};
		});
		
		test("Return available attributes", function(done) {
			var options = {
				"openid.ns": "http://specs.openid.net/auth/2.0",
				"openid.mode": "checkid_setup",
				"openid.ns.ax": "http://openid.net/srv/ax/1.0",
				"openid.ax.mode": "fetch_request",
				"openid.ax.type.thing": "http://example.com/schema/thing",
				"openid.ax.type.other": "http://example.com/schema/other",
				"openid.ax.required": "thing,other"
			};
			var request = new Request("POST", options);
			var response = new Response();
			
			function callback() {
				var returnUrl = provider.checkid_setup_complete(request.oidp, "foo");
				var query = url.parse(returnUrl, true).query;
				
				assert.equal(query["openid.ns.ax"], "http://openid.net/srv/ax/1.0");
				assert.equal(query["openid.ax.mode"], "fetch_response");
				assert.equal(query["openid.ax.type.thing"], "http://example.com/schema/thing");
				assert.equal(query["openid.ax.value.thing"], "foo's thing");
				assert.ok(!query["openid.ax.type.other"]);
				done();
			}
			
			middleware(request, response, callback);
		});
	});
});
