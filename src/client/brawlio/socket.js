(function(BrawlIO) {
	BrawlIO.initialize_socket = function(key, callback) {
		var socket = io.connect();

		socket.emit('session_key', key, function() {
			on_socket_ready(callback);
		});

		this.get_user = function(username, callback) {
			if(arguments.length === 1) {
				callback = username;
				username = null;
			}
			socket.emit('get_user', username, function(user) {
				callback(user);
			});
		};

		this.get_users = function(user_ids, callback) {
			socket.emit('get_users', user_ids, function(users) {
				callback(users);
			});
		};

		this.get_bots = function(uid, callback) {
			if(arguments.length === 1) {
				callback = uid;
				uid = null;
			}
			socket.emit('get_user_bots', uid, function(bots) {
				callback(bots);
			});
		};

		this.add_bot = function(name, callback) {
			socket.emit('add_bot', name, function(bot) {
				callback(bot);
			});
		};

		this.set_team_code = function(team_id, code) {
			var team = this.get_team_by_id(team_id);
			team.code = code;
			socket.emit('set_team_code', team_id, code, function() {
				var team = BrawlIO.get_team_by_id(team_id);
				team.code = code;
			});
		};

		this.get_all_bots = function(callback) {
			socket.emit('get_all_bots', function(bots) {
				callback(bots);
			});
		};

		this.get_all_users = function(callback) {
			socket.emit('get_all_users', function(users) {
				callback(users);
			});
		};
	};
	
	var on_socket_ready = function(callback) {
		var has_user = false;
		var has_teams = false;
		var on_got = function() {
			if(has_user && has_teams) {
				callback();
			}
		};
		BrawlIO.get_user(function(user) {
			BrawlIO.set_user(user);
			has_user = true;
			on_got();
		});
		BrawlIO.get_bots(function(bots) {
			BrawlIO.set_bots(bots);
			has_teams = true;
			on_got();
		});
	};
}(BrawlIO));
