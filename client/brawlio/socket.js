define(function() {
	require(["vendor/socket.io"], function() {
		(function() {
			var self = this;

			this.initialize_socket = function(key) {
				var socket = io.connect();

				socket.emit('session_key', key, function() {
					on_socket_ready();
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

				this.get_teams = function(username, callback) {
					if(arguments.length === 1) {
						callback = username;
						username = null;
					}
					socket.emit('get_user_teams', username, function(teams) {
						callback(teams);
					});
				};

				this.set_team_code = function(team_id, code) {
					socket.emit('set_team_code', team_id, code, function() {
						var team = self.get_team_by_id(team_id);

						team.code = code;
					});
				};
			};
			
			var on_socket_ready = function() {
				self.get_user(function(user) {
					self.set_user(user);
				});
				self.get_teams(function(teams) {
					self.set_teams(teams);
				});
			};
		}).call(BrawlIO);
	});
});
