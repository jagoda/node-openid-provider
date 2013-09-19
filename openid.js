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
	if(i[0] > 127) {
		return Buffer.concat([new Buffer([0]), i]);
	}
	else {
		return i;
	}
}

function unbtwoc(i) {
	if(i[0] === 0) {
		//strip first character
	}
	return i;
}

function xor(b, a)
{
  if(a.length != b.length)
  {
    throw new Error('Length must match for xor');
  }

  var r = '';
  for(var i = 0; i < a.length; ++i)
  {
    r += String.fromCharCode(a.charCodeAt(i) ^ b.charCodeAt(i));
  }

  console.log("MACKEY: ", new Buffer(a, 'binary').toString('base64'));
  console.log("ENCMACKEY: ", new Buffer(r, 'binary').toString('base64'));
  return new Buffer(r, 'binary');
}

// function xor(b1, b2) {
// 	var out = [];
// 	if(b1.length != b2.length) {
// 		throw "CHRIS REID YOUR A FUCKING IDIOT";
// 	}
// 	for(var i=0; i<b1.length; i++) {
// 		out[i] = b2[i] ^ b1[i];
// 	}
// 	console.log("MACKEY: ", b2.toString('base64'));
// 	console.log("ENCMACKEY: ", new Buffer(out).toString('base64'));
// 	return new Buffer(out);
// }

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

	console.log("PUBLIC: ", s.server_public);
	console.log("SECRET: ", s.shared_secret);

	var response = {}
	response['ns'] = OPENID_NS;
	response['assoc_handle'] = assoc_handle;
	response['session_type'] = options['openid.session_type'];
	response['assoc_type'] = options['openid.assoc_type'];
	response['expires_in'] = 1209600; //in seconds
	response['dh_server_public'] = s.server_public;
	//create the encoded mac
	//@needs to be generated correctly[]
	var mac_key = crypto.randomBytes(32); //20 bytes so it is the same length as an sha1, 32 sha256
	var shasum = crypto.createHash('sha256');
	var buf = btwoc(new Buffer(s.shared_secret, 'base64'));
	shasum.update(buf);
	var bufx = xor(shasum.digest('binary'), mac_key.toString('binary'));
	response['enc_mac_key'] = bufx.toString('base64');

	//save the mac key
	s.mac_key = mac_key.toString('base64');
	servers[assoc_handle] = s;

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
		kvstr += key.slice(7)+":"+response[key]+"\n";
	}
	response['openid.signed'] = openid_signed.slice(0,-1);
	//@needs to be generated correctly
	console.log(kvstr);
	var ss = servers[options['openid.assoc_handle']].mac_key
	var hmac = crypto.createHmac('sha256', new Buffer(ss, 'base64').toString('binary'));
	hmac.update(kvstr);
	response['openid.sig'] = hmac.digest('base64');

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