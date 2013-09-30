var crypto = require('crypto');
var url = require('url');

//constants
var DH_MODULUS_HEX = "DCF93A0B883972EC0E19989AC5A2CE310E1D37717E8D9571BB7623731866E61EF75A2E27898B057F9891C2E27A639C3F29B60814581CD3B2CA3986D2683705577D45C2E7E52DC81C7A171876E5CEA74B1448BFDFAF18828EFD2519F14E45E3826634AF1949E5B535CC829A483B8A76223E5D490A257F05BDFF16F2FB22C583AB";
var DH_MODULUS_B64 = new Buffer(DH_MODULUS_HEX, 'hex').toString('base64');
var OPENID_NS = "http://specs.openid.net/auth/2.0";
var OPENID_SERVICE_TYPE = "http://specs.openid.net/auth/2.0/signon";


/**
 * Utility functions
 */
//@TODO: I have reason to believe this function doesn't work correctly
//@DEPRECIATED: only ever used in associate, migrate into the associate code
function btwoc(i) {
	console.warn("btwoc is deprecated");
	if(i[0] > 127) {
		return Buffer.concat([new Buffer([0]), i]);
	}
	else {
		return i;
	}
}

//@DEPRECIATED: only ever used in associate, migrate into the associate code
function xor(bb, ab)
{
	//@TODO: convert this function to use native buffers instead of converting between buffers and binary strings
	console.warn("xor is deprecated");
	var a = ab.toString('binary');
	var b = bb.toString('binary');
	if(a.length != b.length)
	{
		throw new Error('Length must match for xor');
	}

	var r = '';
	for(var i = 0; i < a.length; ++i)
	{
		r += String.fromCharCode(a.charCodeAt(i) ^ b.charCodeAt(i));
	}

	return new Buffer(r, 'binary');
}

//@DEPRECATED
function keyValueFormEncode(obj) {
	console.warn("keyValueFormEncode is deprecated");
	var output = "";
	for(var key in obj) {
		output += key+":"+obj[key]+"\n";
	}
	return output;
}

//@DEPRECATED
function prependOpenIDNamespace(obj) {
	console.warn("prependOpenIDNamespace is deprecated");
	var NAMESPACE = "openid.";
	var out = {};
	for(var key in obj) {
		out[NAMESPACE+key] = obj[key];
	}
	return out;
}


/**
 * Errors
 */
function OpenIDModeNotFoundException(mode) {
	this.name = "MODE_NOT_FOUND";
	this.message = "Invalid mode provided.";
	console.error(this.message, mode);
}
function OpenIDAssocHandleNotFoundException(assoc_handle) {
	this.name = "ASSOC_HANDLE_NOT_FOUND";
	this.message = "Provided assoc_handle does not exist.";
	console.error(this.message, assoc_handle);
}
function OpenIDResponseNoReturnUrlException() {
	this.name = "RETURN_URL_NOT_PROVIDED";
	this.message = "No return_url provided. Cannot create url from response."
	console.error(this.message);
}


/**
 * An interface for creating and retrieving openid associations
 */
function OpenIDAssociationService() {
	//@TODO: this is a memory database, should probably be an actual database.
	//@TODO: require an OpenIDAssociationServiceStorage object to be passed in.
	//       This object would be responsible for storing and retrieving the assocs.
	//@TODO: move to an async system. Probably requires a large number of changes around the whole codebase.
	this._assocs = [];
}

OpenIDAssociationService.prototype.create = function() {
	//@TODO: make a better algorithm
	var assoc_handle = crypto.randomBytes(64).toString('base64');
	while(this.find(assoc_handle)) {
		assoc_handle = crypto.randomBytes(64).toString('base64');
	}
	var assoc = {
		handle: assoc_handle
	}
	this._assocs[assoc_handle] = assoc;
	return assoc;
}

OpenIDAssociationService.prototype.createWithHash = function(hashAlgorithm) {
	if(hashAlgorithm != 'sha1' || hashAlgorithm != 'sha256') {
		hashAlgorithm = 'sha256';
	}
	var assoc = this.create();
	assoc.hash = hashAlgorithm;
	assoc.secret = crypto.randomBytes(hashAlgorithm == 'sha1' ? 20 : 32).toString('base64');
	return assoc;
}

OpenIDAssociationService.prototype.find = function(assoc_handle) {
	if(assoc_handle in this._assocs) {
		return this._assocs[assoc_handle];
	}
	else {
		return null;
	}
}


/**
 * Response builder
 */
function Response(fields) {
	this._fields = fields;
}

Response.prototype.fields = function() {
	return this._fields;
}

Response.prototype.get = function(field) {
	return this._fields[field] || null;
}

Response.prototype.set = function(field, value) {
	this._fields[field] = value;
	return this;
}

Response.prototype.unset = function(field) {
	delete this._fields[field];
	return this;
}

Response.prototype.sign = function(hashAlgorithm, secretBuffer) {
	//get the form elements to be signed
	var signed = "";
	for(var key in this.fields()) {
		signed += key+",";
	}
	signed = signed.slice(0,-1);

	//sign the form
	var form = this.toForm();
	var hmac = crypto.createHmac(hashAlgorithm, secretBuffer.toString('binary'));
	hmac.update(form);

	//add the new fields
	this.set('signed', signed);
	this.set('sig', hmac.digest('base64'));

	return this;
}

Response.prototype.toForm = function() {
	var output = "";
	for(var key in this.fields()) {
		output += key+":"+this._fields[key]+"\n";
	}
	return output;
}

Response.prototype.toURL = function() {
	if(!this.get('return_to')) {
		throw new OpenIDResponseNoReturnUrlException();
	}
	var parsed_url = url.parse(this.get('return_to'), true);
	var namespaced_fields = this._openidNamespacedFields();
	for (var key in namespaced_fields) {
		parsed_url.query[key] = namespaced_fields[key];
	}
	delete parsed_url['search']; //force url.format to re-encode the querystring
	return url.format(parsed_url);
}

Response.prototype._openidNamespacedFields = function() {
	var NAMESPACE = "openid.";
	var out = {};
	for(var key in this._fields) {
		out[NAMESPACE+key] = this._fields[key];
	}
	return out;
}


/**
 * The openid provider
 */
function OpenIDProvider(OPENID_OP_ENDPOINT) {
	this.OPENID_OP_ENDPOINT = OPENID_OP_ENDPOINT;
	this.associations = new OpenIDAssociationService();
}

OpenIDProvider.prototype.handleRequest = function(options) {
	if(options['openid.mode'].toLowerCase() in this) {
		return this[options['openid.mode'].toLowerCase()](options);
	}
	else {
		throw new OpenIDModeNotFoundException(options['openid.mode']);
	}
}

OpenIDProvider.prototype.associate = function(options) {
	var assoc = this.associations.create();
	var dh = crypto.createDiffieHellman(options['openid.dh_modulus'] || DH_MODULUS_B64, 'base64');
	dh.generateKeys();
	var dh_secret = dh.computeSecret(options['openid.dh_consumer_public'], 'base64');
	//@TODO: support non diffie-hellman associations: no-encryption, hmac-sha1, hmac-sha256
	//@TODO: verify the hash is supported
	var assoc_type_hash = options['openid.assoc_type'].match("SHA[0-9]+$")[0].toLowerCase();
	assoc.hash = assoc_type_hash;
	var shasum = crypto.createHash(assoc_type_hash);
	shasum.update( btwoc(dh_secret) );
	var mac_key = crypto.randomBytes(assoc_type_hash == 'sha1' ? 20 : 32);
	assoc.secret = mac_key.toString('base64');
	var enc_mac_key = xor(shasum.digest(), mac_key);
	//build response
	var response = new Response({
		ns: OPENID_NS,
		assoc_handle: assoc.handle,
		session_type: options['openid.session_type'], //no-encryption|DH-SHA1|DH-SHA256
		assoc_type: options['openid.assoc_type'], //{non-existent}|HMAC-SHA1|HMAC-SHA256
		expires_in: 60, //@TODO: set this somewhere? 1209600 = 14 days
		dh_server_public: dh.getPublicKey('base64'),
		enc_mac_key: enc_mac_key.toString('base64')
	});
	//encode and return
	return response.toForm();
}

OpenIDProvider.prototype.checkid_setup = function(options) {
	//@TODO: correct identity
	//@TODO: response_nonce "UNIQUE" needs to be unique
	var IDENTITY = "http://localhost:3000/id/chris";
	var assoc = this.associations.find(options['openid.assoc_handle']);
	
	var response = new Response({
		ns: OPENID_NS,
		mode: "id_res",
		op_endpoint: this.OPENID_OP_ENDPOINT,
		claimed_id: IDENTITY,
		identity: IDENTITY,
		return_to: unescape(options['openid.return_to']),
		response_nonce: new Date().toISOString().split(".")[0]+"Z"+"UNIQUE", //the openid spec doesn't use correct iso strings?
	});

	if(assoc == null) { //create an association because a valid handle wasn't provided
		assoc = this.associations.createWithHash('sha256');
	}

	response.set('assoc_handle', assoc.handle);
	response.sign(assoc.hash, new Buffer(assoc.secret, 'base64'));

	if(options['openid.assoc_handle']) { //if the consumer provided a handle, tell them it is invalid
		response.set('invalidate_handle', options['openid.assoc_handle']);
	}

	return '<a href="'+response.toURL()+'">Log into the server</a>';
}

OpenIDProvider.prototype.checkid_immediate = function(options) {
	//@TODO: Not Implemented
	console.error("checkid_immediate not yet implemented");
	throw new OpenIDModeNotFoundException(options['openid.mode']);
}

OpenIDProvider.prototype.check_authentication = function(options) {
	//@TODO: Not Implemented
	console.error("check_authentication not yet implemented");
	var response = new Response({
		ns: OPENID_NS,
		is_valid: "true"
	});
	return response.toForm();
}

OpenIDProvider.prototype.XRDSDocument = function(LocalID) {
	var doc = '<?xml version="1.0" encoding="UTF-8"?>\n'
			+ '<xrds:XRDS xmlns:xrds="xri://$xrds" xmlns="xri://$xrd*($v*2.0)">\n'
			+ '	<XRD>\n'
			+ '		<Service priority="0">\n'
			+ '			<Type>' + OPENID_SERVICE_TYPE + '</Type>\n'
			+ '			<URI>' + this.OPENID_OP_ENDPOINT + '</URI>\n';
	
	if(LocalID) {
		doc +='			<LocalID>' + LocalID + '</LocalID>\n';
	}
	
		doc +='		</Service>\n'
			+ '	</XRD>\n'
			+ '</xrds:XRDS>\n'
	return doc;
}

module.exports = OpenIDProvider;