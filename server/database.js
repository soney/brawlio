var sqlite_path = __dirname+"/../vendor/node-sqlite";
var sqlite = require(sqlite_path+"/sqlite");
var constants = require("./constants");
var db_path = __dirname+"/"+constants.db_name;

require.paths.unshift(".");
var User = require("./user");
var WeightClasses = require("./weight_class");
var Team = require("./team");

var Database = function() {};


(function() {
	// Private memebers
	var _database = undefined;
	var open = function() {
		if(_database) {
			close(_database);
		}
		_database = sqlite.openDatabaseSync(db_path);
		return _database;
	};
	var close = function(db) {
		if(db == null) {
			db = _database;
		}

		db.close();
		_database = undefined;
	};
	var query = function() {
		var db = open();
		var rv = db.query.apply(db, arguments);
		close(db);
		return rv;
	};
	var one_row_query = function() {
		var result = query.apply(this, arguments);

		var rows = result.rows;
		if(rows.length !== 1) {
			return undefined;
		}
		else {
			var row = rows.item(0);
			return row;
		}
	};

	var user_factory = function(options) {
		var user = new User(options.id, options.username, options.email);
		return user;
	};
	var team_factory = function(options) {
		var team = new Team(options.id, options.active, options.weight_class, options.weight_class_name, options.code, options.char_limit, options.user_fk);
		return team;
	};

	// Public members

	//User functions
	this.create_tables = function() {
		this.create_user_table();
		this.create_openid_table();
		this.create_teams_table();
		this.create_brawls_table();
	};

	this.create_openid_table = function() {
		query("CREATE TABLE openid (" +
			"openid_url TEXT PRIMARY KEY UNIQUE, " +
			"user_fk INTEGER REFERENCES users(pk))");
	};
	this.create_user_table = function() {
		query("CREATE TABLE users (" +
			"pk INTEGER PRIMARY KEY UNIQUE, " +
			"username TEXT, " +
			"email TEXT)");
	};
	this.create_teams_table = function() {
		query("CREATE TABLE teams(" +
			"pk INTEGER PRIMARY KEY UNIQUE, " +
			"active INTEGER DEFAULT 0, " +
			"user_fk INTEGER REFERENCES users(pk), " +
			"weight_class INTEGER, " +
			"code TEXT, " +
			"issues INTEGER DEFAULT 0)");
	};
	this.create_brawls_table = function() {
		query("CREATE TABLE brawls(" +
			"pk INTEGER PRIMARY KEY UNIQUE, " +
			"team_1_fk INTEGER REFERENCES teams(pk), " +
			"team_2_fk INTEGER REFERENCES teams(pk), " +
			"code TEXT)");
	};

	this.drop_tables = function() {
		var db = open();
		var table_names = ["users", "openid", "teams", "brawls"];
		table_names.forEach(function(table_name) {
			db.query("DROP TABLE IF EXISTS " + table_name);
		});
		close();
	};

	this.user_key_with_openid = function(openid_url) {
		var row = one_row_query("SELECT user_fk FROM openid WHERE openid_url==(?) LIMIT 1", [openid_url]);
		if(row === undefined) {
			return null;
		}
		else {
			return row.user_fk;
		}
	};

	this.add_user_with_openid = function(openid_url) {
		var db = open();
		//Add the user
		var user_insert = db.query("INSERT INTO users DEFAULT VALUES");
		var id = user_insert.insertId;

		//Insert into openid
		db.query("INSERT INTO openid (openid_url, user_fk) VALUES (?, ?)", [openid_url, id]);

		//Create teams
		var weight_classes = WeightClasses.enumerate();
		for(var i = 0, len = weight_classes.length; i<len; i++) {
			var weight_class = weight_classes[i];

			db.query("INSERT INTO teams (active, user_fk, weight_class) VALUES (?, ?, ?)", [0, id, weight_class]);
		}

		close();
		return id;
	};

	this.get_user_with_id = function(id, callback) {
		return this.get_users_with_ids([id], function(result) {
			if(result.length === 1) { callback(result[0]); }
			else {callback(null);}
		});
	};

	this.get_users_with_ids = function(ids, callback) {
		var condition = ids.map(function(id) {
			return "pk == " + id;
		}).join(" OR ");

		var result = query("SELECT * FROM users WHERE " + condition + " LIMIT " + ids.length);

		var users = this.users_from_rows(result.rows);
		callback(users);
		return;
	};

	this.get_user_with_username = function(username, callback) {
		var row = one_row_query("SELECT * FROM users WHERE username==(?) LIMIT 1", [username]);
		var user = this.user_from_row(row);
		callback(user);
		return;
	};

	this.users_from_rows = function(rows) {
		var users = new Array(rows.length);
		for(var i = 0, len = rows.length; i<len; i++) {
			users[i] = this.user_from_row(rows.item(i));
		}

		return users;
	};
	this.user_from_row = function(row) {
		if(row == null) return null;
		var user = user_factory( {
			id: row.pk
			, username: row.username
			, email: row.email
		});
		return user;
	};

	this.set_user_details = function(id, options) {
		var db = open();

		for(var option_name in options) {
			var option_value = options[option_name];
			db.query("UPDATE users SET "+option_name+" = "+option_value+" WHERE pk = "+id);
		}

		close();
	};

	this.get_user_teams = function(user_id, callback) {
		var num_types = WeightClasses.num_types();
		var db = open();

		if(typeof user_id == "string") {
			var result = db.query("SELECT pk from users WHERE username==(?) LIMIT 1", [user_id]);
			var rows = result.rows;
			if(rows.length !== 1) {
				callback([]);
				return;
			}
			var row = rows.item(0);
			user_id = row.pk;
		}
		var result = db.query("SELECT * FROM teams WHERE user_fk = " + user_id + " LIMIT " + num_types);
		close();

		var teams = this.teams_from_rows(result.rows);
		callback(teams);
		return;
	};

	this.teams_from_rows = function(rows) {
		var teams = new Array(rows.length);
		for(var i = 0, len = rows.length; i<len; i++) {
			teams[i] = this.team_from_row(rows.item(i));
		}

		return teams;
	};
	this.team_from_row = function(row) {
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

	this.set_team_code = function(team_id, code, issues, callback) {
		query("UPDATE teams SET code = (?), issues = (?) WHERE pk = " + team_id, [code, issues]);
		callback();
	};

	this.activate_team = function(team_id, callback) {
		query("UPDATE teams SET active = 1 WHERE pk = " + team_id);
		callback();
	};


	this.get_teams_with_same_weight_class_as = function(team_id, callback) {
		var db = open();
		var result = db.query("SELECT weight_class from teams where pk==(?) LIMIT 1", [team_id]);
		var rows = result.rows;
		if(rows.length !== 1) {
			callback([]);
			return;
		}
		var row = rows.item(0);
		weight_class = row.weight_class;
		result = db.query("SELECT * from teams where weight_class==(?)", [weight_class]);
		close();

		var teams = this.teams_from_rows(result.rows);

		callback(teams);
		return;
	};

	this.get_teams = function(ids, callback) {
		var condition = ids.map(function(id) {
			return "pk == " + id;
		}).join(" OR ");

		var result = query("SELECT * FROM teams WHERE " + condition + " LIMIT " + ids.length);

		var teams = this.teams_from_rows(result.rows);
		callback(teams);
		return;
	};
}).call(Database.prototype);

var db = new Database();
exports.database = db;
