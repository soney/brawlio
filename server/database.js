var sqlite = require("sqlite3").verbose();
var constants = require("./constants");
var db_path = __dirname+"/"+constants.db_name;
var fs = require('fs');

var Database = function() {};

var DBRow = function(options) {
	for(var key in options) {
		if(options.hasOwnProperty(key)) {
			if(key === "pk") { key = "id"; }
			this[key] = options[key];
		}
	}
};

var create_db_row = function(row, convert_column_names, convert_item_functions) {
	var options = {};
	for(var key in row) {
		if(row.hasOwnProperty(key)) {
			var column = key;
			var value = row[column];

			if(convert_column_names !== undefined) {
				if(convert_column_names.hasOwnProperty(column)) {
					column = convert_column_names[column];
				}
			}

			if(convert_item_functions !== undefined) {
				if(convert_item_functions.hasOwnProperty(column)) {
					value = convert_item_functions[column](value);
				}
			}

			options[column] = value;
		}
	}
	return new DBRow(options);
};


(function(my) {
	var proto = my.prototype;
	
	my.ready = false;
	// Private memebers
	var _database = new sqlite.Database(db_path, function() {
		my.ready = true;
	});

	var to_boolean = function(integer) {
		return integer !== 0;
	};
	var to_date = function(time_int) {
		return new Date(time_int);
	};

	var users_from_rows = function(rows) {
		var users = new Array(rows.length);
		for(var i = 0, len = rows.length; i<len; i++) {
			users[i] = user_from_row(rows[i]);
		}

		return users;
	};
	var user_from_row = function(row) {
		if(row == null) return null;
		var user = create_db_row(row, {
			"pk": "id"
		}, {
			"created": to_date
		});
		return user;
	};
	var bots_from_rows = function(rows) {
		var bots = new Array(rows.length);
		for(var i = 0, len = rows.length; i<len; i++) {
			bots[i] = bot_from_row(rows[i]);
		}

		return bots;
	};
	var bot_from_row = function(row) {
		var bot = create_db_row(row, {
			"pk": "id"
		}, {
			"rated": to_boolean
			, "created": to_date
			, "last_edit": to_date
		});
		return bot;
	};
	var brawls_from_rows = function(rows) {
		var brawls = new Array(rows.length);
		for(var i = 0, len = rows.length; i<len; i++) {
			brawls[i] = brawl_from_row(rows[i]);
		}

		return brawls;
	};
	var brawl_from_row = function(row) {
		var brawl = create_db_row(row, {
			"pk": "id"
		}, {
		});

		return brawl;
	};

	proto.close = function(callback) {
		if(callback === undefined) {
			callback = function(error) {
				process.exit(error ? 1 : 0);
			};
		}
		_database.close(callback);
	};

	// Public members
//User functions
	proto.create_tables = function(callback) {
		var commands = ["create_user_table", "create_openid_table", "create_bots_table", "create_brawls_table"];
		var command_index = 0;
		
		var self = this;
		(function() {
			if(command_index < commands.length) {
				var command = commands[command_index];
				command_index++;

				self[command](arguments.callee);
			}
			else {
				if(callback) {
					callback();
				}
			}
		})();
	};

	proto.create_openid_table = function(callback) {
		_database.run("CREATE TABLE openid ("
			+ "openid_url TEXT PRIMARY KEY UNIQUE"
			+ ", user_fk INTEGER REFERENCES users(pk)"
			+ ")", callback);
	};

	proto.create_user_table = function(callback) {
		_database.run("CREATE TABLE users ("
			+ "pk INTEGER PRIMARY KEY UNIQUE"
			+ ", username TEXT"
			+ ", email TEXT"
			+ ", created INTEGER"
			+ ")", callback);
	};

	proto.create_bots_table = function(callback) {
		_database.run("CREATE TABLE bots ("
			+ "pk INTEGER PRIMARY KEY UNIQUE"
			+ ", user_fk INTEGER REFERENCES users(pk)"
			+ ", name TEXT"
			+ ", rated INTEGER DEFAULT 0"
			+ ", rating INTEGER DEFAULT 1500"
			+ ", wins INTEGER DEFAULT 0"
			+ ", losses INTEGER DEFAULT 0"
			+ ", draws INTEGER DEFAULT 0"
			+ ", code TEXT"
			+ ", api_version INTEGER DEFAULT 0"
			+ ", created INTEGER"
			+ ", last_edit INTEGER"
			+ ")", callback);
	};

	proto.create_brawls_table = function(callback) {
		_database.run("CREATE TABLE brawls ("
			+ "pk INTEGER PRIMARY KEY UNIQUE"
			+ ", date INTEGER"
			+ ", bot1_fk INTEGER REFERENCES bots(pk)"
			+ ", bot1_pre_rating INTEGER"
			+ ", bot1_post_rating INTEGER"
			+ ", bot1_name TEXT"
			+ ", user1_fk INTEGER REFERENCES users(pk)"
			+ ", user1_name TEXT"
			+ ", bot2_fk INTEGER REFERENCES bots(pk)"
			+ ", bot2_pre_rating INTEGER"
			+ ", bot2_post_rating INTEGER"
			+ ", bot2_name TEXT"
			+ ", user2_fk INTEGER REFERENCES users(pk)"
			+ ", user2_name TEXT"
			+ ", winner_fk INTEGER"
			+ ", replay_filename TEXT"
			+ ")", callback);
	};

	proto.drop_tables = function(callback) {
		var table_names = ["users", "openid", "bots", "brawls"];
		var table_index = 0;
		
		var self = this;
		(function() {
			if(table_index < table_names.length) {
				var table_name = table_names[table_index];
				table_index++;

				_database.run("DROP TABLE IF EXISTS " + table_name, arguments.callee);
			} else {
				if(callback) {
					callback();
				}
			}
		})();
	};

	proto.user_key_with_openid = function(openid_url, callback) {
		_database.all("SELECT user_fk FROM openid WHERE openid_url = ? LIMIT 1", openid_url, function(error, rows) {
			if(rows.length === 0) {
				callback(null);
			} else {
				callback(rows[0].user_fk);
			}
		});
	};

	proto.insert = function(table, options, callback) {
		if(callback === undefined) {
			callback = options;
			options = undefined;
		}

		if(options === undefined) {
			query = "INSERT INTO " + table + " DEFAULT VALUES";
			_database.run(query, function(error) {
				if(error) { throw error; }
				var id = this.lastID;
				callback(id);
			});
		} else {
			var columns = [];
			var values = [];
			var q_marks = [];

			for(var column_name in options) {
				if(options.hasOwnProperty(column_name)) {
					var column_value = options[column_name];
					columns.push(column_name);
					values.push(column_value);
					q_marks.push("?");
				}
			}
			var columns_str = columns.join(",");
			var q_marks_str = q_marks.join(",");

			query = "INSERT INTO " + table + " (" + columns_str + ") VALUES (" + q_marks_str + ")";
			_database.run(query, values, function(error) {
				if(error) { throw error; }
				var id = this.lastID;
				callback(id);
			});
		}
	};

	proto.add_user = function(options, callback) {
		this.insert("users", options, callback);
	};

	proto.add_openid = function(options, callback) {
		this.insert("openid", options, callback);
	};

	proto.add_bot = function(options, callback) {
		this.insert("bots", options, callback);
	};

	proto.add_brawl = function(options, callback) {
		this.insert("brawls", options, callback);
	};

	proto.get_all_users = function(callback) {
		_database.all("SELECT * FROM users", function(err, rows) {
			if(err) { throw err; }
			var users = users_from_rows(rows);
			callback(users);
		});
	};
	proto.get_user = function(id, callback) {
		return this.get_users([id], function(result) {
			if(result.length === 1) { callback(result[0]); }
			else { callback(null); }
		});
	};

	proto.get_users = function(ids, callback) {
		var condition = ids.length === 0 ? "" : " WHERE " + ids.map(function(id) {
			return "pk = " + id;
		}).join(" OR ");

		_database.all("SELECT * FROM users " + condition + " LIMIT " + ids.length, function(err, rows) {
			if(err) { throw err; }
			var users = users_from_rows(rows);
			var rv = [];
			for(var i = 0; i<ids.length; i++) {
				var desired_id = ids[i];
				for(var j = 0; j<users.length; j++) {
					var user = users[j];
					if(user.id === desired_id) {
						rv.push(user);
						break;
					}
				}
			}
			callback(rv);
		});
	};

	proto.get_user_with_username = function(username, callback) {
		_database.all("SELECT * FROM users WHERE username == (?) LIMIT 1", username, function(err, rows) {
			if(err) { throw err; }
			if(rows.length === 0) {
				callback(null);
			}
			else {
				var user = user_from_row(rows[0]);
				callback(user);
			}
		});
	};

	proto.set_user_details = function(id, options, callback) {
		var sb = [];
		for(var option_name in options) {
			var option_value = options[option_name];
			sb.push(option_name + " = " + "'"+option_value+"'");
		}
		_database.run("UPDATE users SET " + sb.join() + " WHERE pk = "+id, callback);
	};

	proto.add_bot = function(options, callback) {
		var query;
		if(arguments.length === 1) {
			callback = options;
			query = "INSERT INTO bots DEFAULT VALUES";
			_database.run(query, function(error) {
				var id = this.lastID;
				callback(id);
			});
		} else {
			var columns = [];
			var values = [];
			var q_marks = [];

			for(var column_name in options) {
				var column_value = options[column_name];
				columns.push(column_name);
				values.push(column_value);
				q_marks.push("?");
			}
			var columns_str = columns.join(",");
			var q_marks_str = q_marks.join(",");

			query = "INSERT INTO bots ("+columns_str+") VALUES ("+q_marks_str+")";
			_database.run(query, values, function(error) {
				var id = this.lastID;
				callback(id);
			});
		}
	};

	proto.get_user_bots = function(user_id, callback) {
		_database.all("SELECT * FROM bots WHERE user_fk = " + user_id, function(err, rows) {
			if(err) { throw err; }
			var bots = bots_from_rows(rows);
			callback(bots);
		});
	};

	proto.set_bot_code = function(bot_pk, code, callback) {
		_database.run("UPDATE bots SET code = $code, last_edit = $last_edit WHERE pk = $pk", {
			$code: code
			 , $pk: bot_pk
			 , $last_edit: (new Date()).getTime()
		}, callback);
	};

	proto.get_all_bots = function(callback) {
		_database.all("SELECT * FROM bots", function(err, rows) {
			if(err) { throw err; }
			var bots = bots_from_rows(rows);
			callback(bots);
		});
	};

	proto.get_bots = function(ids, callback) {
		var condition = ids.length === 0 ? "" : " WHERE " + ids.map(function(id) {
			return "pk == " + id;
		}).join(" OR ");

		_database.all("SELECT * FROM bots " + condition + " LIMIT " + ids.length, function(err, rows) {
			if(err) { throw err; }
			var bots = bots_from_rows(rows);
			var rv = [];
			for(var i = 0; i<bots.length; i++) {
				var desired_id = ids[i];
				for(var j = 0; j<bots.length; j++) {
					var bot = bots[j];
					if(bot.id === desired_id) {
						rv.push(bot);
						break;
					}
				}
			}
			callback(rv);
		});
	};

	proto.set_bot_stats = function(bot, callback) {
		_database.run("UPDATE bots SET wins = $wins, draws = $draws, losses = $losses, rated = $rated, rating = $rating WHERE pk = $pk", {
			$wins: bot.wins
			, $draws: bot.draws
			, $losses: bot.losses
			, $rated: bot.rated ? 1 : 0
			, $rating: bot.rating
			, $pk: bot.id
		}, callback);
	};

	proto.set_replay_filename = function(brawl_id, replay_filename, callback) {
		_database.run("UPDATE brawls SET replay_filename = $replay_filename WHERE pk = $pk", {
			$pk: brawl_id
			, $replay_filename: replay_filename
		}, callback);
	};

	proto.get_all_brawls = function(callback) {
		_database.all("SELECT * FROM brawls", function(err, rows) {
			if(err) { throw err; }
			var brawls = brawls_from_rows(rows);
			callback(brawls);
		});
	};

	proto.get_brawls = function(ids, callback) {
		var condition = ids.length === 0 ? "" : " WHERE " + ids.map(function(id) {
			return "pk == " + id;
		}).join(" OR ");

		_database.all("SELECT * FROM brawls " + condition + " LIMIT " + ids.length, function(err, rows) {
			if(err) { throw err; }
			var brawls = brawls_from_rows(rows);
			var rv = [];
			for(var i = 0; i<brawls.length; i++) {
				var desired_id = ids[i];
				for(var j = 0; j<brawls.length; j++) {
					var brawl = brawls[j];
					if(brawl.id === desired_id) {
						rv.push(brawl);
						break;
					}
				}
			}
			callback(rv);
		});
	};

	proto.get_bot_brawls = function(bot_id, limit, callback) {
		var self = this;
		var limit_clause = limit === undefined ? "" : (" LIMIT " + limit);
		_database.all("SELECT * FROM brawls WHERE bot1_fk = $bot_id OR bot2_fk = $bot_id ORDER BY pk DESC" + limit_clause, {
			$bot_id: bot_id
		}, function(err, rows) {
			if(err) { throw err; }
			var brawls = brawls_from_rows(rows);
			callback(brawls);
		});
	};
})(Database);

var db = new Database();
exports.database = db;

var stdin = process.openStdin();

process.on('SIGINT', function () {
	db.close(function(error) {
		console.log("iao...");
		process.exit(error ? 1 : 0);
	});
});
