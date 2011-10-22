define(['game/util/listenable', 'game/models/projectile', 'game/util/brawl_utils'], function(make_listenable, Projectile, distanceFromLineSegment) {
	var Game = function(options) {
		this.teams = options.teams;
		this.map = options.map;

		this.round_limit = options.round_limit;
		this.running = false;
		this.start_time = undefined;
		this.rounds_per_ms = 1.0/options.ms_per_round;
		make_listenable(this);
		this.initialize();
	};

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
			this.start_time = get_time();
			this.running = true;
			this.emit({
				type: "start"
			});
		};
		proto.get_start_time = function() { return this.start_time; };
		proto.end = function(winner) {
			this.running = false;
			this.emit({
				type: "end"
				, winner: winner
			});
		};
		proto.get_round = function(current_time) {
			if(arguments.length === 0) current_time = get_time();
			var time = current_time - this.get_start_time();
			return time * this.rounds_per_ms;
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
				callback();
			} else {
				var time_ms = round_diff / this.rounds_per_ms;
				window.setTimeout(callback, time_ms);
			}
		};

		
		proto.on_moving_object_state_change = function() {
			var next_collision = this.get_next_player_map_collision();
		};

		proto.get_next_player_map_collision = function() {
			var players = this.get_living_players();
			var map = this.get_map();

			players.forEach(function(player) {
				var next_collision = map.get_next_collision(player);
			});
		};
	})(Game);

	return Game;
});
