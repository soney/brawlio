var sqlite_path = __dirname+"/../vendor/node-sqlite";
var sqlite = require(sqlite_path+"/sqlite");
var db_path = __dirname+"/brawlio_db.sqlite3";

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
		var team = new Team(options.id, options.active, options.weight_class, options.weight_class_name, options.code);
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
			"code TEXT)");
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
		var row = one_row_query("SELECT * FROM users WHERE pk==(?) LIMIT 1", [id]);
		if(row !== undefined) {
			var user = user_factory({id: row.pk, username: row.username, email: row.email});
			callback(user);
			return;
		}
		else {
			callback(null);
			return;
		}
	};

	this.get_user_with_username = function(username, callback) {
		var row = one_row_query("SELECT * FROM users WHERE username==(?) LIMIT 1", [username]);

		if(row !== undefined) {
			var user = user_factory({id: row.pk, username: row.username, email: row.email});
			callback(user);
			return;
		}
		else {
			callback(null);
			return;
		}
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

		var rows = result.rows;

		var self = this;
		var teams = [];
		for(var i = 0, len = rows.length; i<len; i++) {
			var row = rows.item(i);

			var options = {
				id: row.pk
				, active: row.active !== 0
				, weight_class: row.weight_class
				, weight_class_name: WeightClasses.get_name(row.weight_class)
				, code: row.code
			};
			
			var team = team_factory(options);
			teams.push(team);
		}

		callback(teams);
		return;
	};

	this.activate_team = function(team_id) {
		query("UPDATE teams SET active = 1 WHERE pk = "+team_id);
	};
}).call(Database.prototype);

var db = new Database();
exports.database = db;
