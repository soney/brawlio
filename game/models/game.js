define(function(require) {
	var make_listenable = require('game/util/listenable');
	var create_projectile = require('game/models/projectile');

	var Game = function(options) {
		this.teams = options.team;
		this.map = options.map;
		this.round_limit = options.round_limit;
	/*
		console.log(options);
		this.teams = options.teams;
		this.map = options.map;

		this.round_limit = options.round_limit;
		this.running = false;
		this.rounds_per_ms = 1.0/options.ms_per_round;
		make_listenable(this);
		this.state_start_time = undefined;
		this.state_start_round = undefined;
		this.next_collision_timeout = undefined;
		this.state_starts = [];
		this.initialize();
		*/
	};
/*

	(function(my) {
		var unique_object_id = 0;

		var proto = my.prototype;
		var get_time = function() {
			return (new Date()).getTime();
		};

		proto.initialize = function() {
			this.players = [];
			var id = 0;
			var map = this.get_map();
			var start_positions = map.get_start_positions();
			for(var i = 0, len = this.teams.length; i<len; i++) {
				var team = this.teams[i];
				team.set_id(i);
				var team_players = team.get_players();
				var team_start_positions = start_positions[i];
				for(var j = 0, len_j = team_players.length; j<len_j; j++) {
					var player = team_players[j];
					var player_start_position = team_start_positions[j];
					player.set_game(this);
					player.set_id(unique_object_id);
					this.initialize_player(player);
					this.players.push(player);
					player.set_starting_position(player_start_position);
				}
				unique_object_id++;
			}
		};
		proto.initialize_player = function(player) {
			var self = this;
			player.on("fire", function() {
				self.on_player_fire(player);
			});
		};
		proto.get_players = function() {
			return this.players;
		};
		proto.get_projectiles = function() {
			return this.projectiles;
		};
		proto.get_living_players = function() {
			return this.get_players().filter(function(player) {
				return player.is_alive();
			});
		};
		proto.start = function() {
			this.running = true;
			this.update();
			this.emit({
				type: "start"
			});
		};
		proto.end = function(winner) {
			this.running = false;
			this.emit({
				type: "end"
				, winner: winner
			});
		};
		proto.get_round = function(current_time) {
			if(arguments.length === 0) current_time = get_time();
			var index = this.state_starts.length-1;
			var state_start = this.state_starts[index];
			while(current_time < state_start.time && index >= 0) {
				index -= 1;
				state_start = this.state_starts[index];
			}
			if(index < 0) {
				return undefined;
			} else {
				return state_start.round + (current_time - state_start.time) * this.rounds_per_ms;
			}
		};
		proto.get_map = function() { return this.map; };

		proto.on_player_fire = function(player) {
			var player_position = player.get_position();
			var projectile = new Projectile({source: player, game: this});

			var dist = player.get_radius() + projectile.get_radius();
			projectile.set_position({
				x: player_position.x + dist*Math.cos(player_position.theta)
				, y: player_position.y + dist*Math.sin(player_position.theta)
			});
			projectile.set_velocity(10, player_position.theta);
			this.add_projectile(projectile);
		};
		proto.add_projectile = function(projectile) {
			this.projectiles.push(projectile);
		};
		proto.on_round = function(callback, round) {
			var round_diff = round - this.get_round();
			if(round_diff <= 0) {
				callback(round);
			} else {
				var time_ms = round_diff / this.rounds_per_ms;
				window.setTimeout(function() {
					callback(round);
				} , time_ms);
			}
		};

		proto.update = function(set_round_to) {
			if(this.next_collision_timeout !== undefined) {
				window.clearTimeout(this.next_collision_timeout);
				this.next_collision_timeout = undefined;
			}

			set_round_to = set_round_to || 0;

			this.update_constraining_obstacles(set_round_to);
			this.update_state_variables(set_round_to); // set this.next_collision_time
			if(this.next_update_time !== false) {
				var current_round = this.state_start_round;
				var delay = this.next_update_time/this.rounds_per_ms;

				var desired_round = current_round + this.next_update_time;
				var self = this;
				this.next_collision_timeout = window.setTimeout(function() {
					self.update(desired_round);
				}, delay);
			}
			//if(set_round_to > 1) debugger;
		};

		
		proto.update_state_variables = function(desired_round) {
			var next_collision_time = this.get_next_player_map_collision();
			if(this.state_start_time === undefined || this.state_start_round === undefined) {
				this.state_start_time = get_time();
				this.state_start_round = desired_round;
			} else {
				this.state_start_time = get_time();
				this.state_start_round = desired_round;
			}
			this.state_starts.push({time: this.state_start_time, round: this.state_start_round});

			this.next_update_time = next_collision_time;
		};

		proto.update_constraining_obstacles = function(round) {
			var players = this.get_living_players();
			var map = this.get_map();
			players.forEach(function(player) {
				var touching_obstacles = map.get_constraining_obstacles(player, round);
				player.set_touching_obstacles(touching_obstacles, round);
			});
		};

		proto.get_next_player_map_collision = function() {
			var players = this.get_living_players();
			var map = this.get_map();

			var collision_times = players.map(function(player) {
				var next_collision = map.get_next_collision(player);
				return next_collision;
			}).filter(function(collision) {
				return collision !== false;
			});
			if(collision_times.length === 0) {return false;}
			var next_collision = Math.min.apply(Math, collision_times);
			return next_collision;
		};
	})(Game);

	return Game;
	*/
	return function(options) {
		return new Game(options);
	};
});
