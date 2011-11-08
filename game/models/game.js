define(function(require) {
require("vendor/underscore");
var constants = require("game/constants")
	, GameConstants = constants.game_constants
	, create_replay = require("game/models/replay")
	, create_projectile = require("game/models/projectile/projectile")
	, create_player_state = require("game/models/player/player_state")
	, create_projectile_state = require("game/models/projectile/projectile_state")
	, create_game_event = require("game/game_events/game_event_factory");
var make_listenable = require('game/util/listenable');

var get_time = function() {
	return (new Date()).getTime();
};

var GameState = function(options) {
	this.start_round = options.round;
	this.start_time  = get_time();
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
	proto.get_moving_object_states = function(round) {
		var round_diff = round - this.start_round;
		return _.map(this.moving_object_states, function(moving_object_state) {
			return {
				position: moving_object_state.get_position_after(round_diff)
				, moving_object: moving_object_state.get_moving_object()
			};
			return moving_object_state.get_position_after(round_diff);
		});
		return this.moving_object_states;
	};
})(GameState);

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
			this.timeout_id = window.setTimeout(this.callback, milliseconds);
		}
	};
	proto.clear_timeout = function() {
		window.clearTimeout(this.timeout_id);
	};
	proto.get_round = function() {
		return this.on_round;
	};
})(RoundListener);

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
	make_listenable(this);
	this.states = [];
	this.round_listeners = [];
	this.replay = create_replay({ game: this });
	this.initialize();
	this.active_projectiles = [];
	this.special_timeouts = {
		'end_game': undefined
		, 'next_interesting_round': undefined	
	};
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
	proto.get_active_projectiles = function() {
		return this.active_projectiles;
	};
	proto.get_active_moving_objects = function() {
		return this.get_living_players().concat(this.get_active_projectiles());
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
		var projectile = create_projectile({
			radius: projectile_radius
			, x0: projectile_x
			, y0: projectile_y
			, theta0: position.theta
			, translational_velocity: {speed: GameConstants.PROJECTILE_SPEED}
			, fired_by: player
		});
		this.active_projectiles.push(projectile);
		var fire_event = create_game_event("player_fired", {
			player: player
			, projectile: projectile
		});
		this.replay.push_game_event(fire_event);
		this.update_state(round, "Fire");
	};
	proto.start = function() {
		this.emit({
			type: "start"
		});
		this.update_state(0, "Game Started");
		if(this.round_limit !== undefined) {
			var self = this;
			this.special_timeouts.end_game = this.on_round(function() {
				self.stop(undefined);
			}, this.round_limit, "End of game");
		}
	};
	proto.stop = function(winner) {
		this.emit({
			type: "end"
			, winner: winner
		});
		this.clear_round_listeners();
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
			var round_listener = new RoundListener({
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
				var time_diff = round_diff * GameConstants.SIM_MS_PER_ROUND;
				round_listener.set_timeout(time_diff);
			}
		});
	};
	proto.get_round = function(time) {
		var last_state = this.peek_state();
		if(last_state === undefined) {
			return 0;
		} else {
			time = time || get_time();
			var time_diff = time - last_state.start_time;
			var round_diff = time_diff / GameConstants.SIM_MS_PER_ROUND;
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
	};
	proto.peek_state = function() {
		return _.last(this.states);
	};

	proto.update_state = function(round, trigger, more_info) {
		console.log(trigger, round);
		this.clear_interesting_round_timeout();
		this.handle_projectile_collisions(round);
		this.push_state({round: round, trigger: trigger, more_info: more_info, moving_object_states: this.create_moving_object_states(round)});
		var rounds_until_next_event = this.rounds_until_next_event(round);
		if(rounds_until_next_event !== false) {
			var next_event_round = round + rounds_until_next_event;
			this.set_interesting_round_timeout(next_event_round);
		}
	};
	proto.set_interesting_round_timeout = function(round) {
		var self = this;
		this.special_timeouts.next_interesting_round = this.on_round(function() {
			self.update_state(round, "Interesting Round");
		}, round, "Update timer");
	};
	proto.clear_interesting_round_timeout = function() {
		if(this.special_timeouts.next_interesting_round !== undefined) {
			this.remove_round_listener(this.special_timeouts.next_interesting_round);
			this.special_timeouts.next_interesting_round = undefined;
		}
	};
	proto.rounds_until_next_event = function(from_round) {
		var map_event_time = this.rounds_until_next_map_event();
		var moving_object_event_time = this.rounds_until_next_moving_object_event();
		if(map_event_time === false) {
			return moving_object_event_time;
		} else if(moving_object_event_time === false) {
			return map_event_time;
		} else {
			return Math.min(map_event_time, moving_object_event_time);
		}
	};

	proto.rounds_until_next_map_event = function() {
		var moving_objects = this.get_active_moving_objects();
		var map = this.get_map();
		var game_state = this.peek_state();

		var self = this;
		var event_times = _(moving_objects)	.chain()
											.map(function(moving_object) {
												var moving_object_state = game_state.get_state_for_moving_object(moving_object);
												var next_event = map.get_next_event(moving_object, moving_object_state);
												return next_event;
											})
											.filter(function(map_event) {
												return map_event !== false;
											})
											.value();
		if(event_times.length === 0) {return false;}
		var next_event_time = Math.min.apply(Math, event_times);
		return next_event_time;
	};
	proto.rounds_until_next_moving_object_event = function() {
		var moving_objects = this.get_active_moving_objects();
		var i,j, len = moving_objects.length;
		var event_times = [];

		for(i = 0; i<len-1; i++) {
			var mo_i = moving_objects[i];
			for(j = i+1; j<len; j++) {
				var mo_j = moving_objects[j];
				
				var event_time = mo_i.get_next_event(mo_j);
				if(event_time !== false) {
					event_times.push(event_time);
				}
			}
		}

		if(event_times.length === 0) {return false;}
		var next_event_time = Math.min.apply(Math, event_times);
		return next_event_time;
	};

	proto.get_replay = function() {
		return this.replay;
	};

	proto.get_relevant_state = function(round) {
		for(var i = this.states.length-1; i>=0; i--) {
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
		return relevant_state.get_moving_object_position_on_round(moving_object, round);
	};

	proto.get_moving_object_states = function(round) {
		var relevant_state = this.get_relevant_state(round);
		if(relevant_state === undefined) {
			return undefined;
		}
		return relevant_state.get_moving_object_states(round);
	};

	proto.create_moving_object_states = function(round) {
		var self = this;
		var start_positions;
		if(round === 0) {
			var map = this.get_map();
			start_positions = _.flatten(map.get_start_positions());
		} else {
			start_positions = _.map(this.get_players(), function(player) {
				return self.get_moving_object_position_on_round(player, round);
			});
		}

		var player_states = _.map(this.get_players(), function(player, index) {
			var start_position = start_positions[index];
			return create_player_state(_.extend({
				moving_object: player
				, x0: start_position.x
				, y0: start_position.y
				, theta0: start_position.theta
				, health: player.get_health()
				, game: self
			}, player.get_state()));
		});
		var projectile_states = _.map(this.get_active_projectiles(), function(projectile, index) {
			var start_position = self.get_moving_object_position_on_round(projectile, round);
			if(start_position === undefined) {
				return create_projectile_state(_.extend({
					moving_object: projectile
					, x0: projectile.x0
					, y0: projectile.y0
					, theta0: projectile.theta0
					, game: self
				}, projectile.get_state()));
			} else {
				return create_projectile_state(_.extend({
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
		var moving_objects = this.get_active_moving_objects();
		var i, len = moving_objects.length;
		var restricted_path = path;
		restricted_path = map.restrict_path(moving_object, restricted_path);
		for(i=0; i<len; i++) {
			var mo = moving_objects[i];
			if(moving_object !== mo) {
				restricted_path = mo.restrict_path(moving_object, restricted_path);
			}
		}

		return restricted_path;
	};

	proto.handle_projectile_collisions = function() {
		var collisions = this.get_projectile_collisions();
		var self = this;
		_.forEach(collisions, function(collision) {
			self.handle_projectile_collision(collision);
		});
	};
	proto.handle_projectile_collision = function(collision) {
		console.log(collision);
	};

	proto.get_projectile_collisions = function() {
		var moving_objects = this.get_active_moving_objects();
		var len = moving_objects.length;
		var collision_pairs = [];
		for(i = 0; i<len-1; i++) {
			var mo_i = moving_objects[i];
			if(mo_i.is("projectile")) {
				for(j = i+1; j<len; j++) {
					var mo_j = moving_objects[j];

					if(mo_i.is_touching(mo_j)) {
						collision_pairs.push(new Collision({
							projectile: mo_i
							, other_object: mo_j
						}));
					}
				}
			}
		}
		return collision_pairs;
	};
})(Game);
return function(options) {
	return new Game(options);
};
});
