var assert = require('assert');
var Response = require('../lib/Response.js');
var url = require('url');

suite("Response Tests", function() {

	test("Create a response without setting any fields", function() {
		var res = new Response();
		
		assert.doesNotThrow(function() {
			Object.keys(res._fields);
		}, "Response has not correctly prepared to store fields");
		assert.equal(Object.keys(res._fields).length, 0);
	});

	test("Create a response object with default fields", function() {
        var incoming = {
			field_one: "Apple",
			field_two: "Banana",
			field_three: "Carrot"
		};
		var res = new Response(incoming);
		
		assert.doesNotThrow(function() {
			Object.keys(res._fields);
		});
		assert.equal(Object.keys(res._fields).length, 3);

		assert.ok('field_one' in res._fields);
		assert.equal(res._fields['field_one'], "Apple");

		assert.ok('field_two' in res._fields);
		assert.equal(res._fields['field_two'], "Banana");

		assert.ok('field_three' in res._fields);
		assert.equal(res._fields['field_three'], "Carrot");
	});

	test("Get all fields from response object", function() {
        var incoming = {
			field_one: "Apple",
			field_two: "Banana",
			field_three: "Carrot"
		};
		var res = new Response(incoming);

        assert.deepEqual(res.fields(), res._fields);
        assert.deepEqual(res.fields(), incoming);
	});

	test("Get the value of a field", function() {
        var incoming = {
			field_one: "Apple",
			field_two: "Banana",
			field_three: "Carrot"
		};
		var res = new Response(incoming);
        
		assert.equal(res.get('field_one'), "Apple");
		assert.equal(res.get('field_two'), "Banana");
		assert.equal(res.get('field_three'), "Carrot");
		assert.equal(res.get('nonexistent_field'), null);
	});

	test("Set the value of a field", function() {
        var incoming = {
			field_one: "Apple",
			field_two: "Banana",
			field_three: "Carrot"
		};
		var res = new Response(incoming);
        
		res.set('field_one', 'Apricot');
		assert.equal(res.get('field_one'), "Apricot");
        
		res.set('new_field', 'Date');
		assert.equal(res.get('new_field'), "Date");
	});

	test("Remove a field", function() {
		var res = new Response({
			field_one: "Apple",
			field_two: "Banana",
			field_three: "Carrot"
		});
		res.unset('field_one');
		assert.equal(res.get('field_one'), null);
	});

	test("Sign a response using SHA1", function() {
		var HASH = 'sha1';
		var SECRET = new Buffer('uXCmv0btOtutg06LBlZ7+NU4IpU=', 'base64');
		var SIGNED = 'field_one,field_two,field_three';
		var SIG = 'JR+u4a7LREkUwGMkRUUaiOLxgMc=';

        var incoming = {
			field_one: "Apple",
			field_two: "Banana",
			field_three: "Carrot"
		};
		var res = new Response(incoming);
		res.sign(HASH, SECRET);

		assert.equal(res.get('signed'), SIGNED, "Missing fields in signature");
		assert.equal(res.get('sig'), SIG, "Incorrect signature");
	})

	test("Sign a response using SHA256", function() {
		var HASH = 'sha256';
		var SECRET = new Buffer('WXIlq6ECPk590dkZhoYq2j1Cq+OmO9mSZZwDZyXUK7Y=', 'base64');
		var SIGNED = 'field_one,field_two,field_three';
		var SIG = '895F6ten0pMkFv9m2qj15Rs1LgwAZg/nUdlMY4LW5F8=';

        var incoming = {
			field_one: "Apple",
			field_two: "Banana",
			field_three: "Carrot"
		};
		var res = new Response(incoming);
		res.sign(HASH, SECRET);

		assert.equal(res.get('signed'), SIGNED, "Missing fields in signature");
		assert.equal(res.get('sig'), SIG, "Incorrect signature");
	});

	test("Sign a response contains utf8 characters using SHA256", function() {
		var HASH = 'sha256';
		var SECRET = new Buffer('WXIlq6ECPk590dkZhoYq2j1Cq+OmO9mSZZwDZyXUK7Y=', 'base64');
		var SIGNED = 'field_one,field_two,field_three';
		var SIG = 'KTUObeIaY2XHWwnhsFcgPSgZKy5mlIQkpZ9oBG7Mj9k=';

        var incoming = {
			field_one: "苹果",
			field_two: "香蕉",
			field_three: "萝卜"
		};
		var res = new Response(incoming);
		res.sign(HASH, SECRET);

		assert.equal(res.get('signed'), SIGNED, "Missing fields in signature");
		assert.equal(res.get('sig'), SIG, "Incorrect signature");
	});

	test("Convert response to a Key-Value Form", function() {
		var FORM = 'field_one:Apple\n' 
				 + 'field_two:Banana\n'
				 + 'field_three:Carrot\n';
        var incoming = {
			field_one: "Apple",
			field_two: "Banana",
			field_three: "Carrot"
		};
		var res = new Response(incoming);
        
		assert.equal(res.toForm(), FORM);
	});

    test("Import response from Key-Value Form", function() {
        var FORM = 'field_one:Apple\n' 
                 + 'field_two:Banana\n'
                 + 'field_three:Carrot\n';
        var res = Response.fromForm(FORM);
        
        assert.deepEqual(res.fields(), {
            field_one: "Apple",
            field_two: "Banana",
            field_three: "Carrot"
        });
    });
    
	test("Convert response to a URL", function() {
		var RETURN_TO_URL = "http://example.com/?herp=123";
        
        var res = new Response({
            one: "first",
            two: "second"
        });
        res.set('return_to', RETURN_TO_URL);
        var purl = url.parse(res.toURL(), true);
        
    	assert.equal(purl.protocol, 'http:');
		assert.equal(purl.hostname, 'example.com');
		assert.equal(purl.pathname, '/');
        assert.deepEqual(purl.query, {
            "openid.one": "first",
            "openid.two": "second",
            "openid.return_to": RETURN_TO_URL,
            "herp": "123"
        });
	});

    test("Import from response from URL", function() {
        var IN_URL = "http://example.com/?herp=123&openid.one=first&openid.two=second&openid.return_to=http%3A%2F%2Fexample.com%2F%3Fherp%3D123";
        var res = Response.fromURL(IN_URL);
        
        assert.deepEqual(res.fields(), {
            one: "first",
            two: "second",
            return_to: "http://example.com/?herp=123"
        });
    });
    
});