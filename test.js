#!/usr/bin/env node

var database = require('./server/database').database;
var db_test = require('./test/db_test');


var close_db = function() {
	database.close();
}

db_test.run(database, close_db);
