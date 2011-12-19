var sqlite = require("sqlite3").verbose();
var constants = require("./constants");
var db_path = __dirname+"/"+constants.db_name;
var fs = require('fs');

var WeightClasses = require("./weight_class");

var Database = function() {};

var DBBot = function(id, name, rated, rating, wins, losses, draws, code, user_fk) {
	this.id = id;
	this.name = name;
	this.rated = rated;
	this.rating = rating;
	this.wins = wins;
	this.losses = losses;
	this.draws = draws;
	this.code = code;
	this.user_fk = user_fk;
};

var DBUser = function(id, username, email) {
	this.id = id;
	this.username = username;
	this.email = email;
};

var DBBrawl = function(id, bot_1_fk, user_1_fk, bot_2_fk, user_2_fk, result, status, replay_filename) {
	this.id = id;
	this.bot_1_fk = bot_1_fk;
	this.user_1_fk = user_1_fk;
	this.bot_2_fk = bot_2_fk;
	this.user_2_fk = user_2_fk;
	this.result = result;
	this.status = status;
	this.replay_filename = replay_filename;
};

(function(my) {
	var proto = my.prototype;
	
	my.ready = false;
	// Private memebers
	var _database = new sqlite.Database(db_path, function() {
		my.ready = true;
	});

	var user_factory = function(options) {
		var user = new DBUser(options.id, options.username, options.email);
		return user;
	};
	var bot_factory = function(options) {
		var bot = new DBBot(options.id, options.name, options.rated, options.rating, options.wins, options.losses, options.draws, options.code, options.user_fk);
		return bot;
	};
	var brawl_factory = function(options) {
		var brawl = new DBBrawl(options.id, options.team_1_fk, options.bot_1_fk, options.bot_2_fk, options.user_2_fk, options.result, options.status, options.replay_filename)
		return brawl;
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
		var user = user_factory( {
			id: row.pk
			, username: row.username
			, email: row.email
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
		var options = {
			id: row.pk
			, name: row.name
			, rated: row.rated !== 0
			, rating: row.rating
			, wins: row.wins
			, losses: row.losses
			, draws: row.draws
			, code: row.code
			, user_fk: row.user_fk
		};
			
		var bot = bot_factory(options);
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
		var options = {
			id: row.pk
			, team_1_fk: row.team_1_fk
			, user_1_fk: row.user_1_fk
			, team_2_fk: row.team_2_fk
			, user_2_fk: row.user_2_fk
			, result: row.result
			, status: row.status
			, replay_filename: row.replay_filename
		};
			
		var brawl = brawl_factory(options);
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
			+ ")", callback);
	};

	proto.create_brawls_table = function(callback) {
		_database.run("CREATE TABLE brawls ("
			+ "pk INTEGER PRIMARY KEY UNIQUE"
			+ ", bot_1_fk INTEGER REFERENCES teams(pk)"
			+ ", user_1_fk INTEGER REFERENCES users(pk)"
			+ ", bot_2_fk INTEGER REFERENCES teams(pk)"
			+ ", user_2_fk INTEGER REFERENCES users(pk)"
			+ ", result INTEGER"
			+ ", status INTEGER"
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
			}
			else {
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

	proto.get_users = function(callback) {
		_database.all("SELECT * FROM users", function(err, rows) {
			if(err) { throw err; }
			var users = users_from_rows(rows);
			callback(users);
		});
	};
	proto.get_user_with_id = function(id, callback) {
		return this.get_users_with_ids([id], function(result) {
			if(result.length === 1) { callback(result[0]); }
			else { callback(null); }
		});
	};

	proto.get_users_with_ids = function(ids, callback) {
		var condition = ids.length === 0 ? "" : " WHERE " + ids.map(function(id) {
			return "pk = " + id;
		}).join(" OR ");

		_database.all("SELECT * FROM users " + condition + " LIMIT " + ids.length, function(err, rows) {
			if(err) { throw err; }
			var users = users_from_rows(rows);
			callback(users);
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
		_database.run("UPDATE bot SET code = (?), WHERE pk = " + bot_pk, [code], callback);
	};

	proto.get_all_bots = function(callback) {
		_database.all("SELECT * FROM bots", function(err, rows) {
			if(err) { throw err; }
			var bots = bots_from_rows(rows);
			callback(bots);
		});
	};

	proto.get_teams = function(ids, callback) {
		var condition = ids.length === 0 ? "" : " WHERE " + ids.map(function(id) {
			return "pk == " + id;
		}).join(" OR ");

		_database.all("SELECT * FROM teams " + condition + " LIMIT " + ids.length, function(err, rows) {
			if(err) throw err;
			var teams = teams_from_rows(rows);
			callback(teams);
		});
	};
	proto.log_brawl = function(options, callback) {
		var team_1_id = options.team_1
			, team_2_id = options.team_2
			, result = options.result
			, status = 0
			;
		this.get_teams([team_1_id, team_2_id], function(teams) {
			var user_1_id = teams[0].user_fk;
			var user_2_id = teams[1].user_fk;

			_database.run("INSERT INTO brawls (team_1_fk, user_1_fk, team_2_fk, user_2_fk, result, status) VALUES (?, ?, ?, ?, ?, ?)"
								, [team_1_id, user_1_id, team_2_id, user_2_id, result, status]
								, function(err) {
				if(err) throw err;
				var id = this.lastID;
				var replay_filename = "replays/replay-"+id+".json";

				_database.run("UPDATE brawls SET replay_filename = ? WHERE pk = ?", replay_filename, id, function(err) {
					if(err) throw err;
					callback({
						id: id
						, replay_filename: replay_filename
					});
				});
			});
		});
	};

	proto.get_brawl = function(id, callback) {
		return this.get_brawls([id], function(result) {
			if(result.length === 1) { callback(result[0]); }
			else {callback(null);}
		});
	};

	proto.get_brawls = function(ids, callback) {
		var condition = ids.length === 0 ? "" : " WHERE " + ids.map(function(id) {
			return "pk == " + id;
		}).join(" OR ");

		_database.all("SELECT * FROM brawls " + condition + " LIMIT " + ids.length, function(err, rows) {
			if(err) { throw err; }
			var brawls = brawls_from_rows(rows);
			callback(brawls);
		});
	};

	proto.get_bot_brawls = function(bot_id, callback) {
		var self = this;
		_database.all("SELECT * FROM brawls WHERE bot_1_fk = ? OR bot_2_fk = ?", bot_id, bot_id, function(err, rows) {
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
