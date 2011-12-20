var database = require('./database').database;
var fs = require('fs');

var INVITED_EMAILS_FILE = "invited_emails.txt";

var BrawlIOController = function(options) {
	this.server = options.server;
};

(function(my) {
	var proto = my.prototype;

	proto.user_with_openid = function(claimed_id, callback) {
		database.user_key_with_openid(claimed_id, function(user_key) {
			if(user_key === null) { callback(null); }
			else {
				database.get_user_with_id(user_key, function(user) {
					callback(user);
				});
			}
		});
	};

	proto.user_with_id = function(user_k, callback) {
		database.get_user_with_id(user_k, callback);
	};

	proto.email_has_invite = function(email, callback) {
		fs.readFile(INVITED_EMAILS_FILE, "ascii", function (err, data) {
			if (err) { throw err; }
			var invited = data.match(email) !== null;
			callback(invited);
		});
	};

	proto.add_openid_user = function(openid_url, user_options, callback) {
		database.add_user(user_options, function(user_id) {
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
		if(username.match(regex) !== null) {
			var self = this;
			this.user_exists_with_username(username, function(taken) {
				if(taken) {
					callback(false);
				} else {
					self.set_user_details(user_k, {username: username}, function() {
						callback(true);
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

	proto.user_has_bot_with_name = function(user_k, name, callback) {
	};

	proto.add_bot = function(user_fk, name, code, callback) {
		var server = this.server;
		database.add_bot({
			user_fk: user_fk
			, name: name
			, code: code
		}, function(bot_id) {
			callback(bot_id);
			if(bot_id !== null) {
				server.on_bot_added(user_fk, bot_id);
			}
		});
	};

	proto.get_user_bots = function(user_k, callback) {
		database.get_user_bots(user_k, callback);
	};

	proto.set_bot_code = function(bot_k, code, callback) {
		database.set_bot_code(bot_k, code, callback);
	};

	proto.get_bot_code = function(bot_k, callback) {
	};

	proto.rename_bot = function(bot_k, new_name, callback) {
	};
	
	proto.delete_bot = function(bot_k, callback) {
	};

	proto.get_unranked_bots = function(callback) {
	};

	proto.get_all_bots = function(callback) {
		database.get_all_bots(function(bots) {
			callback(bots);
		});
	};
	proto.get_all_users = function(callback) {
		database.get_users(function(users) {
			callback(users);
		});
	};
	
	proto.get_bots_with_ranking_between = function(above, below, callback) {
	};

	proto.delete_user = function(user_k, callback) {
	};
	proto.brawl_result = function(bot1_id, bot2_id, winner_id, callback) {
		database.get_bots([bot1_id, bot2_id], function(bots) {
			var bot1 = bots[0];
			var bot2 = bots[1];

			var new_bot1_rating, new_bot2_rating;

			if(winner_id === undefined) {
				bot1.draws++;
				bot2.draws++;
				if(bot1.rated === false) {
					new_bot1_rating = bot2.rating;
				} if(bot2.rated === false) {
					new_bot2_rating = bot1.rating;
				}
			} else if(winner_id === bot1_id) {
				bot1.wins++;
				bot2.losses++;
				if(bot1.rated === false) {
					new_bot1_rating = bot2.rating + 100;
				} if(bot2.rated === false) {
					new_bot2_rating = bot1.rating - 100;
				}
			} else if(winner_id === bot2_id) {
				bot1.losses++;
				bot2.wins++;
				if(bot1.rated === false) {
					new_bot1_rating = bot2.rating - 100;
				} if(bot2.rated === false) {
					new_bot2_rating = bot1.rating + 100;
				}
			}

			if(bot1.rated === true) {
				var rating_diff = bot2.rating - bot1.rating;
				var ea = 1/(1+Math.pow(10, rating_diff/400));
				var k = 32;
				if(bot1.rating > 2100 && bot1.rating <= 2400) {
					k = 24;
				} else if(bot1.rating > 2400) {
					k = 16;
				}
				var sa;
				if(winner_id === undefined) {
					sa = 0.0;
				} else if(winner_id = bot1.id) {
					sa = 1.0;
				} else {
					sa = 0.0;
				}

				new_bot1_rating = bot1.rating + k * (sa - ea);
			}

			if(bot2.rated === true) {
				var rating_diff = bot1.rating - bot2.rating;
				var ea = 1/(1+Math.pow(10, rating_diff/400));
				var k = 32;
				if(bot2.rating > 2100 && bot2.rating <= 2400) {
					k = 24;
				} else if(bot2.rating > 2400) {
					k = 16;
				}
				var sa;
				if(winner_id === undefined) {
					sa = 0.0;
				} else if(winner_id = bot2.id) {
					sa = 1.0;
				} else {
					sa = 0.0;
				}

				new_bot2_rating = bot2.rating + k * (sa - ea);
			}

			bot1.rated = true;
			bot2.rated = true;
			bot1.rating = Math.round(new_bot1_rating);
			bot2.rating = Math.round(new_bot2_rating);
			database.set_bot_stats(bot1, function() {
				database.set_bot_stats(bot2, function() {
					callback(bot1, bot2);
				});
			});
		});
	};
}(BrawlIOController));

var create_brawlio_controller = function(options) {
	return new BrawlIOController(options);
};

module.exports = create_brawlio_controller;
