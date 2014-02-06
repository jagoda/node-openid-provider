var crypto = require('crypto');
var url = require('url');

var MemoryAssociationService = require('./associationManagers/MemoryAssociationManager.js');
var Response = require('./Response.js');
//utils
var btwoc = require('./Utils.js').btwoc;
var xor = require('./Utils.js').xor;

//constants
var DH_MODULUS_HEX = "DCF93A0B883972EC0E19989AC5A2CE310E1D37717E8D9571BB7623731866E61EF75A2E27898B057F9891C2E27A639C3F29B60814581CD3B2CA3986D2683705577D45C2E7E52DC81C7A171876E5CEA74B1448BFDFAF18828EFD2519F14E45E3826634AF1949E5B535CC829A483B8A76223E5D490A257F05BDFF16F2FB22C583AB";
var DH_MODULUS_B64 = new Buffer(DH_MODULUS_HEX, 'hex').toString('base64');
var OPENID_NS = "http://specs.openid.net/auth/2.0";
var OPENID_SERVICE_TYPE = "http://specs.openid.net/auth/2.0/signon";

/**
 * The openid provider
 */
function OpenIDProvider(OPENID_ENDPOINT, user_config) {
	this.OPENID_OP_ENDPOINT = OPENID_ENDPOINT;
	this.associations = new MemoryAssociationService();
	this.extensions = [];
	
	this.config = {
		association_expires: 1209600, //1209600 seconds == 14 days
		checkid_params: 'oidp'
	}
	//merge options
	for(var key in user_config || {}) {
		this.config[key] = user_config[key];
	}
}

OpenIDProvider.prototype.extend = function(extension) {
	this.extensions.push(extension);
}

OpenIDProvider.prototype.associate = function(options) {
	var assoc = this.associations.create();
	var dh = crypto.createDiffieHellman(options.dh_modulus || DH_MODULUS_B64, 'base64');
	dh.generateKeys();
	var dh_secret = dh.computeSecret(options.dh_consumer_public, 'base64');
	//@TODO: support non diffie-hellman associations: no-encryption, hmac-sha1, hmac-sha256
	//@TODO: verify the hash is supported
	var assoc_type_hash = options.assoc_type.match("SHA[0-9]+$")[0].toLowerCase();
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
		session_type: options.session_type, //no-encryption|DH-SHA1|DH-SHA256
		assoc_type: options.assoc_type, //{non-existent}|HMAC-SHA1|HMAC-SHA256
		expires_in: this.config.association_expires,
		dh_server_public: dh.getPublicKey('base64'),
		enc_mac_key: enc_mac_key.toString('base64')
	});
	//encode and return
	return response.toForm();
}

/**
 * a request handler at the root url should be specified to override this function and display a login page
 */
OpenIDProvider.prototype.checkid_setup = function(options) {
	return null;
}

/**
 * login page handler, must provide an unique identifier plus openid arguments
 * returns a url
 */
OpenIDProvider.prototype.checkid_setup_complete = function(options, localID) {
	var assoc = this.associations.find(options.assoc_handle);
	var response = new Response({
		ns: OPENID_NS,
		mode: "id_res",
		op_endpoint: this.OPENID_OP_ENDPOINT,
		claimed_id: localID,
		identity: localID,
		return_to: unescape(options.return_to),
		response_nonce: new Date().toISOString().split(".")[0]+"Z"+crypto.randomBytes(4).toString('hex'), //the openid spec doesn't use correct iso strings?
	});

	// Allow all protocol extensions to process the request.
	for(var name in this.extensions) {
		this.extensions[name].handle(localID, options, response);
	}

	if(assoc == null && options.assoc_handle) { //if the consumer provided a handle, tell them it is invalid
		response.set('invalidate_handle', options.assoc_handle);
	}

	if(assoc == null) { //create an association because a valid handle wasn't provided
		assoc = this.associations.createWithHash('sha256');
	}

	response.set('assoc_handle', assoc.handle);
	response.sign(assoc.hash, new Buffer(assoc.secret, 'base64'));

	return response.toURL();
}

OpenIDProvider.prototype.checkid_immediate = function(options) {
	//@TODO: Not Implemented
	console.error("checkid_immediate not yet implemented");
	throw new OpenIDModeNotFoundException(options.mode);
}

OpenIDProvider.prototype.check_authentication = function(options) {
	var validation = new Response({
		ns: OPENID_NS
	});

	var assoc = this.associations.find(options.assoc_handle);
	if(assoc == null) { //fail if they havn't given an assoc_handle
		validation.set('is_valid', 'false');
		return validation.toForm();
	}

	//rebuild the form
	var response = new Response();
	var fields = options.signed.split(',');
	for(var field in fields) {
		response.set(fields[field], options[fields[field]] );
	}
	response.set('mode', 'id_res'); //set the mode to id_res because that is what was originally signed

	response.sign(assoc.hash, new Buffer(assoc.secret, 'base64'));

	//check it's correct and respond
	if(   response.get('sig') == options.sig &&
	   response.get('signed') == options.signed ) {
		validation.set('is_valid', 'true');
	}
	else {
		validation.set('is_valid', 'false');
	}

	return validation.toForm();
}

OpenIDProvider.prototype.error = function (options, message) {
	var response = new Response({
		ns: OPENID_NS,
		mode: "error",
		return_to: unescape(options.return_to),
		error: message
	});
	
	return response.toURL();
}

OpenIDProvider.prototype.XRDSDocument = function(localID) {
	var doc = '<?xml version="1.0" encoding="UTF-8"?>\n'
			+ '<xrds:XRDS xmlns:xrds="xri://$xrds" xmlns="xri://$xrd*($v*2.0)">\n'
			+ '	<XRD>\n'
			+ '		<Service priority="0">\n'
			+ '			<Type>' + OPENID_SERVICE_TYPE + '</Type>\n'
			+ '			<URI>' + this.OPENID_OP_ENDPOINT + '</URI>\n';
	
	if(localID) {
		doc +='			<LocalID>' + localID + '</LocalID>\n';
	}
	
		doc +='		</Service>\n'
			+ '	</XRD>\n'
			+ '</xrds:XRDS>\n'
	return doc;
}

function getOptions(namespace, payload) {
	var options = {};
	for(var opt in payload) {
		if(opt.indexOf(namespace) == 0) {
			var key = opt.substr(namespace.length);
			options[key.toLowerCase()] = payload[opt];
		}
	}
	return options;
}

OpenIDProvider.prototype.middleware = function(options) {
	var oidp = this;

	return function(req, res, next) {
		var NAMESPACE = "openid.";
		var ACCEPTED_METHODS = {
			associate: true,
			checkid_setup: true,
			checkid_immediate: true,
			check_authentication: true
		};
		var options = req.method === "POST" ? getOptions(NAMESPACE, req.body) : getOptions(NAMESPACE, req.query);
		if(options.mode in ACCEPTED_METHODS) {
			req[oidp.config.checkid_params] = options;
			var r = oidp[options.mode](options, req, res, next);
			if(r) {
				res.send(r);
				res.end();
				return;
			}
		}
		next();
	}
}

var extensions = require("./Extensions.js");
for(var name in extensions) {
	OpenIDProvider[name] = extensions[name];
}

module.exports = OpenIDProvider;
