# node-openid-provider

## Introduction

An OpenID Provider implementation currently in early stages of development.

## Usage

Check out index.js for an example for use with express.

### Create an instance of the openid provider

	var OpenIDProvider = require('./provider.js');
	var oidp = new OpenIDProvider(openidUrl, options);

`openidUrl`: A string with a url to the openid login handler

options: The following settings are available

- `association_expires`: [integer] The length of time in seconds a consumer should store an association.

### Create an xrds document for the server

	oidp.XRDSDocument();

### Create an xrds document for an id

	oidp.XRDSDocument("UniqueName");

## Limitations and Progress

- `checkid_immediate` is not implemented.
- Not all values for assoc_type and session_type are supported.
- Associations are stored in memory. Instead they a persistence layer must be created.
- No test suite yet.
- `response_nonce` is not unique.
- `xor()` function needs to be converted to use buffers.
- I have reason to believe the `btwoc()` function may not always work correctly.