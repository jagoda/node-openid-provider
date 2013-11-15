var crypto = require('crypto');

/**
 * An interface for creating and retrieving openid associations
 */
function OpenIDAssociationManager() {
	//@TODO: this is a memory database, should probably be an actual database.
	//@TODO: require an OpenIDAssociationManagerStorage object to be passed in.
	//       This object would be responsible for storing and retrieving the assocs.
	//@TODO: move to an async system. Probably requires a large number of changes around the whole codebase.
	this._assocs = [];
}

OpenIDAssociationManager.prototype.create = function() {
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

OpenIDAssociationManager.prototype.createWithHash = function(hashAlgorithm) {
	if(hashAlgorithm != 'sha1' && hashAlgorithm != 'sha256') {
		hashAlgorithm = 'sha256';
	}
	var assoc = this.create();
	assoc.hash = hashAlgorithm;
	assoc.secret = crypto.randomBytes(hashAlgorithm == 'sha1' ? 20 : 32).toString('base64');
	return assoc;
}

OpenIDAssociationManager.prototype.find = function(assoc_handle) {
	if(assoc_handle in this._assocs) {
		return this._assocs[assoc_handle];
	}
	else {
		return null;
	}
}

module.exports = OpenIDAssociationManager;