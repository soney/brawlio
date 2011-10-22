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


		//Update functions
		proto.update = function() {
			//this.do_update();
			//this.emit({
			//	type: "update"
			//});
		};
		proto.do_update = function() {
			if(!this.running) return false;

			var round = this.get_round();
			if(this.round_limit > 0 && round >= this.round_limit) {
				this.end(null);
				return false;
			} else if(this.teams[0].is_dead()) {
				this.end(this.teams[1]);
				return false;
			} else if(this.teams[1].is_dead()) {
				this.end(this.teams[0]);
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
			var projectile_left_map = this.map.projectile_left(projectile, old_pos, new_pos);
			var projectile_hit_player = false;

			if(!projectile_left_map) {
				var player = this.projectile_hit_player(projectile, old_pos, new_pos);
				if(player !== false) {
					player.remove_health(1);
					projectile_hit_player = true;
				}
			}
			if(projectile_left_map || projectile_hit_player) {
				for(var i = 0, len = this.projectiles.length; i<len; i++) {
					if(this.projectiles[i]===projectile) {
						this.projectiles.splice(i, 1);
						return;
					}
				}
			} else {
				projectile.set_position(new_pos);
			}
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
					, number: player.get_number()
					, team_id: player.get_team().id
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
		proto.projectile_hit_player = function(projectile, old_pos, new_pos) {
			var source = projectile.get_source();
			var delta_x = new_pos.x - old_pos.x;
			var delta_y = new_pos.y - old_pos.y;
			var m = delta_y/delta_x;
			var b = new_pos.y - m*new_pos.x;

			var denom = Math.sqrt(m*m+1);
			var projectile_radius = projectile.get_radius();
			var living_players = this.get_living_players();
			for(var i = 0, len = living_players.length; i<len; i++) {
				var player = living_players[i];
				if(player === source) continue;
				var distance = distanceFromLineSegment({x: player.get_x(), y: player.get_y()}, old_pos, new_pos);
				var closest_distance = distance.segment;
				if(closest_distance < player.get_radius() + projectile_radius) {
					return player;
				}
			}

			return false;
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
		
	})(Game);

	return Game;
});
