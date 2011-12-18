var openid = require('openid');
var querystring = require('querystring');
var url = require('url');
var express = require("express");
var socket_io = require('socket.io');
var constants = require('./constants');
var bio_inc = require('../include_libs');
var create_bio_controller = require('./controller');

var BrawlIOServer = function(options) {
	options = options || {};
	this.check_invite = options.check_invite || true;
	this.auto_login = options.auto_login || false;
	this.debug_pages = options.debug_pages || false;
	this.use_build = options.use_build || false;
	this.session_to_user = {};
	this.controller = create_bio_controller();

	this.locals = {
		include: function(files) {
			return bio_inc.include_templates(files.map(function(file) {
				return file;
			}));
		}
		, bio_inc: bio_inc
	};
	if(this.use_build) {
		bio_inc.game = [bio_inc.game_build];
		bio_inc.home_css = [bio_inc.home_css_build];
		bio_inc.api_css = [bio_inc.api_css_build];
		bio_inc.dashboard = [bio_inc.dashboard_build];
		bio_inc.dashboard_css = [bio_inc.dashboard_css_build];
		bio_inc.set_username_css = [bio_inc.set_username_css_build];
	} else {
		bio_inc.game = bio_inc.game_src;
		bio_inc.home_css = bio_inc.home_css_src;
		bio_inc.api_css = bio_inc.api_css_src;
		bio_inc.dashboard = bio_inc.dashboard_src;
		bio_inc.dashboard_css = bio_inc.dashboard_css_src;
		bio_inc.set_username_css = bio_inc.set_username_css_src;
	}
};

function bind(fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
}
var callback_map = function(arr, func, callback) {
	var rv = [];
	var waiting_for = arr.length;
	arr.forEach(function(item, index) {
		func(item, function(mapped) {
			rv[index] = mapped;
			waiting_for--;
			if(waiting_for <= 0) {
				callback(rv);
			}
		});
	});
};

(function(my) {
	var jslint_options = {};

	var proto = my.prototype;
	//Private memebers
	var server = undefined,
		io = undefined;

	proto.start_server = function(path, port) {
		server = express.createServer(
				express.cookieParser()
				, express.session({secret: constants.session_secret})
				, express.router(bind(this.routes, this))
				, express.static(path)
			);
		io = socket_io.listen(server);
		io.set("log level", 0);

		this.initialize_sockets(io);

		server.listen(port);
	};

	proto.initialize_sockets = function(io) {
		var self = this;
		io.sockets.on('connection', function(socket) {
			socket.on('session_key', function(key, callback) {
				var user_id = self.session_to_user[key];
				if(user_id) {
					delete self.session_to_user[key];
					self.initialize_socket(socket, user_id);
					callback();
				}
			});
		});
	};

	proto.initialize_socket = function(socket, user_id) {
		var self = this;
		socket.on('username_free', function(username, callback) {
			self.controller.user_exists_with_username(username, function(user_exists) {
				callback(!user_exists);
			});
		});

		socket.on('set_username', function(username, callback) {
			self.controller.set_username(user_id, username, callback);
		});

		socket.on('get_user', function(uid, callback) {
			if(uid === null) { uid = user_id; }
			self.controller.user_with_id(uid, callback);
		});

		socket.on('get_user_bots', function(uid, callback) {
			if(uid === null) { uid = user_id; }

			self.controller.get_user_bots(uid, callback);
		});
	};

	var relyingParty;

	proto.render_home = function(req, res, next) {
		var self = this;
		var session = req.session;
		if(this.auto_login) {
			session.user_id = 1;
		}

		if(session.user_id) {
			this.session_to_user[req.sessionID] = session.user_id;
			this.controller.user_with_id(session.user_id, function(user) {
				if(user.username === null) {
					res.render("set_username.jade", {layout: false, session_key: req.sessionID, locals: self.locals});
				} else {
					res.render("dashboard.jade", {layout: false, session_key: req.sessionID, locals: self.locals});
				}
			});
		}
		else {
			res.render("index.jade", {layout: false, locals: this.locals});
		}
	}

	proto.routes = function(server) {
		var  self = this;
		server.get("/", function(req, res, next) {
			self.render_home(req, res, next);
		});

		server.get("/authenticate", function(req, res, next) {
			var parsedUrl = url.parse(req.url);
			// User supplied identifier
			var query = querystring.parse(parsedUrl.query);
			var identifier = query.openid_identifier;
			var ax = new openid.AttributeExchange({
				"http://axschema.org/contact/email": "required"
			});
			relyingParty = new openid.RelyingParty(
								req.headers.referer+'verify' // Verification URL (yours)
								, null // Realm (optional, specifies realm for OpenID authentication)
								, false // Use stateless verification
								, false // Strict mode
								, [ax]); // List of extensions to enable and include

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
		server.get("/api", function(req, res, next) {
			res.render("api.jade", {layout: false, locals: self.locals});
		});

		server.get("/verify", function(req, res, next) {
			var session = req.session;
            // Verify identity assertion
            // NOTE: Passing just the URL is also possible
            relyingParty.verifyAssertion(req, function(error, result) {
				if(result) {
					if(result.authenticated) {
						var claimed_identifier = result.claimedIdentifier;
						var email = result.email;

						self.controller.user_with_openid(claimed_identifier, function(user) {
							if(user === null) {
								var add_user = function() {
									self.controller.add_openid_user(claimed_identifier, {email: email}, function(user_id) {
										session.user_id = user_id;
										res.render("verify/user_init.jade", {layout: false});
									});
								};
								if(server.check_invite) {
									self.controller.email_has_invite(email, function(has_invite) {
										if(has_invite) {
											res.render("verify/not_invited.jade", {layout: false});
										} else {
											add_user();
										}
									});
								} else {
									add_user();
								}
							} else {
								session.user_id = user.id;
								res.render("verify/old_user_success.jade", {layout: false});
							}
						})
					} else {
						res.render("verify/fail.jade", {layout: false});
					}
				} else {
					res.render("index.jade", {layout: false});
				}
            });
		});

		server.get("/logout", function(req, res, next) {
			var session = req.session;
			session.destroy();
			res.render("logout.jade", {layout: false});
		});

		if(this.debug_pages) {
			var jslint = require("jslint/lib/jslint");
			server.get("/jslint", function(req, res, next) {
				var errors_only = true;
				var lintFile = function(file, options, callback) {
					fs.readFile(file, function (err, data) {
						if (err) {
							throw err;
						}
						data = data.toString("utf8");

						jslint(data, options);
						var report = jslint.report(errors_only);
						if(callback) {
							callback(report);
						}
					});
				}
				var files = req.query.filename ? [req.query.filename] : bio_inc.game_src;
				callback_map(files, function(file_name, good_callback) {
					lintFile(file_name, jslint_options, function(report) {
						good_callback(report);
					});
				}, function(rv) {
					self.locals.reports = rv.map(function(report, index) {
						return {
							file: files[index]
							, lint: report
						};
					});

					res.render("jslint.jade", {layout: false, locals: self.locals});
				});
				return;
			});
		}
	};

	//Public members
	proto.start = function(path, port, message) {
		if(!path) path = __dirname;
		this.start_server(path, port);
		if(message) {
			console.log(message);
		}
	};
}(BrawlIOServer));

module.exports = BrawlIOServer;
