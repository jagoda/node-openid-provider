var crypto = require('crypto');
var url = require('url');

//constants
var DH_MODULUS_HEX = "DCF93A0B883972EC0E19989AC5A2CE310E1D37717E8D9571BB7623731866E61EF75A2E27898B057F9891C2E27A639C3F29B60814581CD3B2CA3986D2683705577D45C2E7E52DC81C7A171876E5CEA74B1448BFDFAF18828EFD2519F14E45E3826634AF1949E5B535CC829A483B8A76223E5D490A257F05BDFF16F2FB22C583AB";
// var DH_MODULUS = parseInt(DH_MODULUS_HEX, 16);
// var DH_GENERATOR = 2;
var OPENID_NS = "http://specs.openid.net/auth/2.0";
var OPENID_OP_ENDPOINT = "http://localhost:3000/login";

//globals
var servers = {};

function btwoc(i) {
	if(i[0] < 127) {
		return Buffer.concat([new Buffer(1), i]);
	}
	else {
		return i;
	}
}

function xor(b1, b2) {
	var out = [];
	if(b1.length == b2.length) {
		console.error("CHRIS REID YOUR A FUCKING IDIOT");
		throw 1;
	}
	for(var i=0; i<b1.length; i++) {
		out[i] = b1[i] ^ b2[i];
	}
	return new Buffer(out);
}

function associate(options) {
	// var modulus = options['openid.dh_modulus'] || DH_MODULUS;
	// var generator = options['openid.dh_gen'] || DH_GENERATOR;

	var assoc_handle = new Buffer(crypto.randomBytes(32)).toString('base64');
	var dh;
	if(options['openid.dh_modulus']) {
		dh = crypto.createDiffieHellman(options['openid.dh_modulus'], 'base64');
	}
	else {
		dh = crypto.createDiffieHellman(DH_MODULUS_HEX, 'hex');
	}
	var s = {
		server: dh,
		server_public: dh.generateKeys('base64'),
		consumer_public: options['openid.dh_consumer_public'],
		shared_secret: dh.computeSecret(options['openid.dh_consumer_public'], 'base64', 'base64')
	}
	servers[assoc_handle] = s;

	var response = {}
	response['ns'] = OPENID_NS;
	response['assoc_handle'] = assoc_handle;
	response['session_type'] = options['openid.session_type'];
	response['assoc_type'] = options['openid.assoc_type'];
	response['expires_in'] = 1209600; //in seconds
	response['dh_server_public'] = s.server_public;
	//create the encoded mac
	//@needs to be generated correctly
	var mac_key = crypto.randomBytes(20); //20 bytes so it is the same length as an sha1
	var shasum = crypto.createHash('sha1');
	var buf = btwoc(new Buffer(s.shared_secret, 'base64'));
	var bufx = xor(buf, mac_key);
	shasum.update(bufx);
	response['enc_mac_key'] = shasum.digest('base64');

	//build response
	var output = "";
	for(var key in response) {
		output += key+":"+response[key]+"\n";
	}
	return output;
}

function checkid_setup(options) {
	var IDENTITY = "http://localhost:3000/id/chris";
	var response = {
		"openid.ns": OPENID_NS,
		"openid.mode": "id_res",
		"openid.op_endpoint": OPENID_OP_ENDPOINT,
		"openid.claimed_id": IDENTITY,
		"openid.identity": IDENTITY,
		"openid.return_to": options['openid.return_to'],
		"openid.response_nonce": new Date().toISOString()+"UNIQUE", //actually make unique
		"openid.assoc_handle": options['openid.assoc_handle']
	}

	//sign the response
	var openid_signed = "";
	var kvstr = "";
	for(var key in response) {
		openid_signed += key.slice(7)+","; //remove "openid." from the start of the key
		kvstr += key+":"+response[key]+"\n";
	}
	response['openid.signed'] = openid_signed;
	//@needs to be generated correctly
	response['openid.sig'] = crypto.createHmac('sha1', new Buffer(servers[options['openid.assoc_handle']].shared_secret), 'base64')
								.update(kvstr)
								.digest('base64');

	//convert response to url
	var return_to = url.parse(
		unescape(options['openid.return_to']),
		true
	);
	for(var key in response) {
		return_to.query[key] = response[key];
	}
	delete return_to['search'];
	return_to = url.format(return_to);
	return '<a href="'+return_to+'">Log into the server</a>';
}

function checkid_immediate(options) {
	console.log(options);
}

function check_authentication(options) {
	console.log(options);
}

function id_res(options) {
	console.log(options);
}

var modes = {
	"associate": associate,
	"checkid_setup": checkid_setup,
	"checkid_immediate": checkid_immediate,
	"id_res": id_res,
	"check_authentication": check_authentication
}

function openid(req, res) {
	var options = {}
	if(req.method == "POST") {
		options = req.body;
	}
	else {
		options = req.query;
	}
	return modes[options['openid.mode']](options);
}

module.exports.openid = openid;
module.exports.modes = modes;