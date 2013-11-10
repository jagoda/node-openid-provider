# node-openid-provider

## Introduction

An OpenID Provider implementation currently in early stages of development. It is designed to be used as connect middleware but an api is provided so it can be implemented in any system.

## Usage

A working example is provided in index.js which can be started with `npm start`

### Create an instance of the openid provider

    var OpenIDProvider = require('./provider.js');
	var oidp = new OpenIDProvider(openidUrl, options);

`openidUrl` [string] a url to the openid login handler.

`options` [object] The following settings are available:

- `association_expires`: [integer] The length of time in seconds a consumer should store an association.
- `checkid_params`: [string] The name of the variable used to store parameters passed by checkid_* requests

### Insert the middleware into an express or connect based application

    var express = require('express');
    var app = express();
    app.use(express.bodyParser());
    app.use(oidp.middleware());
    app.listen(3000);

### Create a handler for the login process

    app.post('/', function(req, res) {
        if(req.oidp) { //an openid request was made
            //authenticate with user 'Chris'
            var return_url = oidp.checkid_setup_complete(oidpSession, "http://localhost:3000/user/chris");
            res.redirect(303, return_url);
            res.end();
        }
    });
    
### Create a user page

    app.get('/user/:username', function(req, res) {
        res.header('Content-Type', 'text/html');
        res.end(  '<!DOCTYPE html>'
	    	+ '<html>'
			+ '	<head>'
			+ '		<title>OpenID Provider | User Page</title>'
			+ '		<link rel="openid2.provider" href="http://localhost:3000">'
			+ '		<link rel="openid2.local_id" href="http://localhost:3000/user/'+req.params.username+'">'
			+ '	</head>'
			+ '	<body>'
			+ '		<h1>'+req.params.username+'\'s Page</h1>'
			+ '	</body>'
			+ '</html>');
    });

## Additional functions
### Create an xrds document for the server

	oidp.XRDSDocument();

### Create an xrds document for an id

	oidp.XRDSDocument("http://localhost:3000/user/UniqueName");

## Limitations and Progress

- `checkid_immediate` is not implemented.
- Not all values for assoc_type and session_type are supported.
- Associations are stored in memory. Instead a persistence layer must be created.
- No test suite yet.
- `response_nonce` is not unique.
- `xor()` function needs to be converted to use buffers.
- I have reason to believe the `btwoc()` function may not always work correctly.