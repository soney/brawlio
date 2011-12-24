(function(BrawlIO) {
var _ = BrawlIO._;
var error_tolerance = 0.00001;

var GameState = function(options) {
	this.start_round = options.round;
	this.start_time  = BrawlIO.get_time();
	this.trigger_action = options.trigger;
	this.end_round = undefined;
	this.moving_object_states = options.moving_object_states;
};
(function(my) {
var proto = my.prototype;
	proto.set_end_round = function(round) {
		this.end_round = round;
	};
	proto.is_relevant_to_round = function(round) {
		return round >= this.start_round && (this.end_round === undefined || round < this.end_round);
	};
	proto.get_state_for_moving_object = function(moving_object) {
		var i, len = this.moving_object_states.length;
		for(i=0;i<len;i++) {
			var moving_object_state = this.moving_object_states[i];
			if(moving_object_state.get_moving_object() === moving_object) {
				return moving_object_state;
			}
		}
		return undefined;
	};
	proto.get_moving_object_position_on_round = function(moving_object, round) {
		var moving_object_state = this.get_state_for_moving_object(moving_object);
		if(moving_object_state === undefined) {
			return undefined;
		}

		var round_delta = round - this.start_round;
		return moving_object_state.get_position_after(round_delta);
	};
	proto.get_moving_object_states = function(round, include_paths) {
		var round_diff = round - this.start_round;
		return _.map(this.moving_object_states, function(moving_object_state) {
			var moving_object = moving_object_state.get_moving_object();
			var rv = {
				position: moving_object_state.get_position_after(round_diff)
				, moving_object: moving_object
			};
			if(moving_object.is("player")) {
				rv.health = moving_object_state.get_health();
			}
			if(include_paths) {
				rv.path = moving_object_state.path;
			}
			return rv;
		});
	};
}(GameState));

var RoundListener = function(options) {
	this.on_round = options.on_round;
	this.callback = options.callback;
	this.description = options.description;
	this.timeout_id = undefined;
	this.for_state = undefined;
};
(function(my) {
	var proto = my.prototype;
	proto.set_timeout = function(milliseconds) {
		if(milliseconds < 0) {
			this.callback();
		} else {
			this.timeout_id = setTimeout(this.callback, milliseconds);
		}
	};
	proto.clear_timeout = function() {
		clearTimeout(this.timeout_id);
	};
	proto.get_round = function() {
		return this.on_round;
	};
}(RoundListener));

var ProjectileCollision = function(options) {
	this.projectile = options.projectile;
	this.other_object = options.other_object;
};
(function(my) {
	var proto = my.prototype;
	proto.get_projectile = function() { return this.projectile; };
	proto.get_other_object = function() { return this.other_object; };
}(ProjectileCollision));

var Game = function(options) {
	this.teams = options.teams;
	this.map = options.map;
	this.round_limit = options.round_limit;
	BrawlIO.make_listenable(this);
	this.states = [];
	this.round_listeners = [];
	this.replay = BrawlIO.create("replay", { game: this });
	this.initialize();
	this.active_projectiles = [];
	this.special_timeouts = {
		'end_game': undefined
		, 'next_interesting_round': undefined	
	};
	this.running = false;
	this.debug_mode = options.debug_mode === true;
};
(function(my) {
	var proto = my.prototype;
	proto.initialize = function() {
		var self = this;
		_.map(this.get_players(), function(player) {
			self.initialize_player(player);
		});
	};
	proto.initialize_player = function(player) {
		var self = this;
		player.set_game(this);
		player.on("state_change", function(event) {
			var round = event.round;
			var trigger = event.change_type;
			self.update_state(round, trigger);
		});
		player.on("fire", function(event) {
			if(event.fired) {
				var round = event.round;
				self.on_player_fire(player, round);
			}
		});
	};
	proto.get_players = function() {
		return _(this.teams).chain()
							.map(function(team) {
								return team.get_players();
							})
							.flatten()
							.value();
	};
	proto.get_living_players = function() {
		return _.filter(this.get_players(), function(player) {
			return player.is_alive();
		});
	};
	proto.check_for_collision = function() {
		var round = this.get_round();
		if(this.has_projectile_collision(round)) {
			this.update_state(round, "Hackey projectile collision detection");
		}
	};
	
	proto.get_projectiles = function() {
		return this.active_projectiles;
	};
	proto.add_projectile = function(projectile, round) {
		this.active_projectiles.push(projectile);
		var fire_event = BrawlIO.create("player_fired_event", {
			fired_by: projectile.get_fired_by()
			, projectile: projectile
			, round: round
		});
		this.replay.push_game_event(fire_event);
		this.update_state(round, "Fire");
	};
	proto.remove_projectile = function(projectile, round) {
		var index = _.indexOf(this.active_projectiles, projectile);
		if(index >= 0) {
			this.active_projectiles.splice(index, 1);
		}
		var projectile_hit_event = BrawlIO.create("player_hit_event", {
			projectile: projectile
			, round: round
		});
		this.replay.push_game_event(projectile_hit_event);
		this.update_state(round, "Projectile hit");
	};

	proto.get_active_moving_objects = function() {
		return this.get_living_players().concat(this.get_projectiles());
	};

	proto.on_player_fire = function(player, round) {
		var position = this.get_moving_object_position_on_round(player, round);
		var player_radius = player.get_radius();
		var projectile_radius = 1;
		var radius = player_radius + projectile_radius;
		var dx = radius * Math.cos(position.theta);
		var dy = radius * Math.sin(position.theta);
		var projectile_x = position.x + dx;
		var projectile_y = position.y + dy;
		var projectile = BrawlIO.create("projectile", {
			radius: projectile_radius
			, x0: projectile_x
			, y0: projectile_y
			, theta0: position.theta
			, translational_velocity: {speed: BrawlIO.game_constants.PROJECTILE_SPEED}
			, fired_by: player
		});
		this.add_projectile(projectile, round);
	};

	proto.start = function() {
		var self = this;
		this.running = true;
		this.update_state(0, "Game Started");
		if(this.round_limit !== undefined) {
			var round_limit = this.round_limit;
			this.special_timeouts.end_game = this.on_round(function() {
				self.stop(undefined, round_limit);
			}, round_limit, "End of game");
		}
		this.emit({
			type: "start"
		});
	};

	proto.stop = function(winner, round) {
		if(round === undefined) {
			round = this.get_round();
		}

		this.clear_round_listeners();
		var last_round = Math.min(this.get_round(), this.get_round_limit());
		this.replay.set_last_round(last_round);
		this.replay.mark_complete(winner);
		this.running = false;
		var last_state = this.peek_state();
		this.push_state({round: round, trigger: "Game end", moving_object_states: this.create_moving_object_states(round)});
		if(last_state !== undefined) {
			last_state.set_end_round(round);
		}

		this.emit({
			type: "end"
			, winner: winner
		});
	};

	proto.get_round_limit = function() {
		return this.round_limit;
	};

	proto.get_map = function() {
		return this.map;
	};

	proto.on_round = function(callback, round, description) {
		var round_diff = round - this.get_round();
		if(round_diff <= 0) {
			callback(round);
			return undefined;
		} else {
			var self = this;
			var round_listener;
			round_listener = new RoundListener({
				on_round: round
				, callback: function() {
					self.remove_round_listener(round_listener);
					callback(round);
				}
				, description: description
			});
			this.round_listeners.push(round_listener);
			this.update_round_listeners();
			return round_listener;
		}
	};

	proto.remove_round_listener = function(round_listener) {
		round_listener.clear_timeout();
		this.round_listeners = _.without(this.round_listeners, round_listener);
	};

	proto.clear_round_listeners = function() {
		_.forEach(this.round_listeners, function(round_listener) {
			round_listener.clear_timeout();
		});
		this.round_listeners = [];
	};

	proto.update_round_listeners = function() {
		var self = this;
		var latest_state = this.peek_state();
		_.forEach(this.round_listeners, function(round_listener) {
			if(round_listener.for_state !== latest_state) {
				round_listener.for_state = latest_state;
				round_listener.clear_timeout();
				var round_diff = round_listener.get_round() - self.get_round();
				var time_diff = round_diff * BrawlIO.game_constants.SIM_MS_PER_ROUND;
				round_listener.set_timeout(time_diff);
			}
		});
	};

	proto.get_round = function(time) {
		var last_state = this.peek_state();
		if(last_state === undefined) {
			return 0;
		} else {
			time = time || BrawlIO.get_time();
			var time_diff = time - last_state.start_time;
			var round_diff = time_diff / BrawlIO.game_constants.SIM_MS_PER_ROUND;
			return last_state.start_round + round_diff;
		}
	};

	proto.push_state = function(options) {
		var round = options.round;
		var last_state = this.peek_state();
		if(last_state !== undefined) {
			last_state.set_end_round(round);
		}
		var new_state = new GameState(options);
		this.states.push(new_state);
		this.update_round_listeners();
		return new_state;
	};

	proto.peek_state = function() {
		return _.last(this.states);
	};

	proto.update_state = function(round, trigger, more_info) {
		var new_state, next_event, next_event_round;
		/*
		if(this.debug_mode) {
			console.log("------", round, trigger, "------");
		}
		*/
		this.clear_interesting_round_timeout();
		if(!this.running) {
			return;
		}
		this.handle_projectile_collisions(round);
		new_state = this.push_state({round: round, trigger: trigger, more_info: more_info, moving_object_states: this.create_moving_object_states(round)});
		next_event = this.get_next_touch_event();
		if(next_event !== false) {
			next_event_round = round + next_event.time;
			this.set_interesting_round_timeout(next_event_round, next_event);
		}
		var last_valid_round = round;
		if(this.debug_mode) {
			last_valid_round = next_event_round || round; //This way, the replay can peek ahead
		}
		this.replay.set_last_round(last_valid_round);
	};

	proto.set_interesting_round_timeout = function(round, event) {
		var self = this;
		this.special_timeouts.next_interesting_round = this.on_round(function() {
			self.update_state(round, "Interesting Round ("+event.event_type+")");
		}, round, "Update timer");
	};

	proto.clear_interesting_round_timeout = function() {
		if(this.special_timeouts.next_interesting_round !== undefined) {
			this.remove_round_listener(this.special_timeouts.next_interesting_round);
			this.special_timeouts.next_interesting_round = undefined;
		}
	};

	proto.get_next_touch_event = function() {
		var map_event = this.get_next_map_event();
		var moving_object_event= this.get_next_moving_object_event();
		if(map_event === false) {
			return moving_object_event;
		} else if(moving_object_event=== false) {
			return map_event;
		} else {
			if(map_event.time < moving_object_event.time) {
				return map_event;
			} else {
				return moving_object_event;
			}
		}
	};

	proto.get_next_map_event = function() {
		var moving_objects = this.get_active_moving_objects();
		var map = this.get_map();
		var game_state = this.peek_state();

		var touch_events = _(moving_objects)	.chain()
												.map(function(moving_object) {
													var moving_object_state = game_state.get_state_for_moving_object(moving_object);
													var next_event = map.get_next_event(moving_object, moving_object_state);
													return next_event;
												})
												.without(false)
												.value();
		var next_touch_event = false;
		touch_events.forEach(function(touch_event) {
			if(next_touch_event === false || touch_event.time < next_touch_event.time) {
				next_touch_event = touch_event;
			}
		});
		if(next_touch_event === false) { return false; }
		else { return next_touch_event; }
	};
	proto.get_next_moving_object_event = function() {
		var moving_objects = this.get_active_moving_objects();
		var game_state = this.peek_state();
		var i,j, len = moving_objects.length;
		var events = [];

		for(i = 0; i<len-1; i++) {
			var mo_i = moving_objects[i];
			var mo_i_state = game_state.get_state_for_moving_object(mo_i);
			for(j = i+1; j<len; j++) {
				var mo_j = moving_objects[j];
				if(mo_i.can_collide_with(mo_j)) {
					var mo_j_state = game_state.get_state_for_moving_object(mo_j);
					
					var event = mo_i_state.get_next_event(mo_j_state);
					if(event !== false) {
						events.push(event);
					}
				}
			}
		}

		var next_event = false;
		events.forEach(function(event) {
			if(next_event === false || event.time < next_event.time) {
				next_event = event;
			}
		});
		if(next_event === false) { return false; }
		else { return next_event; }
	};

	proto.get_replay = function() {
		return this.replay;
	};

	proto.get_relevant_state = function(round) {
		var i;
		for(i = this.states.length-1; i>=0; i--) {
			var state = this.states[i];
			if(state.is_relevant_to_round(round)) {
				return state;
			}
		}
		return undefined;
	};

	proto.get_moving_object_position_on_round = function(moving_object, round) {
		var relevant_state = this.get_relevant_state(round);
		if(relevant_state === undefined) {
			return undefined;
		}
		var rv = relevant_state.get_moving_object_position_on_round(moving_object, round);
		if(rv === undefined) { //Perhaps the state hasn't been created yet for the object
			if(moving_object.is("projectile")) {
				return {
					x: moving_object.x0
					, y: moving_object.y0
					, theta: moving_object.theta0
				};
			}
		}
		return rv;
	};

	proto.get_moving_object_states = function(round) {
		var relevant_state = this.get_relevant_state(round);
		if(relevant_state === undefined) {
			return undefined;
		}
		var include_paths = true;
		return relevant_state.get_moving_object_states(round, include_paths);
	};

	proto.create_moving_object_states = function(round) {
		var self = this;
		var start_positions;
		if(round === 0) {
			var map = this.get_map();
			start_positions = _.flatten(map.get_start_positions());
		} else {
			start_positions = _.map(this.get_living_players(), function(player) {
				return self.get_moving_object_position_on_round(player, round);
			});
		}

		var player_states = _.map(this.get_living_players(), function(player, index) {
			var start_position = start_positions[index];
			return BrawlIO.create("player_state", _.extend({
				moving_object: player
				, x0: start_position.x
				, y0: start_position.y
				, theta0: start_position.theta
				, health: player.get_health()
				, game: self
			}, player.get_state()));
		});

		var projectile_states = _.map(this.get_projectiles(), function(projectile, index) {
			var start_position = self.get_moving_object_position_on_round(projectile, round);
			if(start_position === undefined) {
				return BrawlIO.create("projectile_state", _.extend({
					moving_object: projectile
					, x0: projectile.x0
					, y0: projectile.y0
					, theta0: projectile.theta0
					, game: self
				}, projectile.get_state()));
			} else {
				return BrawlIO.create("projectile_state", _.extend({
					moving_object: projectile
					, x0: start_position.x
					, y0: start_position.y
					, theta0: start_position.theta
					, game: self
				}, projectile.get_state()));
			}
		});

		return player_states.concat(projectile_states);
	};

	proto.restrict_path = function(moving_object, path) {
		var map = this.get_map();
		var restricted_path = path;
		restricted_path = map.restrict_path(moving_object, restricted_path);

		return restricted_path;
	};

	proto.handle_projectile_collisions = function(round) {
		var collisions = this.get_projectile_collisions(round);
		var self = this;

		_.forEach(collisions, function(collision) {
			self.handle_projectile_collision(collision, round);
		});
	};
	proto.handle_projectile_collision = function(collision, round) {
		var projectile = collision.projectile;
		var other_object = collision.other_object;
		if(other_object === this.get_map()) {
			this.remove_projectile(projectile, round);
		} else if(other_object.is("player")) {
			this.remove_projectile(projectile, round);
			other_object.remove_health(BrawlIO.game_constants.PROJECTILE_DAMAGE);
			var self = this;
			//Defer the check game over call....we might be in the middle of an update timer
			_.defer(function() {
				self.check_game_over(round);
			});
		} else if(other_object.is("projectile")) {
			this.remove_projectile(projectile, round);
			this.remove_projectile(other_object, round);
		}
	};

	proto.get_projectile_collisions = function(round) {
		var moving_objects = this.get_active_moving_objects();
		var len = moving_objects.length;
		var collision_pairs = [];
		var map = this.get_map();
		var self = this;
		var i,j;
		var moving_object_positions = _.map(moving_objects, function(moving_object) {
			return self.get_moving_object_position_on_round(moving_object, round);
		});
		for(i = 0; i<len; i++) {
			var mo_i = moving_objects[i];
			if(mo_i.is("projectile")) {
				var position = moving_object_positions[i];
				if(map.is_touching(mo_i, position)) {
					collision_pairs.push(new ProjectileCollision({
						projectile: mo_i
						, other_object: map
					}));
				}
				for(j = 0; j<len; j++) {
					if(i !== j) {
						var mo_j = moving_objects[j];
						if(mo_i.can_collide_with(mo_j)) {
							var pos_i = moving_object_positions[i];
							var pos_j = moving_object_positions[j];
							if(Math.pow(pos_i.x - pos_j.x, 2) + Math.pow(pos_i.y - pos_j.y, 2) <= Math.pow(mo_i.get_radius() + mo_j.get_radius(), 2) + error_tolerance) {
								collision_pairs.push(new ProjectileCollision({
									projectile: mo_i
									, other_object: mo_j
								}));
							}
						}
					}
				}
			}
		}
		return collision_pairs;
	};
	var error_tolerance = 0.00001;
	proto.has_projectile_collision = function(round) {
		round = round || this.get_round();
		var moving_objects = this.get_active_moving_objects();
		var len = moving_objects.length;
		var self = this;
		var i, j;
		var moving_object_positions = _.map(moving_objects, function(moving_object) {
			return self.get_moving_object_position_on_round(moving_object, round);
		});
		for(i = 0; i<len; i++) {
			var mo_i = moving_objects[i];
			if(mo_i.is("projectile")) {
				for(j = 0; j<len; j++) {
					if(i !== j) {
						var mo_j = moving_objects[j];
						if(mo_i.can_collide_with(mo_j)) {
							var pos_i = moving_object_positions[i];
							var pos_j = moving_object_positions[j];
							if(Math.pow(pos_i.x - pos_j.x, 2) + Math.pow(pos_i.y - pos_j.y, 2) <= Math.pow(mo_i.get_radius() + mo_j.get_radius(), 2) + error_tolerance) {
								return true;
							}
						}
					}
				}
			}
		}
		return false;
	};

	proto.check_game_over = function(round) {
		var living_players = this.get_living_players();
		var living_team, i, len = living_players.length;

		for(i = 0; i<len; i++) {
			var player = living_players[i];
			var team = player.get_team();
			if(living_team === undefined) {
				living_team = team;
			} else if(living_team !== team) {
				return false;
			}
		}
		//Only one team left
		this.stop(living_team, round);
	};

	proto.log = function(args, player, round) {
		this.do_log("log", args, player, round);
	};

	proto.error = function(args, player, round) {
		this.do_log("error", args, player, round);
	};

	proto.do_log = function(type, args, player, round) {
		var log_event = BrawlIO.create("console_event", {
			args: args
			, player: player
			, type: type
		});
		this.replay.push_game_event(log_event);
	};
}(Game));

BrawlIO.define_factory("game", function(options) {
		return new Game(options);
	});
}(BrawlIO));
