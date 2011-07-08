var openid = require('openid');
var querystring = require('querystring');
var url = require('url');
var express = require("express");
var auth = require("connect-auth");
var socket_io = require('socket.io');
var Worker = require('webworker').Worker;
var DigestJ = require('./digestj');
var database = require('./database').database;
var Registration = require('./registration');

var BrawlIO = function() {
};

var main_path;

(function() {
	//Private memebers
	var server = undefined,
		io = undefined;

	var start_server = function(path) {
	main_path = path;
		server = express.createServer(
				 express.router(routes)
				, express.static(path)
			);
		io = socket_io.listen(server);

		initialize_sockets(io);

		server.listen(8000);
	};

	var relyingParty = new openid.RelyingParty(
		'http://localhost:8000/verify' // Verification URL (yours)
		, null // Realm (optional, specifies realm for OpenID authentication)
		, false // Use stateless verification
		, false // Strict mode
		, []); // List of extensions to enable and include

	var routes = function(server) {
		server.get("/", function(req, res, next) {
			res.render("index.jade", {layout: false});
		});
		server.get("/authenticate", function(req, res, next) {
			var parsedUrl = url.parse(req.url);
			// User supplied identifier
			var query = querystring.parse(parsedUrl.query);
			var identifier = query.openid_identifier;

			// Resolve identifier, associate, and build authentication URL
			relyingParty.authenticate(identifier, false, function(error, authUrl) {
				if (error) {
				  res.writeHead(200);
				  res.end('Authentication failed: ' + error);
				}
				else if (!authUrl) {
				  res.writeHead(200);
				  res.end('Authentication failed');
				}
				else {
				  res.writeHead(302, { Location: authUrl });
				  res.end();
				}
			});
		});
		server.get("/verify", function(req, res, next) {
            // Verify identity assertion
            // NOTE: Passing just the URL is also possible
            relyingParty.verifyAssertion(req, function(error, result) {
				if(result) {
					if(result.authenticated) {
						var claimed_identifier = result.claimedIdentifier;

						var user_id = database.user_key_with_openid(claimed_identifier);
						console.log(user_id);
						if(user_id === null) {
							res.render("verify_success_new_user.jade", {layout: false});
						}
						else {
							res.render("verify_success_old_user.jade", {layout: false});
						}
					}
					else {
						res.render("verify_fail.jade", {layout: false});
					}
				}
				else {
					res.render("index.jade", {layout: false});
				}
            });
		});
		server.get("/dashboard", function(req, res, next) {
			res.render("dashboard.jade", {layout: false});
		});
	};

	var initialize_sockets = function(io) {
		io.sockets.on('connection', function(socket) {
			initialize_socket(socket);
		});
	};

	var initialize_socket = function(socket) {
	};

	//Public members
	this.start = function(path) {
		if(!path) path = __dirname;
		start_server(path);
		console.log("Good times to be had at localhost:8000");
	};

}).call(BrawlIO.prototype);

module.exports = BrawlIO;
