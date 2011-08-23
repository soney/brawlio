var database = require('./database').database;

database.drop_tables(function() {
	database.create_tables(function() {
		database.close();
		database.set_king(1,
			function() {
				console.log("done");
			});
	});
});
