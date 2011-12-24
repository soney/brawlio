var openid = require('openid');
var querystring = require('querystring');
var url = require('url');
var express = require("express");
var socket_io = require('socket.io');
var constants = require('./constants');
var bio_inc = require('../include_libs');
var create_bio_controller = require('./controller');
var parseCookie = require('connect').utils.parseCookie;

var listener_id = 0;
var Listener = function(type, callback) {
	this.id = listener_id++;
	this.type = type;
	this.callback = callback;
};

(function(my) {
	var proto = my.prototype;
	proto.matches = function(id_or_callback) {
		return this.id === id_or_callback || this.callback === id_or_callback;
	};
	proto.interested_in = function(event) {
		return event.type === this.type;
	};
	proto.get_callback = function() { return this.callback; };
}(Listener));

var BrawlIOServer = function(options) {
	options = options || {};
	this.check_invite = options.check_invite || true;
	this.auto_login = options.auto_login || false;
	this.debug_pages = options.debug_pages || false;
	this.use_build = options.use_build || false;
	this.skip_auth = options.skip_auth || false;
	this.session_to_user = {};
	this.controller = create_bio_controller({server: this});
	this.listeners = [];

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
		bio_inc.set_username = [bio_inc.set_username_build];
	} else {
		bio_inc.game = bio_inc.game_src;
		bio_inc.home_css = bio_inc.home_css_src;
		bio_inc.api_css = bio_inc.api_css_src;
		bio_inc.dashboard = bio_inc.dashboard_src;
		bio_inc.dashboard_css = bio_inc.dashboard_css_src;
		bio_inc.set_username_css = bio_inc.set_username_css_src;
		bio_inc.set_username = bio_inc.set_username_src;
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
				, express.session({key: 'express.sid', secret: constants.session_secret})
				, express.router(bind(this.routes, this))
				, express.static(path)
			);
		io = socket_io.listen(server);
		io.set("log level", 0);
		io.set("authorization", function(data, accept) {
			// check if there's a cookie header
			if (data.headers.cookie) {
				// if there is, parse the cookie
				data.cookie = parseCookie(data.headers.cookie);
				// note that you will need to use the same key to grad the
				// session id, as you specified in the Express setup.
				data.sessionID = data.cookie['express.sid'];
			} else {
				// if there isn't, turn down the connection with a message
				// and leave the function.
				return accept('No cookie transmitted.', false);
			}
			// accept the incoming connection
			accept(null, true);
		});

		this.initialize_sockets(io);

		server.listen(port);
	};

	proto.initialize_sockets = function(io) {
		var self = this;
		io.sockets.on('connection', function(socket) {
			var key = socket.handshake.sessionID;
			var user_id = self.session_to_user[key];
			if(user_id) {
				delete self.session_to_user[key];
				self.initialize_socket(socket, user_id);
			}
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
			self.controller.get_user(uid, callback);
		});

		socket.on('get_user_bots', function(uid, callback) {
			if(uid === null) { uid = user_id; }
			self.controller.get_user_bots(uid, callback);
		});

		socket.on('add_bot', function(name, callback) {
			self.controller.add_bot(user_id, name, "", callback);
		});

		socket.on('get_all_bots', function(callback) {
			self.controller.get_all_bots(callback);
		});

		socket.on('set_bot_code', function(bot_id, code, callback) {
			self.controller.set_bot_code(bot_id, code, callback);
		});

		socket.on('get_all_users', function(callback) {
			self.controller.get_all_users(callback);
		});

		socket.on('brawl_result', function(bot1_id, bot2_id, winner_id, callback) {
			self.controller.brawl_result(bot1_id, bot2_id, winner_id, callback);
		});


		var callback_id0 = this.on("brawl_run", function(brawl) {
			console.log(brawl);
		});

		socket.on('disconnect', function() {
			self.off(callback_id0);
		});
	};

	proto.on_bot_added = function(user_id, bot_id) {
		var self = this;
		this.controller.get_bot(bot_id, function(bot) {
			self.emit({
				type: "bot_added"
				, bot: bot
			});
		});
	};

	proto.on_username_set = function(user_id, username) {
		var self = this;
		this.controller.get_user(user_id, function(user) {
			self.emit({
				type: "username_set"
				, user: user
			});
		});
	};

	proto.on_brawl_run = function(brawl_id) {
		var self = this;
		this.controller.get_brawl(brawl_id, function(brawl) {
			self.emit({
				type: "brawl_run"
				, brawl: brawl
			});
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
			this.controller.get_user(session.user_id, function(user) {
				if(user.username === null) {
					res.render("set_username.jade", {layout: false, locals: self.locals});
				} else {
					res.render("dashboard.jade", {layout: false, locals: self.locals});
				}
			});
		} else {
			res.render("index.jade", {layout: false, locals: this.locals});
		}
	}

	proto.routes = function(server) {
		var  self = this;
		server.get("/", function(req, res, next) {
			self.render_home(req, res, next);
		});

		server.get("/authenticate", function(req, res, next) {
			if(self.skip_auth) {
				res.writeHead(302, { Location: req.headers.referer+"verify" });
				res.end();
			} else {
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
			}
		});

		server.get("/api", function(req, res, next) {
			res.render("api.jade", {layout: false, locals: self.locals});
		});

		server.get("/verify", function(req, res, next) {
			var after_authenticated = function(claimed_identifier, email) {
				var session = req.session;
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
				});
			};

			if(self.skip_auth) {
				after_authenticated("", "");
			} else {
				// Verify identity assertion
				// NOTE: Passing just the URL is also possible
				relyingParty.verifyAssertion(req, function(error, result) {
					if(result) {
						if(result.authenticated) {
							var claimed_identifier = result.claimedIdentifier;
							var email = result.email;

							after_authenticated(claimed_identifier, email);
						} else {
							res.render("verify/fail.jade", {layout: false});
						}
					} else {
						res.render("index.jade", {layout: false});
					}
				});
			}
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

	proto.on = proto.add_listener = function(type, callback) {
		var listener = new Listener(type, callback);
		this.listeners.push(listener);
		return listener.id;
	};

	proto.off = proto.remove_listener = function(id_or_callback) {
		for(var i = 0; i<this.listeners.length; i++) {
			var listener = this.listeners[i];
			if(listener.matches(id_or_callback)) {
				this.listeners.splice(i, 1);
				i--;
			}
		}
	};

	proto.emit = function(event) {
		for(var i = 0; i<this.listeners.length; i++) {
			var listener = this.listeners[i];
			if(listener.interested_in(event)) {
				var callback = listeners.get_callback();
				callback(event);
			}
		}
	};
}(BrawlIOServer));

module.exports = BrawlIOServer;
