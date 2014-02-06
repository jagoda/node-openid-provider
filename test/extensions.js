var assert = require("assert");
var extensions = require("../lib/Extensions.js");
var Response = require("../lib/Response.js");

suite("Provider Extensions", function() {
	suite("Attribute Exchange", function() {
		var AX_NAMESPACE = "http://openid.net/srv/ax/1.0";
		var OTHER_SCHEMA = "http://example.com/schema/other";
		var THING_SCHEMA = "http://example.com/schema/thing";
		var THING_SUFFIX = "'s thing";
		
		var extension;
		
		setup(function() {
			extension = new extensions.AttributeExchange();
			
			extension.getAttribute = function (schema, localId) {
				var attribute = null;
				
				if (schema === THING_SCHEMA) {
					attribute = localId + THING_SUFFIX;
				}
				
				return attribute;
			};
		});
		
		test("Respond to fetch request", function() {
			var expectedFields = {
				"ns.ax" : AX_NAMESPACE,
				"ax.mode" : "fetch_response"
			};
			var request = {
				"ns.ax" : AX_NAMESPACE,
				"ax.mode" : "fetch_request"
			};
			var response = new Response();
			
			extension.handle(null, request, response);
			assert.deepEqual(response.fields(), expectedFields);
		});
		
		test("Ignore irrelevant request", function() {
			var expectedFields = {};
			var request = {
				"ns.ax" : "http://example.com/foo",
				"ax.mode" : "fetch_request"
			};
			var response = new Response();
			
			extension.handle(null, request, response);
			assert.deepEqual(response.fields(), expectedFields);
		});
		
		test("Lookup attributes", function() {
			var localId = "foo";
			var expectedFields = {
				"ns.ax" : AX_NAMESPACE,
				"ax.mode" : "fetch_response",
				"ax.type.thing" : THING_SCHEMA,
				"ax.value.thing" : localId + THING_SUFFIX
			};
			var request = {
				"ns.ax" : AX_NAMESPACE,
				"ax.mode" : "fetch_request",
				"ax.type.other" : OTHER_SCHEMA,
				"ax.type.thing" : THING_SCHEMA,
				"ax.required" : "other,thing"
			};
			var response = new Response();
			
			extension.handle(localId, request, response);
			assert.deepEqual(response.fields(), expectedFields);
		});
		
		test("Custom extension alias", function() {
			var localId = "foo";
			var expectedFields = {
				"ns.foo" : AX_NAMESPACE,
				"foo.mode" : "fetch_response",
				"foo.type.thing" : THING_SCHEMA,
				"foo.value.thing" : localId + THING_SUFFIX
			};
			var request = {
				"ns.foo" : AX_NAMESPACE,
				"foo.mode" : "fetch_request",
				"foo.type.other" : OTHER_SCHEMA,
				"foo.type.thing" : THING_SCHEMA,
				"foo.required" : "other,thing"
			};
			var response = new Response();
			
			extension.handle(localId, request, response);
			assert.deepEqual(response.fields(), expectedFields);
		});
	});
});
