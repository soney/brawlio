var database = require('./database').database;

database.drop_tables(function() {
	database.create_tables(function() {
		database.close();
	});
});
