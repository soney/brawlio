var database = require('./database').database;
var fs = require('fs');
var zlib = require('zlib');

var INVITED_EMAILS_FILE = "invited_emails.txt";
var GAME_LOGS_FOLDER = __dirname+"/../game_logs";

var BrawlIOController = function(options) {
	options = options || {};
	this.server = options.server;
};

(function(my) {
	var proto = my.prototype;

	proto.create_tables = function(callback) {
		database.create_tables(callback);
	};
	proto.drop_tables = function(callback) {
		database.drop_tables(callback);
	};

	proto.user_with_openid = function(claimed_id, callback) {
		database.user_key_with_openid(claimed_id, function(user_key) {
			if(user_key === null) { callback(null); }
			else {
				database.get_user(user_key, function(user) {
					callback(user);
				});
			}
		});
	};

	proto.get_user = function(user_k, callback) {
		database.get_user(user_k, callback);
	};

	proto.email_has_invite = function(email, callback) {
		fs.readFile(INVITED_EMAILS_FILE, "ascii", function (err, data) {
			if (err) { throw err; }
			var invited = data.match(email) !== null;
			callback(invited);
		});
	};

	proto.add_user = function(options, callback) {
		options.created = (new Date()).getTime();
		database.add_user(options, callback);
	};

	proto.add_openid_user = function(openid_url, user_options, callback) {
		this.add_user(user_options, function(user_id) {
			database.add_openid({
				openid_url: openid_url
				, user_fk: user_id
			}, function() {
				callback(user_id);
			});
		});
	};

	proto.user_exists_with_username = function(username, callback) {
		database.get_user_with_username(username, function(user) {
			callback(user !== null);
		});
	};

	proto.set_username = function(user_k, username, callback) {
		var regex = /^[a-zA-Z_$][0-9a-zA-Z_$]{2,14}$/;
		var server = this.server;
		if(username.match(regex) !== null) {
			var self = this;
			this.user_exists_with_username(username, function(taken) {
				if(taken) {
					callback(false);
				} else {
					self.set_user_details(user_k, {username: username}, function() {
						callback(true);
						if(server) {
							server.on_username_set(user_k, username);
						}
					});
				}
			});
		} else {
			callback(false);
		}
	};

	proto.set_user_details = function(user_id, options, callback) {
		var query_setting = {};
		if(options.hasOwnProperty("username")) {
			query_setting.username = options.username;
		}
		if(options.hasOwnProperty("email")) {
			query_setting.email = options.email;
		}
		database.set_user_details(user_id, query_setting, callback);
	};

	proto.add_bot = function(user_fk, name, code, callback) {
		var server = this.server;
		database.add_bot({
			user_fk: user_fk
			, name: name
			, code: code
			, created: (new Date()).getTime()
			, last_edit: (new Date()).getTime()
		}, function(bot_id) {
			callback(bot_id);
			if(bot_id !== null) {
				if(server) {
					server.on_bot_added(user_fk, bot_id);
				}
			}
		});
	};

	proto.get_user_bots = function(user_k, callback) {
		database.get_user_bots(user_k, callback);
	};

	proto.set_bot_code = function(bot_k, code, callback) {
		database.set_bot_code(bot_k, code, callback);
	};

	proto.get_all_bots = function(callback) {
		database.get_all_bots(function(bots) {
			callback(bots);
		});
	};

	proto.get_all_users = function(callback) {
		database.get_all_users(function(users) {
			callback(users);
		});
	};

	proto.get_bots = function(bot_ids, callback) {
		database.get_bots(bot_ids, callback);
	};

	proto.get_bot = function(bot_id, callback) {
		this.get_bots([bot_id], function(bots) {
			var bot = bots[0] || null;
			callback(bot);
		});
	};

	proto.get_all_brawls = function(callback) {
		database.get_all_brawls(callback);
	};
	proto.get_brawl = function(brawl_id, callback) {
		this.get_brawls([brawl_id], function(brawls) {
			var brawl = brawls[0] || null;
			callback(brawl);
		});
	};
	proto.get_brawls = function(brawl_ids, callback) {
		database.get_brawls(brawl_ids, callback);
	};
	proto.get_bot_brawls = function(bot_id, limit, callback) {
		database.get_bot_brawls(bot_id, limit, callback);
	};


	var get_new_wins_losses_draws = function(me_bot, other_bot, winner_id) {
		var rv = {wins: me_bot.wins, losses: me_bot.losses, draws: me_bot.draws};
		if(winner_id === me_bot.id) {
			rv.wins++;
		} else if(winner_id === other_bot.id) {
			rv.losses++;
		} else {
			rv.draws++;
		}
		return rv;
	};

	var get_new_rating = function(me_bot, other_bot, winner_id) {
		var new_rating = me_bot.rating;;
		if(me_bot.rated) {
			var rating_diff = other_bot.rating - me_bot.rating;
			var ea = 1/(1+Math.pow(10, rating_diff/400));
			var k = 32;
			if(me_bot.rating > 2100 && me_bot.rating <= 2400) {
				k = 24;
			} else if(me_bot.rating > 2400) {
				k = 16;
			}
			var sa;
			if(winner_id === me_bot.id) {
				sa = 1.0;
			} else if(winner_id === other_bot.id) {
				sa = 0.0;
			} else {
				sa = 0.5;
			}

			new_rating = me_bot.rating + k * (sa - ea);
		} else {
			if(winner_id === me_bot.id) {
				new_rating = other_bot.rating + 20;
			} else if(winner_id === other_bot.id) {
				new_rating = other_bot.rating - 20;
			} else {
				new_rating = other_bot.rating;
			}
		}

		var rating_floor = Math.min(100 + 4*me_bot.wins + 2*me_bot.draws, 150);
		new_rating = Math.max(new_rating, rating_floor);

		return Math.round(new_rating);
	};
	
	proto.brawl_result = function(bot1_id, bot2_id, winner_id, game_log, callback) {
		var server = this.server;
		database.get_bots([bot1_id, bot2_id], function(bots) {
			var bot1 = bots[0];
			var bot2 = bots[1];
			database.get_users([bot1.user_fk, bot2.user_fk], function(users) {
				var user1 = users[0];
				var user2 = users[1];

				var brawl_options = {
					date: (new Date()).getTime()
					, bot1_fk: bot1_id
					, bot1_pre_rating: bot1.rated ? bot1.rating : 0
					, bot1_name: bot1.name
					, user1_fk: user1.id
					, user1_name: user1.username

					, bot2_fk: bot2_id
					, bot2_pre_rating: bot2.rated ? bot2.rating : 0
					, bot2_name: bot2.name
					, user2_fk: user2.id
					, user2_name: user2.username

					, winner_fk: winner_id
					, replay_filename: ""
				};

				var b1_wld = get_new_wins_losses_draws(bot1, bot2, winner_id);
				bot1.wins = b1_wld.wins; bot1.losses = b1_wld.losses; bot1.draws = b1_wld.draws;
				var b2_wld = get_new_wins_losses_draws(bot2, bot1, winner_id);
				bot2.wins = b2_wld.wins; bot2.losses = b2_wld.losses; bot2.draws = b2_wld.draws;

				var b1_rating = get_new_rating(bot1, bot2, winner_id);
				var b2_rating = get_new_rating(bot2, bot1, winner_id);

				bot1.rating = b1_rating;
				bot2.rating = b2_rating;

				bot1.rated = true;
				bot2.rated = true;

				brawl_options.bot1_post_rating = bot1.rated ? bot1.rating : 0;
				brawl_options.bot2_post_rating = bot2.rated ? bot2.rating : 0;
				database.add_brawl(brawl_options, function(brawl_id) {
					var game_log_filename = "brawl_"+brawl_id+".json.gz";
					var full_game_log_filename = GAME_LOGS_FOLDER + "/" + game_log_filename;
					database.set_replay_filename(brawl_id, game_log_filename, function() {
						zlib.gzip(game_log, function(err, zipped_game_log) {
							if(err) { throw err; }
							fs.writeFile(full_game_log_filename, zipped_game_log, function(err) {
								if(err) { throw err; }
								database.set_bot_stats(bot1, function() {
									database.set_bot_stats(bot2, function() {
										callback(bot1, bot2);

										if(server) {
											server.on_brawl_run(brawl_id);
										}
									});
								});
							}); 
						});
					});
				});
			});
		});
	};

	proto.get_game_log = function(brawl_id, callback) {
		this.get_brawl(brawl_id, function(brawl) {
			var game_log_filename = brawl.replay_filename;
			var full_game_log_filename = GAME_LOGS_FOLDER + "/" + game_log_filename;

			fs.readFile(full_game_log_filename, function (err, data) {
				if (err) { throw err; }
				zlib.gunzip(data, function(err, game_log) {
					if (err) { throw err; }
					callback(game_log.toString());
				});
			});

		});
	};
}(BrawlIOController));

var create_brawlio_controller = function(options) {
	return new BrawlIOController(options);
};

module.exports = create_brawlio_controller;
