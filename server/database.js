var sqlite_path = __dirname+"/../vendor/node-sqlite";
var sqlite = require(sqlite_path+"/sqlite");
var db_path = "./brawlio_db.sqlite3";

require.paths.unshift(".");
var User = require("user");

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
	};
	this.create_user_table = function() {
		query("CREATE TABLE users (" +
			"id INTEGER PRIMARY KEY, " +
			"username TEXT, " +
			"password TEXT)");
	};

	this.drop_tables = function() {
		var db = open();
		var table_names = ["users"];
		table_names.forEach(function(table_name) {
			db.query("DROP TABLE IF EXISTS " + table_name);
		});
		close();
	};

	this.create_user = function(username, password) {
		var insert = query("INSERT INTO users (username, password) VALUES (?,?)", [username, password]);
		var id = insert.insertId;

		var user = user_factory({id: id, username: username});
		return user;
	};
	this.user_exists_with_username = function(username) {
		var result = query("SELECT * FROM USERS WHERE username==(?)", [username]);
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
				return user;
			}
		}
	};
}).call(Database.prototype);

exports.BIODB = Database;

var db = new Database();
db.drop_tables();
db.create_tables();
console.log(db.user_exists_with_username("soney"));
var user = db.create_user("soney", "adobe");
console.log(db.validate_user("soney", "adobe"));
console.log(db.user_exists_with_username("soney"));
