function getExtensionAlias (version, options) {
	var aliasPattern = /^ns\.(\w+)$/;
	var alias = null;
	
	for(var key in options) {
		var matches = key.match(aliasPattern);
		
		if (matches && options[key] === version) {
			alias = matches[1];
			break;
		}
	}
	
	return alias;
}

function getExtensionOptions (alias, options) {
	var prefix = alias + ".";
	var extensionOptions = {};
	
	for(var key in options) {
		if (key.indexOf(prefix) === 0) {
			extensionOptions[key.substring(prefix.length)] = options[key];
		}
	}
	
	return extensionOptions;
}

var AttributeExchange = module.exports.AttributeExchange = function () {
};

AttributeExchange.prototype.version = "http://openid.net/srv/ax/1.0";

// This should be overriden by the consumer.
AttributeExchange.prototype.getAttribute = function (schema, localId) {
	return null;
};

AttributeExchange.prototype.handle = function (localId, request, response) {
	var extensionAlias = getExtensionAlias(this.version, request);
	
	// No parameters for this extension.
	if (! extensionAlias) {
		return;
	}
	
	var typePattern = new RegExp("^type\\.(\\w+)$");
	var options = getExtensionOptions(extensionAlias, request);
	
	if (options.mode === "fetch_request") {
		response.set("ns." + extensionAlias, this.version);
		response.set(extensionAlias + ".mode", "fetch_response");
		
		for(var key in options) {
			var matches = key.match(typePattern);
			
			if (matches) {
				var value = this.getAttribute(options[key], localId);
				
				if (value) {
					response.set(extensionAlias + ".type." + matches[1], options[key]);
					response.set(extensionAlias + ".value." + matches[1], value);
				}
			}
		}
	}
};
