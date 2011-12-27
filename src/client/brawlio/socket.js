(function(BrawlIO) {
	BrawlIO.initialize_socket = function(callback) {
		var socket = io.connect();

		socket.on('connect', function() {
			on_socket_ready(callback);
		});

		socket.on('disconnect', function(disconnect_type) {
			if(disconnect_type === "booted") {
				//They went somewhere else....don't display an error
				return;
			}
			var delay = 10000;
			var redirect_timeout = window.setTimeout(function() {
				window.location = "/";
			}, delay);
			var redirect_time = (new Date()).getTime() + delay;
			var get_seconds_until_redirect = function () {
				var time = (new Date()).getTime();
				return Math.round((redirect_time - time)/1000);
			};

			var update_in_seconds_interval = window.setInterval(function() {
				in_seconds.text(get_seconds_until_redirect());
			}, 1000);

			var in_seconds = $("<span />").text(get_seconds_until_redirect());
			$("<div />").html("Our server seems to have gone down. Sorry.<hr />Hit 'ESC' or we will redirect you in ").append(in_seconds).append(" seconds.").dialog({
				modal: true
				, resizable: false
				, draggable: false
				, title: "Disconnected"
				, close: function() {
					window.clearTimeout(redirect_timeout);
					window.clearInterval(update_in_seconds_interval);
				}
				, closeText: 'close'
			});
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

		this.set_bot_code = function(bot_id, code) {
			var bot = this.get_bot_by_id(bot_id);
			bot.code = code;
			socket.emit('set_bot_code', bot_id, code, function() {
				var bot = BrawlIO.get_bot_by_id(bot_id);
				bot.code = code;
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

		this.on_brawl_run = function(team1_id, team2_id, winner_id, game_log, callback) {
			socket.emit('brawl_result', team1_id, team2_id, winner_id, game_log, function() {
				callback();
			});
		};

		this.get_game_log = function(brawl_id, callback) {
			socket.emit('game_log', brawl_id, function(game_log_str) {
				var game_log = BrawlIO.create("game_log_from_string", game_log_str);
				callback(game_log);
			});
		};
		this.get_bot_brawls = function(bot_id, limit, callback) {
			socket.emit('bot_brawls', bot_id, limit, function(brawls) {
				callback(brawls);
			});
		};

		socket.on("brawl_run", function(event) {
			var brawl = event.brawl;
			BrawlIO.add_brawl(brawl);
		});
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
