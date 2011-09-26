define(function(require, exports, module) {
	require(["vendor/socket.io"], function() {
		(function() {
			var self = this;

			this.initialize_socket = function(key, callback) {
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

				this.choose_opponents_for_team = function(team_id, callback) {
					socket.emit('choose_opponents_for_team', team_id, function(team_ids) {
						callback(team_ids);
					});
				};

				this.request_formal_brawl = function(my_team_id, opponent_team_id, callback) {
					socket.emit('run_brawl', my_team_id, opponent_team_id, function() {
					});
				};

				this.get_brawls = function(user_id, callback) {
					if(arguments.length === 1) {
						callback = user_id;
						user_id = null;
					}
					socket.emit('get_brawls', user_id, function(brawls) {
						callback(brawls);
					});
				};

				this.get_brawl = function(brawl_id, callback) {
					socket.emit('get_brawl', brawl_id, function(brawl) {
						callback(brawl);
					});
				};

				socket.on("brawl_done", function(brawl_id) {
					var brawl = BrawlIO.get_brawl(brawl_id, function(brawl) {
						BrawlIO.emit({
							type: "brawl_done"
							, brawl: brawl
						});
					});
				});

				this.get_king_code = function(callback) {
					socket.emit('get_king_code', function(code) {
						callback(code);
					});
				};
				this.claim_crown = function(callback) {
					socket.emit('claim_crown', function() {
						if(callback) {
							callback();
						}
					});
					$(".crown").show();
				};
				this.check_is_king = function(callback) {
					socket.emit('is_king', function(is_king) {
						callback(is_king);
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
				self.get_user(function(user) {
					self.set_user(user);
					has_user = true;
					on_got();
				});
				self.get_teams(function(teams) {
					self.set_teams(teams);
					has_teams = true;
					on_got();
				});
				var check_if_king = function() {
					BrawlIO.check_is_king(function(is_king) {
						if(is_king) {
							$(".crown").show();
						} else {
							$(".crown").hide();
						}
					});
				};
				check_if_king();
				window.setInterval(check_if_king, 10000);
			};
		}).call(BrawlIO);
	});
});
