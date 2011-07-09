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
			};
			
			var on_socket_ready = function() {
				self.get_user(function(user) {
					self.db_do("set_username", user.username);
				});
				self.get_teams(function(teams) {
					self.db_do("set_teams", teams);
				});
			};
		}).call(BrawlIO);
	});
});
