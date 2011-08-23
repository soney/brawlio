var openid = require('openid');
var querystring = require('querystring');
var url = require('url');
var fs = require('fs');
var express = require("express");
var socket_io = require('socket.io');
var database = require('./database').database;
var constants = require('./constants');

var Brawl = require('../game/brawl');
var Map = require('../game/models/map');
var Team = require('../game/models/team');

var BrawlIOServer = function() { };

(function(my) {
	var proto = my.prototype;
	//Private memebers
	var server = undefined,
		io = undefined;

	var start_server = function(bio_server, port, path) {
		server = express.createServer(
				express.cookieParser()
				, express.session({secret: constants.session_secret})
				, express.router(routes)
				, express.static(path)
			);
		io = socket_io.listen(server);
		io.set("log level", 0);

		initialize_sockets(bio_server, io);

		server.listen(port);
	};

	var session_to_user = {};
	var initialize_sockets = function(bio_server, io) {
		io.sockets.on('connection', function(socket) {
			socket.on('session_key', function(key, callback) {
				var user_id = session_to_user[key];
				if(user_id) {
					delete session_to_user[key];
					initialize_socket(bio_server, socket, user_id);
					callback();
				}
			});
		});
	};

	var initialize_socket = function(bio_server, socket, user_id) {
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
			database.get_king(function(king_id) {
				database.get_user_teams(king_id, function(teams) {
					var team = teams[0];
					callback(team.code);
				});
			});
		});
		socket.on('claim_crown', function(callback) {
			database.set_king(user_id, function() {
				callback();
			});
		});
		socket.on('is_king', function(callback) {
			database.get_king(function(king_id) {
				callback(king_id===user_id);
			});
		});
		socket.on('run_brawl', function(my_team_id, opponent_team_id, callback) {
			database.get_teams([my_team_id, opponent_team_id], function(teams) {
				var my_team = teams[0]
					, opponent = teams[1];
				var errors = [];
				if(my_team == null) {
					errors.push("Could not find team with id " + my_team_id);
				}
				if(opponent == null) {
					errors.push("Could not find team with id " + opponent_team_id);
				}
				if(my_team != null && opponent != null) {
					if(my_team.weight_class !== opponent.weight_class) {
						errors.push("Teams have mismatched weight classes");
					}
					if(my_team_id !== user_id) {
						errors.push("You may only challenge using your own teams");
					}
					//TODO: Other checks: code size, active, valid, not the same team, etc
				}


				if(errors.length === 0) {
					console.log("Running brawl - " + my_team.id + " vs. " + opponent.id + "...");
					bio_server.do_run_brawl(my_team, opponent, function(brawl_info) {
						socket.emit("brawl_done", brawl_info.id);
						if(brawl_info.winner === my_team.id) {
							console.log("I won!");
						} else if(brawl_info.winner === opponent.id) {
							console.log("I lost.");
						} else {
							console.log("Draw.");
						}
						callback(brawl_info.id);
					});
				}
				else {
					callback({errors: errors});
				}
			});
			
		});
	};

	var relyingParty;

	var _debug = false;
	function render_home(req, res, next) {
		var session = req.session;
		if(_debug) {
			session.user_id = 1;
		}

		if(session.user_id) {
			session_to_user[req.sessionID] = session.user_id;
			res.render("dashboard.jade", {layout: false, session_key: req.sessionID});
		}
		else {
			res.render("index.jade", {layout: false});
		}
	}

	var routes = function(server) {
		server.get("/", function(req, res, next) {
			render_home(req, res, next);
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
			res.render("api.jade", {layout: false});
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
								fs.readFile("invited_emails.txt", "ascii", function (err, data) {
									if (err) throw err;
									if(data.match(email) === null) {
										res.render("verify/not_invited.jade", {layout: false});
									} else {
										database.add_user_with_openid(claimed_identifier, function(user_id) {
											session.user_id = user_id;
											database.set_user_details(user_id, {username: '"'+email+'"', email: '"'+email+'"'}, function() {
												res.render("verify/user_init.jade", {layout: false});
											});
										});
									}
								});
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

		server.get("/replay/:filename", function(req, res, next) {
			var filename = req.params.filename;
			fs.readFile(filename, function (err, data) {
				if (err) {
					next(err);
					return;
				}
				res.send(data);
			});
		});
		

		server.get("/logout", function(req, res, next) {
			var session = req.session;
			session.destroy();
			res.render("logout.jade", {layout: false});
		});

		server.get("/manage_account", function(req, res, next) {
			var session = req.session;
			if(session.user_id) {
				var user_id = session.user_id;
				var user = database.get_user_with_id(user_id);
				res.render("manage_account.jade", {layout: false, user: user});
			}
		});

	};

	//Public members
	proto.start = function(path, port, message) {
		if(!path) path = __dirname;
		start_server(this, port||8000, path);
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

})(BrawlIOServer);

module.exports = BrawlIOServer;
