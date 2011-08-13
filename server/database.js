var sqlite_path = __dirname+"/../vendor/node-sqlite3";
var sqlite = require(sqlite_path+"/sqlite3").verbose();
var constants = require("./constants");
var db_path = __dirname+"/"+constants.db_name;

var WeightClasses = require("./weight_class");

var Database = function() {};

var DBTeam = function(id, active, weight_class, weight_class_name, code, char_limit, user_fk) {
	this.id = id;
	this.active = active;
	this.weight_class = weight_class;
	this.weight_class_name = weight_class_name;
	this.code = code;
	this.char_limit = char_limit;
	this.user_fk = user_fk;
};

var DBUser = function(id, username, email) {
	this.id = id;
	this.username = username;
	this.email = email;
};

var DBBrawl = function(id, team_1_fk, user_1_fk, team_2_fk, user_2_fk, result, status, replay_filename) {
	this.id = id;
	this.team_1_fk = team_1_fk;
	this.user_1_fk = user_1_fk;
	this.team_2_fk = team_2_fk;
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
	var team_factory = function(options) {
		var team = new DBTeam(options.id, options.active, options.weight_class, options.weight_class_name, options.code, options.char_limit, options.user_fk);
		return team;
	};
	var brawl_factory = function(options) {
		var brawl = new DBBrawl(options.id, options.team_1_fk, options.user_1_fk, options.team_2_fk, options.user_2_fk, options.result, options.status, options.replay_filename)
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
	var teams_from_rows = function(rows) {
		var teams = new Array(rows.length);
		for(var i = 0, len = rows.length; i<len; i++) {
			teams[i] = team_from_row(rows[i]);
		}

		return teams;
	};
	var team_from_row = function(row) {
		var options = {
			id: row.pk
			, active: row.active !== 0
			, weight_class: row.weight_class
			, weight_class_name: WeightClasses.get_name(row.weight_class)
			, code: row.code || ""
			, char_limit: WeightClasses.get_char_limit(row.weight_class)
			, user_fk: row.user_fk
		};
			
		var team = team_factory(options);
		return team;
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
		var commands = ["create_user_table", "create_openid_table", "create_teams_table", "create_brawls_table"];
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
	proto.create_teams_table = function(callback) {
		_database.run("CREATE TABLE teams("
			+ "pk INTEGER PRIMARY KEY UNIQUE"
			+ ", active INTEGER DEFAULT 0"
			+ ", user_fk INTEGER REFERENCES users(pk)"
			+ ", weight_class INTEGER"
			+ ", code TEXT"
			+ ", issues INTEGER DEFAULT 0"
			+ ")", callback);
	};
	proto.create_brawls_table = function(callback) {
		_database.run("CREATE TABLE brawls("
			+ "pk INTEGER PRIMARY KEY UNIQUE"
			+ ", team_1_fk INTEGER REFERENCES teams(pk)"
			+ ", user_1_fk INTEGER REFERENCES users(pk)"
			+ ", team_2_fk INTEGER REFERENCES teams(pk)"
			+ ", user_2_fk INTEGER REFERENCES users(pk)"
			+ ", result INTEGER"
			+ ", status INTEGER"
			+ ", replay_filename TEXT"
			+ ")", callback);
	};

	proto.drop_tables = function(callback) {
		var table_names = ["users", "openid", "teams", "brawls"];
		var table_index = 0;
		
		var self = this;
		(function() {
			if(table_index < table_names.length) {
				var table_name = table_names[table_index];
				table_index++;

				_database.run("DROP TABLE IF EXISTS " + table_name, arguments.callee);
			}
			else {
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

	proto.add_user_with_openid = function(openid_url, callback) {
		//Add the user
		_database.run("INSERT INTO users DEFAULT VALUES", function(error) {
			var id = this.lastID;

			var callback_times = 0;
			var expected_callback_times = 4;
			var meta_callback = function() {
				callback_times++;
				if(callback_times === expected_callback_times) {
					callback(id);
				}
			};

			_database.parallelize(function() {
				//Insert into openid
				_database.run("INSERT INTO openid (openid_url, user_fk) VALUES (?, ?)", [openid_url, id], meta_callback);
				var weight_classes = WeightClasses.enumerate();
				for(var i = 0, len = weight_classes.length; i<len; i++) {
					var weight_class = weight_classes[i];

					_database.run("INSERT INTO teams (active, user_fk, weight_class) VALUES (?, ?, ?)", [0, id, weight_class], meta_callback);
				}
			});
		});
	};

	proto.get_user_with_id = function(id, callback) {
		return this.get_users_with_ids([id], function(result) {
			if(result.length === 1) { callback(result[0]); }
			else {callback(null);}
		});
	};

	proto.get_users_with_ids = function(ids, callback) {
		var condition = ids.length === 0 ? "" : " WHERE " + ids.map(function(id) {
			return "pk = " + id;
		}).join(" OR ");

		_database.all("SELECT * FROM users " + condition + " LIMIT " + ids.length, function(err, rows) {
			if(err) throw err;
			var users = users_from_rows(rows);
			callback(users);
		});
	};

	proto.get_user_with_username = function(username, callback) {
		_database.all("SELECT * FROM users WHERE username==(?) LIMIT 1", username, function(err, rows) {
			if(err) throw err;
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
			sb.push(option_name + " = " + option_value);
		}
		_database.run("UPDATE users SET " + sb.join() + " WHERE pk = "+id, callback);
	};

	proto.get_user_teams = function(user_id, callback) {
		var num_types = WeightClasses.num_types();

		var do_query = function(user_id) {
			_database.all("SELECT * FROM teams WHERE user_fk = " + user_id + " LIMIT " + num_types, function(err, rows) {
				if(err) throw err;
				var teams = teams_from_rows(rows);
				callback(teams);
			});
		};


		if(typeof user_id == "string") {
			_database.all("SELECT pk from users WHERE username==(?) LIMIT 1", [user_id], function(err, rows) {
				if(err) throw err;

				if(rows.length !== 1) {
					callback([]);
					return;
				}
				user_id = rows[0].pk;
				do_query(user_id);
			});

		}
		else {
			do_query(user_id);
		}
	};

	proto.set_team_code = function(team_id, code, issues, callback) {
		_database.run("UPDATE teams SET code = (?), issues = (?) WHERE pk = " + team_id, [code, issues], callback);
	};

	proto.activate_team = function(team_id, callback) {
		_database.run("UPDATE teams SET active = 1 WHERE pk = " + team_id, callback);
	};


	proto.get_teams_with_same_weight_class_as = function(team_id, callback) {
		_database.all("SELECT weight_class from teams where pk==(?) LIMIT 1", [team_id], function(err, rows) {
			if(err) throw err;

			if(rows.length !== 1) {
				callback([]);
				return;
			}
			var weight_class = rows[0].weight_class;
			_database.all("SELECT * from teams where weight_class = (?)", [weight_class], function(err, rows) {
				if(err) throw err;
				var teams = teams_from_rows(rows);

				callback(teams);
			});
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
			if(err) throw err;
			var brawls = brawls_from_rows(rows);
			callback(brawls);
		});
	};

	proto.get_user_brawls = function(user_id, callback) {
		var self = this;
		_database.all("SELECT pk FROM brawls WHERE user_1_fk = ? OR user_2_fk = ?", user_id, user_id, function(err, rows) {
			if(err) throw err;
			var brawl_ids = rows.map(function(row) {
				return row.pk;
			});

			self.get_brawls(brawl_ids, callback);
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

