var sqlite_path = __dirname+"/../vendor/node-sqlite";
var sqlite = require(sqlite_path+"/sqlite");
var db_path = __dirname+"/brawlio_db.sqlite3";

require.paths.unshift(".");
var User = require("./user");

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
		var user = new User(options.id, options.username);
		return user;
	};

	// Public members

	//User functions
	this.create_tables = function() {
		this.create_user_table();
		this.create_openid_table();
	};
	this.create_user_table = function() {
		query("CREATE TABLE users (" +
			"pk INTEGER PRIMARY KEY, " +
			"username TEXT, " +
			"email TEXT)");
	};
	this.create_openid_table = function() {
		query("CREATE TABLE openid (" +
			"openid_url TEXT PRIMARY KEY, " +
			"user_fk INTEGER)");
	};

	this.drop_tables = function() {
		var db = open();
		var table_names = ["users", "openid"];
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

	/*

	this.create_user = function(username, email, verification) {
		var db = open();
		var result = db.query("SELECT * FROM USERS WHERE username==(?) OR email==(?)", [username, email]);

		var user = undefined;
		if(result.rows.length === 0) {
			var insert = db.query("INSERT INTO users (username, email, verification) VALUES (?,?,?)", [username, email, verification]);
			var id = insert.insertId;
			user = user_factory({id: id, username: username, email: email});
		}
		close();
		return user;
	};
	this.user_exists_with_username = function(username) {
		var result = query("SELECT * FROM USERS WHERE username==(?)", [username]);
		return result.rows.length > 0;
	};
	this.user_exists_with_email = function(email) {
		var result = query("SELECT * FROM USERS WHERE email==(?)", [email]);
		return result.rows.length > 0;
	};
	this.user_exists_with_username_or_email = function(username, email) {
		var result = query("SELECT * FROM USERS WHERE username==(?) OR email==(?)", [username, email]);
		return result.rows.length > 0;
	};
	this.fetch_user_by_id = function(id) {
		var row = one_row_query("SELECT id, username FROM users WHERE id==(?)", [id]);
		if(row === undefined) return null;
		else {
			var user = user_factory({id: row.id, username: row.username});
			return user;
		}
	};
	this.validate_user = function(username, password) {
		var row = one_row_query("SELECT * FROM users WHERE username==(?)", [username]);
		if(row === undefined) {
			return {result: false, explanation: "No such user '"+username+"'"};
		}
		else {
			if(password != row.password) {
				return {result: false, explanation: "Wrong password"};
			}
			else {
				var user = user_factory({id: row.id, username: row.username});
				return {result: true, user: user};
			}
		}
	};
	*/
}).call(Database.prototype);

var db = new Database();
exports.database = db;
