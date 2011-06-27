(function(FistiCode, jQuery) {
	var fc = FistiCode;
	var $ = jQuery;

	function get_time() {
		return (new Date()).getTime();
	}

	var LiveGame = function(attributes, state) {
		this.attributes = $.extend({}, attributes);
		this.state = {
			round: 0
		};
		this.game_log = fc._create_linked_list();
		this.projectiles = fc._create_linked_list();

		if(fc._debug) {
			this.type = "LiveGame";
			fc.assert(this.attributes!=null);
			fc.assert(_.isArray(this.attributes.teams));
			fc.assert(this.attributes.map != null);
		}
	};

	LiveGame.prototype.initialize = function() {
		var self = this,
			attributes = self.attributes,
			map = attributes.map,
			teams = attributes.teams;
		
		_.forEach(map.attributes.starting_points, function(starting_point_array, team_index) {
			var team = teams[team_index];
			_.forEach(starting_point_array, function(starting_point, player_index) {
				if(player_index >= team.players.length) {
					return;
				}

				var player = team.players[player_index];

				player.jump_to(starting_point);
			});
		});

		var team_id = 1;
		_.forEach(teams, function(team) {
			team.id = team_id++;
		});

		var live_players = [];
		for(var i = 0; i < fc.constants.TEAM_SIZE; i++) {
			for(var j = 0, len = teams.length; j < len; j++) {
				var team = teams[j];
				var player = team.players[i];
				live_players.push(player);
			}
		}
		self.state.live_players = live_players;

		var player_controllers = fc._create_quick_dict();
		var id = 1;
		_.forEach(self.state.live_players, function(player) {
			player.join_game(self);
			player.id = id++;
			var controller = fc._create_player_controller(player, self);
			player_controllers.set(player, controller);
		});
		self.player_controllers = player_controllers;

		self.controller = fc._create_game_controller(this);
	};

	LiveGame.prototype.get_elapsed_ms = function() {
		return get_time() - this.start_time;
	};
	LiveGame.prototype.get_round = function() {
		return this.get_elapsed_ms() * 1.0 / fc.constants.MS_PER_ROUND;
	};

	LiveGame.prototype.get_player_controller = function(player) {
		return this.player_controllers.get(player);
	};

	LiveGame.prototype.run = function() {
		this.start_time = get_time();
		//this.round();
	};

	LiveGame.prototype.update = function() {
		var self = this,
			state = self.state,
			attributes = self.attributes,
			live_players = state.live_players,
			map = attributes.map;

		_.forEach(live_players, function(player) {
			player.update();
			//Collision detect
			var position = player.get_position();
			var radius = player.get_radius();
			var map_corrected_position = map.prevent_collision(position, radius);
		});
		self.update_projectiles();
	};

	LiveGame.prototype.round = function() {
		this.update();
		window.setTimeout(_.bind(arguments.callee, self), 2000);
	};

	LiveGame.prototype.update_projectiles = function() {
		var self = this,
			projectiles = self.projectiles;
		projectiles.forEach(function(projectile) {
			var old_position = projectile.get_position();
			projectile.update();
			var new_position = projectile.get_position();
		});

	};

	LiveGame.prototype.add_projectile = function(projectile) {
		this.projectiles.push(projectile);
	};

	fc._create_live_game = function(attributes) {
		var game = new LiveGame(attributes);
		return game;
	};
})(FistiCode, jQuery);
