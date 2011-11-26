var openid = require('openid');
var querystring = require('querystring');
var url = require('url');
var fs = require('fs');
var express = require("express");
var socket_io = require('socket.io');
var database = require('./database').database;
var constants = require('./constants');
var bio_inc = require('../include_libs');

var BrawlIOServer = function(options) {
	options = options || {};
	this.check_invite = options.check_invite || true;
	this.auto_login = options.auto_login || false;
	this.debug_pages = options.debug_pages || false;
	this.use_build = options.use_build || false;
	this.session_to_user = {};

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
	} else {
		bio_inc.game = bio_inc.game_src;
		bio_inc.home_css = bio_inc.home_css_src;
		bio_inc.api_css = bio_inc.api_css_src;
		bio_inc.dashboard = bio_inc.dashboard_src;
		bio_inc.dashboard_css = bio_inc.dashboard_css_src;
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
		socket.on('get_user', function(username, callback) {
			if(username!=null) {
				database.get_user_with_username(username, callback);
			} else {
				database.get_user_with_id(user_id, callback);
			}
		});
		socket.on('get_users', function(user_ids, callback) {
			if(user_ids.length === 0) {
				callback([]);
			} else {
				database.get_users_with_ids(user_ids, callback);
			}
		});
		socket.on('get_user_teams', function(username, callback) {
			var teams_for_user_id = user_id;
			if(username!=null) {
				teams_for_user_id = username;
			}

			//This function automatically determines if the id is a string or number
			database.get_user_teams(teams_for_user_id, callback);
		});
		socket.on('set_team_code', function(team_id, code, callback) {
			database.get_user_teams(user_id, function(teams) {
				var setting_team = null;
				for(var i = 0, len = teams.length; i<len; i++) {
					var team = teams[i];
					if(team.id === team_id) {
						setting_team = team;
						break;
					}
				}
				if(setting_team !== null) {
					var char_limit = team.char_limit;
					var issues_bit = 0;
					if(code.length > char_limit) {
						issues_bit = 1;
					}
					database.set_team_code(team_id, code, issues_bit, callback);
				}
			});
		});
		socket.on('choose_opponents_for_team', function(team_id, callback) {
			var possible_opponents = database.get_teams_with_same_weight_class_as(team_id, function(teams) {
				var rv = teams.filter(function(team) {
					return team.id !== team_id;
				});
				callback(rv);
			});
		});
		socket.on('get_brawls', function(for_user_id, callback) {
			if(arguments.length === 1) {
				callback = for_user_id;
				for_user_id = user_id;
			} else if(for_user_id == null) {
				for_user_id = user_id;
			}
			database.get_user_brawls(for_user_id, callback);
		});
		socket.on('get_brawl', function(brawl_id, callback) {
			database.get_brawl(brawl_id, callback);
		});
		socket.on('get_king_code', function(callback) {
			database.get_king_code(function(king_code) {
				callback(king_code);
			});
		});
		socket.on('claim_crown', function(code, callback) {
			database.set_king(user_id, function() {
				database.set_king_code(code, function() {
					callback();
				});
			});
		});
		socket.on('is_king', function(callback) {
			database.get_king(function(king_id) {
				callback(king_id===user_id);
			});
		});
	};

	var relyingParty;

	proto.render_home = function(req, res, next) {
		var session = req.session;
		if(this.auto_login) {
			session.user_id = 1;
		}

		if(session.user_id) {
			this.session_to_user[req.sessionID] = session.user_id;
			res.render("dashboard.jade", {layout: false, session_key: req.sessionID, locals: this.locals});
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

						database.user_key_with_openid(claimed_identifier, function(user_id) {
							if(user_id === null) {
								var add_user = function() {
									database.add_user_with_openid(claimed_identifier, function(user_id) {
										session.user_id = user_id;
										database.set_user_details(user_id, {username: '"'+email+'"', email: '"'+email+'"'}, function() {
											res.render("verify/user_init.jade", {layout: false});
										});
									});
								};
								if(server.check_invite) {
									fs.readFile("invited_emails.txt", "ascii", function (err, data) {
										if (err) throw err;
										if(data.match(email) === null) {
											res.render("verify/not_invited.jade", {layout: false});
										} else {
											add_user();
										}
									});
								} else {
									add_user();
								}
							} else {
								session.user_id = user_id;
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

	proto.do_run_brawl = function(my_team, opponent, callback) {
		var map = new Map();
		var team_me = new Team({
			code: my_team.code 
			, id: my_team.id
		});
		var team_other = new Team({
			code: opponent.code
			, id: opponent.id
		});

		var brawl = new Brawl({
			teams: [team_me, team_other]
			, map: map
			, round_limit: 100
		});

		brawl.run(function(winner) {
			var db_winner;
			
			if(winner === my_team.id) {
				db_winner = 1;
			} else if(winner === opponent.id) {
				db_winner = 2;
			} else {
				db_winner = 0;
			}

			database.log_brawl({
				team_1: my_team.id
				, team_2: opponent.id
				, result: db_winner 
			}, function(log_info) {
				var replay_filename = log_info.replay_filename;
				var replay = brawl.replay;
				var replay_string = JSON.stringify(replay);

				fs.writeFile(replay_filename, replay_string, function(err) {
					if(err) {
						console.error(err);
					} else {
						if(callback) {
							callback({
								winner: winner
								, id: log_info.id
								, replay_filename: replay_filename
							});
						}
					}
				}); 
			});
		});
	};

}(BrawlIOServer));

module.exports = BrawlIOServer;
