var assert = require('assert');
var Response = require('../lib/Response.js');
var url = require('url');

suite("Response Tests", function() {
	var TEST_OBJECT;

	setup(function() {
		TEST_OBJECT = {
			field_one: "Apple",
			field_two: "Banana",
			field_three: "Carrot"
		};
	});

	test("Create a response without setting any fields", function() {
		var res = new Response();
		
		assert.doesNotThrow(function() {
			Object.keys(res._fields);
		}, "Response has not correctly prepared to store fields");
		assert.equal(Object.keys(res._fields).length, 0, "The fields object is not empty");
	});

	test("Create a response object with default fields", function() {
		var res = new Response(TEST_OBJECT);
		
		assert.doesNotThrow(function() {
			Object.keys(res._fields);
		}, "Response has not correctly prepared to store fields");
		assert.equal(Object.keys(res._fields).length, 3, "An incorrect number of fields has been stored");

		assert.ok('field_one' in res._fields, "First field was not stored");
		assert.equal(res._fields['field_one'], "Apple", "Data for first field is incorrect");

		assert.ok('field_two' in res._fields, "Middle field was not stored");
		assert.equal(res._fields['field_two'], "Banana", "Data for middle field is incorrect");

		assert.ok('field_three' in res._fields, "Last field was not stored");
		assert.equal(res._fields['field_three'], "Carrot", "Data for last field is incorrect");
	});

	test("Get all fields from response object", function() {
		var res = new Response(TEST_OBJECT);

		assert.equal(res.fields(), res._fields, "The fields returned from the object does not match the internel fields object");
		assert.equal(res.fields(), TEST_OBJECT, "The stored fields does not match the fields passed in");
	});

	test("Get the value of a field", function() {
		var res = new Response(TEST_OBJECT);
		assert.equal(res.get('field_one'), "Apple", "Did not correctly retrieve the first field");
		assert.equal(res.get('field_two'), "Banana", "Did not correctly retrieve the middle field");
		assert.equal(res.get('field_three'), "Carrot", "Did not correctly retrieve the third field");
		assert.equal(res.get('nonexistent_field'), null, "Null value not returned when getting an item that doesn't exist");
	});

	test("Set the value of a field", function() {
		var res = new Response(TEST_OBJECT);
		res.set('field_one', 'Apricot');
		assert.equal(res.get('field_one'), "Apricot", "Existing field was not set correctly");
		res.set('new_field', 'Date');
		assert.equal(res.get('new_field'), "Date", "New field was not set correctly");
	});

	test("Remove a field", function() {
		var res = new Response(TEST_OBJECT);
		res.unset('field_one');
		assert.equal(res.get('field_one'), null, "Field was not removed");
	});

	test("Sign a response using SHA1", function() {
		var HASH = 'sha1';
		var SECRET = new Buffer('uXCmv0btOtutg06LBlZ7+NU4IpU=', 'base64');
		var SIGNED = 'field_one,field_two,field_three';
		var SIG = 'JR+u4a7LREkUwGMkRUUaiOLxgMc=';

		var res = new Response(TEST_OBJECT);
		res.sign(HASH, SECRET);

		assert.equal(res.get('signed'), SIGNED, "Missing fields in signature");
		assert.equal(res.get('sig'), SIG, "Incorrect signature");
	})

	test("Sign a response using SHA256", function() {
		var HASH = 'sha256';
		var SECRET = new Buffer('WXIlq6ECPk590dkZhoYq2j1Cq+OmO9mSZZwDZyXUK7Y=', 'base64');
		var SIGNED = 'field_one,field_two,field_three';
		var SIG = '895F6ten0pMkFv9m2qj15Rs1LgwAZg/nUdlMY4LW5F8=';

		var res = new Response(TEST_OBJECT);
		res.sign(HASH, SECRET);

		assert.equal(res.get('signed'), SIGNED, "Missing fields in signature");
		assert.equal(res.get('sig'), SIG, "Incorrect signature");
	});

	test("Convert response to a Key-Value Form", function() {
		var FORM = 'field_one:Apple\n' 
				 + 'field_two:Banana\n'
				 + 'field_three:Carrot\n';
		var res = new Response(TEST_OBJECT);
		assert.equal(res.toForm(), FORM, "Form encoded incorrectly");
	});

	test("Convert response to a URL", function() {
		var RETURN_TO_URL = "http://example.com/?herp=123";
		var QUERY_OBJECT = TEST_OBJECT
			QUERY_OBJECT.herp = '123'

		var res = new Response(TEST_OBJECT);
		res.set('return_to', RETURN_TO_URL);
		var purl = url.parse(res.toURL(), true);
		
		assert.equal(purl.protocol, 'http:', "Protocol doesn't match");
		assert.equal(purl.hostname, 'example.com', "Hostname doesn't match");
		assert.equal(purl.pathname, '/', "Pathname doesn't match");
		assert.equal(purl.query, QUERY_OBJECT, "Query string doesn't match");
	});

	teardown(function() {
		delete TEST_OBJECT;
	});
});