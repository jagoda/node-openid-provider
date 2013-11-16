var assert = require('assert');
var MemoryAssociationManager = require('../lib/associationManagers/MemoryAssociationManager.js');

suite("AssociationManager Tests", function() {
	suite("MemoryAssociationManager", function() {
		var assoc_manager;

		setup(function() {
			assoc_manager = new MemoryAssociationManager();
		});

		test("Create an empty association", function() {
			var assoc = assoc_manager.create();
			assert.ok('handle' in assoc, "Association is missing `handle` property");
			assert.ok(!('hash' in assoc), "New association shouldn't have a `hash` property");
			assert.ok(!('secret' in assoc), "New association shouldn't have a `secret` property");
		});

		test("Create a new sha1 association", function(){
			var assoc = assoc_manager.createWithHash('sha1');
			assert.ok('handle' in assoc, "Association is missing `handle` property");
			
			assert.ok('hash' in assoc, "New association shouldn't have a `hash` property");
			assert.equal(assoc.hash, 'sha1', "Incorrect hash type");
			
			assert.ok('secret' in assoc, "New association shouldn't have a `secret` property");
			var secretBuf = new Buffer(assoc.secret, 'base64')
			assert.equal(secretBuf.length, 20, "Incorrect hash length");
		});

		test('Create a new sha256 association', function(){
			var assoc = assoc_manager.createWithHash('sha256');
			assert.ok('handle' in assoc, "Association is missing `handle` property");
			
			assert.ok('hash' in assoc, "New association shouldn't have a `hash` property");
			assert.equal(assoc.hash, 'sha256', "Incorrect hash type");
			
			assert.ok('secret' in assoc, "New association shouldn't have a `secret` property");
			var secretBuf = new Buffer(assoc.secret, 'base64')
			assert.equal(secretBuf.length, 32, "Incorrect hash length");
		});

		test('Retrieve an existing association', function() {
			var assoc = assoc_manager.create();
			var found = assoc_manager.find(assoc.handle);
			assert.equal(found, assoc, "The correct association was not found");
		});

		teardown(function() {
			delete assoc_manager;
		});
	});
});
