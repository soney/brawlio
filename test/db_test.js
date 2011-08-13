exports.run = function(db, callback) {
		db.get_user_brawls(2, function(brawls) {
			console.log(brawls);
			callback();
		});
/*
		db.get_user_teams(1, function(teams) {
			console.log(teams);
			callback();
		});
/*
		db.get_user_with_id(1, function(user) {
			console.log(user);
			callback();
		});
/*
		db.set_user_details(1, {username:"'soney'", email:"'swloney@gmail.com'"}, function() {
			callback();
		});
/*
		db.add_user_with_openid("blah", function() {
			callback();
		});
		/*
		db.user_key_with_openid("blah", function(user_id) {
			console.log(user_id);
			callback();
		});
		*/
};
