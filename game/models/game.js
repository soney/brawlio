define(['game/util/listenable', 'game/models/projectile'], function(make_listenable, Projectile) {
	var Game = function(options) {
		this.teams = options.teams;
		this.map = options.map;
		this.projectiles = [];

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
				var team_players = team.get_players();
				var team_start_positions = start_positions[i];
				for(var j = 0, len_j = team_players.length; j<len_j; j++) {
					var player = team_players[j];
					var player_start_position = team_start_positions[j];
					player.set_game(this);
					player.set_id(unique_object_id);
					player._set_x(player_start_position.x);
					player._set_y(player_start_position.y);
					player._set_theta(player_start_position.theta);
					this.initialize_player(player);
					this.players.push(player);
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
			this.update();
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
			var projectile = new Projectile();

			var dist = player.get_radius() + projectile.get_radius();
			projectile.set_position({
				x: player_position.x + dist*Math.cos(player_position.theta)
				, y: player_position.y + dist*Math.sin(player_position.theta)
			});
			projectile.set_velocity(1, player_position.theta);
			projectile.set_game(this);
			this.add_projectile(projectile);
		};
		proto.add_projectile = function(projectile) {
			this.projectiles.push(projectile);
		};


		//Update functions
		proto.update = function() {
			this.do_update();
			this.emit({
				type: "update"
			});
		};
		proto.do_update = function() {
			if(!this.running) return false;

			var round = this.get_round();
			if(this.round_limit > 0 && round >= this.round_limit) {
				this.end(null);
				return false;
			} else if(this.teams[0].is_dead()) {
				this.end_game(this.teams[1]);
				return false;
			} else if(this.teams[1].is_dead()) {
				this.end_game(this.teams[0]);
				return false;
			}

			var self = this;
			this.get_living_players().forEach(function(player) {
				self.update_player(player);
			});
			this.get_projectiles().forEach(function(projectile) {
				self.update_projectile(projectile);
			});
			for(var i = 0, len = this.projectiles.length; i<len; i++) {
				var projectile = this.projectiles[i];
				if(projectile == null) continue;
				this.update_projectile(projectile);
			}
			return true;
		};
		proto.update_player = function(player) {
			var old_pos = player.get_position();
			var new_pos = this.check_player_collisions(this.map.check_bounds(old_pos, player.get_updated_position(), player));
			player.set_updated_position(new_pos);
		};

		proto.update_projectile = function(projectile) {
			var old_pos = projectile.get_position();
			var new_pos = projectile.get_updated_position();
			projectile.set_position(new_pos);
		};
		proto.check_player_collisions = function(new_pos) {
			return new_pos;
		};

		proto.get_snapshot = function() {
			var players = this.get_players().map(function(player) {
				var position = player.get_position();
				return {
					x: position.x
					, y: position.y
					, theta: position.theta
					, player: player
				};
			});
			var projectiles = this.projectiles.map(function(projectile) {
				var position = projectile.get_position();
				return {
					x: position.x
					, y: position.y
					, projectile: projectile
				};
			});

			var data = {
				round: this.get_round()
				, players: players
				, projectiles: projectiles
				, map: {
					width: this.map.attributes.width
					, height: this.map.attributes.height
				}
			};
			return data;
		};
	})(Game);

	return Game;
});
