/**
 * Errors
 */
function OpenIDAssocHandleNotFoundException(assoc_handle) {
	this.name = "ASSOC_HANDLE_NOT_FOUND";
	this.message = "Provided assoc_handle does not exist.";
	console.error(this.message, assoc_handle);
}
module.exports.OpenIDAssocHandleNotFoundException = OpenIDAssocHandleNotFoundException;

function OpenIDModeNotFoundException(mode) {
	this.name = "MODE_NOT_FOUND";
	this.message = "Invalid mode provided.";
	console.error(this.message, mode);
}
module.exports.OpenIDModeNotFoundException = OpenIDModeNotFoundException;

function OpenIDResponseNoReturnUrlException() {
	this.name = "RETURN_URL_NOT_PROVIDED";
	this.message = "No return_url provided. Cannot create url from response."
	console.error(this.message);
}
module.exports.OpenIDResponseNoReturnUrlException = OpenIDResponseNoReturnUrlException;