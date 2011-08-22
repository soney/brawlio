var is_node = typeof importScripts === "undefined";
if(is_node) {
	var actions = require(__dirname+'/actions');
	var Actions = actions.Actions;

	var utils = require(__dirname+'/util/worker_utils');
	var Hash = utils.Hash;
	var CONST = utils.CONST;

	var brawl_utils = require(__dirname+'/util/brawl/brawl_utils');
	var distanceFromLineSegment = brawl_utils.distanceFromLineSegment;
}
else {
	importScripts('game/workers/actions.js');
	importScripts('game/workers/util/worker_utils.js');
	importScripts('game/workers/util/brawl/brawl_utils.js');
}

var post = function() {
	if(is_node) {
		return postMessage.apply(self, arguments);
	} else {
		return self.postMessage.apply(self, arguments);
	}
};

var Team = function(options) {
	this.game = options.game;
	this.id = options.model.id;
	var self = this;
	this.players = options.model.player_models.map(function(player_model) {
		return new Player({game: self.game, team: self, model: player_model});
	});
};
(function() {
	this.is_alive = function() {
		for(var i = 0, len = this.players.length; i<len; i++) {
			if(this.players[i].is_alive()) return true;
		}
		return false;
	};
	this.is_dead = function() { return !this.is_alive(); };
	this.get_players = function() { return this.players; };
}).call(Team.prototype);


var Player = function(options) {
	this.team = options.team;
	this.game = options.game;
	this.id = options.model.id;
	this.attributes = options.model.attributes;
	this.actions = [];
	this.x = -1;
	this.y = -1;
	this.theta = 0;
	this.health = this.get_max_health();
	this.last_fired_round = null;
	this.last_update = null;
	this.movement_speed = this.get_max_movement_speed();
	this.rotation_speed = this.get_max_rotation_speed();
	this.auto_fire = false;
	this.max_firing_angle_offset = Math.PI/8;
};
(function() {
	var ROUNDS_BETWEEN_FIRING = 1;
	var ceil = function(x, max) {
		if(x == null) {
			return max;
		} else {
			var limited_val = Math.min(Math.abs(x), max); 
			if(x < 0) {
				return -1 * limited_val;
			} else {
				return limited_val;
			}
		}
	};

	this.set_rotation_speed = function(speed) {
		this.rotation_speed = ceil(speed, this.get_max_rotation_speed());
	};
	this.set_movement_speed = function(speed) {
		this.movement_speed = ceil(speed, this.get_max_movement_speed());
	};
	this.get_rotation_speed = function() { return this.rotation_speed; };
	this.get_movement_speed = function() { return this.movement_speed; };
	this.get_max_rotation_speed = function() { return this.attributes.rotation_speed; };
	this.get_max_movement_speed = function() { return this.attributes.movement_speed; };
	this.get_radius = function() { return this.attributes.radius; };
	this.get_max_health = function() { return this.attributes.max_health; };
	this.is_alive = function() { return this.get_health() > 0; };
	this.is_dead = function() { return !this.is_alive(); };

	this.set_x = function(x) { this.x = x; };
	this.set_y = function(y) { this.y = y; };
	this.get_health = function() {
		return this.health;
	};
	this.remove_health = function(amount) {
		this.health -= amount;
		return this.is_alive();
	};
	this.set_theta = function(theta) { this.theta = theta; };
	this.get_x = function() { return this.x; };
	this.get_y = function() { return this.y; };
	this.get_theta = function() { return this.theta; };
	this.get_new_position = function(delta_rounds) {
		var rv = {x: this.x, y: this.y, theta: this.theta};

		var actions = this.actions;
		for(var i = 0, len = actions.length; i<len; i++) {
			var action = actions[i];
			var action_type = Actions.get_type(action);

			if(action_type === Actions.move_type) {
				var dx, dy;
				var theta = this.theta;
				var movement_speed = this.get_movement_speed();
				var distance = delta_rounds * movement_speed;
				var sin_theta = Math.sin(theta);
				var cos_theta = Math.cos(theta);

				if(action === Actions.move.stop) {
					dx = 0;
					dy = 0;
				} else if(action === Actions.move.forward) {
					dx = distance * cos_theta;
					dy = distance * sin_theta;
				} else if(action === Actions.move.backward) {
					dx = -1 * distance * cos_theta;
					dy = -1 * distance * sin_theta;
				} else if(action === Actions.move.left) {
					dx = -1 * distance * sin_theta;
					dy = -1 * distance * cos_theta;
				} else if(action === Actions.move.right) {
					dx = distance * sin_theta;
					dy = distance * cos_theta;
				}
				
				rv.x += dx;
				rv.y += dy;
			} else if(action_type === Actions.rotate_type) {
				var d_theta;
				var rotation_speed = this.get_rotation_speed();
				var distance = delta_rounds * rotation_speed;
				if(action === Actions.rotate.stop) {
					d_theta = 0;
				} else if(action === Actions.rotate.clockwise) {
					d_theta = distance;
				} else if(action === Actions.rotate.counter_clockwise) {
					d_theta = -distance;
				}

				rv.theta += d_theta;
			}
		}

		return rv;
	};
	this.fire = function(options) {
		var game = this.game;

		var round = game.get_round();
		var rv = false;
		var can_fire = true;
		if(this.last_fired_round !== null) {
			if(round-this.last_fired_round < ROUNDS_BETWEEN_FIRING) {
				can_fire = false;
			}
		}
		if(can_fire) {
			var angle_offset = 0;
			if(options.angle_offset) {
				//Normalize the angle
				while(options.angle_offset > Math.PI) {
					options.angle_offset -= 2 * Math.PI;
				}
				while(options.angle_offset < Math.PI) {
					options.angle_offset += 2 * Math.PI;
				}

				angle_offset = ceil(options.angle_offset, this.max_firing_angle_offset);
			}
			rv = game.on_player_fire(this, angle_offset);

			this.last_fired_round = round;
		}

		var ready_round_delta = round - this.last_fired_round;
		var ready_ms_delta = ready_round_delta / CONST.ROUNDS_PER_MS;

		var self = this;
		setTimeout(function() {
			if(options.on_weapon_ready) {
				options.on_weapon_ready();
			}

			if(self.auto_fire) {
				self.fire(options);
			}
		}, ready_ms_delta);

		return rv;
	};
	this.get_last_update_round = function() { return this.last_update; };
	this.set_last_update_round = function(round) { this.last_update = round; };
}).call(Player.prototype);

var Projectile = function(options) {
	this.options = options;
	this.x = options.x;
	this.y = options.y;
	this.theta = options.theta;
	this.in_play = true;
	this.attributes = {
		radius: 1 //Tiles
		, speed: 15 //Tiles per round
	};
	this.last_update = null;
};
(function() {
	this.get_new_position = function(delta_rounds) {
		var theta = this.get_theta();
		var movement_speed = this.get_movement_speed();
		var distance = delta_rounds * movement_speed;
		var dx = Math.cos(theta) * distance;
		var dy = Math.sin(theta) * distance;

		return {x: this.get_x()+dx, y: this.get_y()+dy};
	};
	this.get_x = function() { return this.x; };
	this.get_y = function() { return this.y; };
	this.get_theta = function() { return this.theta; };
	this.set_x = function(x) { this.x = x; };
	this.set_y = function(y) { this.y = y; };
	this.get_movement_speed = function() { return this.attributes.speed; };
	this.get_radius = function() { return this.attributes.radius; };
	this.get_source = function() { return this.options.source; };
	this.get_last_update_round = function() { return this.last_update; };
	this.set_last_update_round = function(round) { this.last_update = round; };
}).call(Projectile.prototype);

var Snapshot = function(data) {
	this.next = this.prev = undefined;
	this.data = data;
};
(function() {
	this.set_next = function(next) { this.next = next; };
	this.set_prev = function(prev) { this.prev = prev; };
	this.serialize = function() { return this.data; };
}).call(Snapshot.prototype);

var Replay = function(options) {
	this.objects = [];
	this.first_snapshot = null;
	this.last_snapshot = null;

	this.num_snapshots = 0;

	this.chunks = [];
};
(function() {
	this.add_object = function(object) {
		object.__object_id = this.objects.length;
		this.objects.push(object);
	};

	this.add_snapshot = function(snapshot) {
		if(this.last_snapshot === null) {
			this.first_snapshot = snapshot;
		}
		else {
			snapshot.set_prev(this.last_snapshot);
			this.last_snapshot.set_next(snapshot);
		}
		this.last_snapshot = snapshot;

		snapshot.index = this.num_snapshots;
		this.num_snapshots++;
	};

	this.get_object_id = function(object) {
		return object.__object_id;
	};

	this.serialize = function(from_snapshot) {
		var rv = {
			objects: this.serialize_objects()
			, snapshots: new Array(this.num_snapshots)
		};

		var curr_snapshot = this.first_snapshot;
		if(from_snapshot) {
			while(curr_snapshot != null) {
				if(curr_snapshot.index >= from_snapshot) {
					break;
				}
				curr_snapshot = curr_snapshot.next;
			}
		}
		var x = 0;
		while(curr_snapshot != null) {
			rv.snapshots[x] = this.serialize_snapshot(curr_snapshot);
			curr_snapshot = curr_snapshot.next;
			x++;
		}

		return rv;
	};

	this.serialize_objects = function() {
		var objects = new Array(this.objects.length);

		for(var i = 0, len = this.objects.length; i<len; i++) {
			var object = this.objects[i];

			var serialized_object = {};
			if(object instanceof Player) {
				serialized_object.type = "player";
				serialized_object.radius = object.get_radius();
				serialized_object.health = object.get_health();
			} else if(object instanceof Projectile) {
				serialized_object.type = "projectile";
				serialized_object.radius = object.get_radius();
			}

			objects[i] = serialized_object;
		}
		return objects;
	};

	this.serialize_snapshot = function(snapshot) {
		var serialized_snapshot = {
			round: snapshot.data.round
			, object_states: new Array(this.objects.length)
			, index: snapshot.index
		};
		var state = snapshot.data.state;
		var objects = state.get_keys();
		for(var i = 0, len = objects.length; i<len; i++) {
			var object = objects[i];
			var object_state = state.get(object);
			var object_id = this.get_object_id(object);

			serialized_snapshot.object_states[object_id] = object_state;
		}

		return serialized_snapshot;
	};
}).call(Replay.prototype);

var Brawl = function(options) {
	this.map = options.map;
	this.replay = new Replay();
	var self = this;
	this.teams = options.teams.map(function(team) {
		return new Team({model: team, game: self});
	});
	this.round_limit = options.round_limit == null ? -1 : options.round_limit;
	this.projectiles = [];
	this.players = [];
	this.initialize();
	this.running = false;
	this.start_time = undefined;
};

(function() {
	var get_time = function() {
		return (new Date()).getTime();
	};

	this.initialize = function() {
		for(var i = 0, leni = this.teams.length; i<leni; i++) {
			var players = this.teams[i].get_players();
			for(var j = 0, lenj = players.length; j<lenj; j++) {
				var player = players[j];
				this.players[player.id] = player;
				this.replay.add_object(player);
			}
		}
	};

	this.start = function() {
		var start_positions = this.map.attributes.start_positions;
		for(var i = 0; i<start_positions.length; i++) {
			var sp_team = start_positions[i];
			var team = this.teams[i];
			var players = team.get_players();

			for(var j = 0; j<sp_team.length; j++) {
				var start_position = sp_team[j];
				var player = players[j];

				player.x = start_position.x;
				player.y = start_position.y;
				player.theta = start_position.theta;
			}
		}

		this.start_time = get_time();
		this.running = true;

		this.update();

		this.broadcast({
			type: "game_start"
			, message: {
				map: this.map
			}
			, start_time: this.start_time
		});
	};

	this.end_game = function(winning_team_id) {
		this.running = false;
		clearInterval(this.update_timeout);
		post({
			type: "game_over"
			, winner: winning_team_id
		});
	};

	this.get_player = function(player_id) { return this.players[player_id]; };

	this.get_round = function(current_time) {
		if(arguments.length === 0) current_time = get_time();
		var time = current_time - this.start_time;
		return time * CONST.ROUNDS_PER_MS;
	};

	this.broadcast = function(message) {
		post({
			type: "broadcast"
			, message: message
		});
	};

	this.update = function() {
		if(this.do_update()) {
			var me = this;
			setTimeout(function() {
				me.update();
			}, CONST.ROUNDS_PER_UPDATE / CONST.ROUNDS_PER_MS);
		}
	};

	this.do_update = function() {
		if(!this.running) return false;

		var round = this.get_round();
		if(this.round_limit > 0 && round >= this.round_limit) {
			this.end_game(null);
			return false;
		} else if(this.teams[0].is_dead()) {
			this.end_game(this.teams[1].id);
			return false;
		} else if(this.teams[1].is_dead()) {
			this.end_game(this.teams[0].id);
			return false;
		}

		for(var i = 0, len = this.players.length; i<len; i++) {
			var player = this.players[i];
			if(player.is_alive()) {
				this.update_player(player);
			}
		}
		for(var i = 0, len = this.projectiles.length; i<len; i++) {
			var projectile = this.projectiles[i];
			if(projectile == null) continue;
			this.update_projectile(projectile);
		}
		this.take_snapshot();
		return true;
	};


	this.on_player_fire = function(player, theta_offset) {
		var projectile = new Projectile({
			x: player.get_x()
			, y: player.get_y()
			, theta: player.get_theta() + theta_offset
			, source: player
		});
		this.projectiles.push(projectile);
		this.replay.add_object(projectile);
		return projectile;
	};

	this.update_projectile = function(projectile, current_round) {
		var current_round = this.get_round();
		var last_update_round = projectile.get_last_update_round() || current_round;
		if(current_round < last_update_round) last_update_round = current_round;
		projectile.set_last_update_round(current_round);
		var delta_rounds = current_round - last_update_round;

		var old_pos = {x: projectile.x, y: projectile.y};
		var new_pos = projectile.get_new_position(delta_rounds);

		var left_map = this.projectile_left_map(projectile, old_pos, new_pos);
		var hit_other_player = false;

		if(!left_map) {
			hit_other_player = this.projectile_hit_player(projectile, old_pos, new_pos);
			if(hit_other_player !== false) {
				hit_other_player.remove_health(1);
				hit_other_player = true;
			}
		}


		if(left_map || hit_other_player) {
			projectile.in_play = false;
			var found_projectile = false;
			for(var i = 0, len = this.projectiles.length; i<len; i++) {
				var p = this.projectiles[i];
				if(p === projectile) found_projectile = true;
				if(found_projectile) {
					this.projectiles[i] = this.projectiles[i+1];
				}
			}
			this.projectiles.length = this.projectiles.length - 1;
		} else {
			projectile.set_x(new_pos.x);
			projectile.set_y(new_pos.y);
		}
	};

	this.update_player = function(player, current_round) {
		var current_round = current_round || this.get_round();
		var last_update_round = player.get_last_update_round() || current_round;
		if(current_round < last_update_round) last_update_round = current_round;
		player.set_last_update_round(current_round);
		var delta_rounds = current_round - last_update_round;

		var old_pos = {x: player.x, y: player.y, theta: player.theta};
		var new_pos = player.get_new_position(delta_rounds);

		new_pos = this.check_map_bounds(player, old_pos, new_pos);
		new_pos = this.check_player_collisions(player, old_pos, new_pos);

		player.set_x(new_pos.x);
		player.set_y(new_pos.y);
		player.set_theta(new_pos.theta);
	};

	this.projectile_hit_player = function(projectile, old_pos, new_pos) {
		var source = projectile.get_source();
		var delta_x = new_pos.x - old_pos.x;
		var delta_y = new_pos.y - old_pos.y;
		var m = delta_y/delta_x;
		var b = new_pos.y - m*new_pos.x;

		var denom = Math.sqrt(m*m+1);
		var projectile_radius = projectile.get_radius();
		for(var i = 0, len = this.players.length; i<len; i++) {
			var player = this.players[i];
			if(player === source) continue;
			var distance = distanceFromLineSegment({x: player.get_x(), y: player.get_y()}, old_pos, new_pos);
			var closest_distance = distance.segment;
			if(closest_distance < player.get_radius() + projectile_radius) {
				return player;
			}
		}
		
		return false;
	};

	this.projectile_left_map = function(projectile, old_pos, new_pos) {
		var map_width = this.map.attributes.width;
		var map_height = this.map.attributes.height;
		var radius = projectile.get_radius();

		var min_x = new_pos.x - radius;
		var max_x = new_pos.x + radius;
		var min_y = new_pos.y - radius;
		var max_y = new_pos.y + radius;
		return max_x <= 0 || max_y <= 0 || min_x >= map_height || min_y >= map_height
	};

	this.check_map_bounds = function(player, old_pos, new_pos) {
		var rv = {x: new_pos.x, y: new_pos.y, theta: new_pos.theta};
		var radius = player.get_radius();
		var map = this.map;
		var map_width = map.attributes.width;
		var map_height = map.attributes.height;

		var min_x = rv.x - radius;
		var max_x = rv.x + radius;
		var min_y = rv.y - radius;
		var max_y = rv.y + radius;

		if(min_x < 0) {
			rv.x = radius;
		} else if(max_x > map_width) {
			rv.x = map_width - radius;
		}

		if(min_y < 0) {
			rv.y = radius;
		} else if(max_y > map_height) {
			rv.y = map_height - radius;
		}

		return rv;
	};

	this.check_player_collisions = function(player, old_pos, new_pos) {
		var rv = {x: new_pos.x, y: new_pos.y, theta: new_pos.theta};
		var player_radius = player.get_radius();
		var players = this.players;
		for(var i = 0, len = players.length; i<len; i++) {
			var other_player = players[i];
			if(other_player === player) continue;
			else if(other_player.is_dead()) continue;

			var distance_x = rv.x - other_player.x;
			var distance_y = rv.y - other_player.y;

			var distance_squared = distance_x * distance_x + distance_y * distance_y;
			var other_player_radius = other_player.get_radius();

			var total_radius = player_radius + other_player_radius;
			var total_radius_squared = total_radius * total_radius;

			if(distance_squared < total_radius_squared) {
				console.log("player collision");
			}
		}
		return rv;
	};

	this.take_snapshot = function() {
		var snapshot = this.get_snapshot();
		this.replay.add_snapshot(snapshot);
	};

	this.get_snapshot_data = function(include_objs) {
		include_objs = include_objs ? true : false;
		var players = this.players.map(function(player) {
			return {
				x: player.x
				, y: player.y
				, theta: player.theta
				, team_id: player.team.id
				, number: player.id
				, obj: include_objs ? player : undefined
			};
		});
		var projectiles = this.projectiles.map(function(projectile) {
			return {
				x: projectile.x
				, y: projectile.y
				, obj: include_objs ? projectile : undefined
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

	this.get_snapshot = function() {
		var state = new Hash();
		var data = this.get_snapshot_data(true);
		data.players.forEach(function(player) {
			state.set(player.obj, {
				x: player.x
				, y: player.y
				, theta: player.theta
			});
		});
		data.projectiles.forEach(function(projectile) {
			state.set(projectile.obj, {
				x: projectile.x
				, y: projectile.y
			});
		});


		var snapshot_data = {
			round: this.get_round()
			, state: state
		};
		var snapshot = new Snapshot(snapshot_data);
		return snapshot;
	};

	this.broadcast_event = function(options) {
		post({
			type: "event"
			, event_id: options.event_id
			, audience: [options.player_id]
			, event: options.event
		});
	};

	var compute_request_timing = function(request) {
		var request_time = request.time;
		var options = request.options;

		var delay_rounds = 0;
		if(options.delay != null) {
			delay_rounds = options.delay;
		}

		if(isNaN(delay_rounds)) {
			delay_rounds = 0;
		} else {
			delay_rounds = Math.max(0, delay_rounds);
		}
		var delay_ms = delay_rounds / CONST.ROUNDS_PER_MS;

		var desired_start_time_ms = request_time + delay_ms;

		var rv = {
			start_time_ms: desired_start_time_ms
			, stop_time_ms: undefined
		};

		if(options.duration) {
			var duration = options.duration;
			if(!isNaN(duration)) {
				duration = Math.max(0, duration);
				var duration_ms = duration / CONST.ROUNDS_PER_MS;
				var desired_stop_time_ms = desired_start_time_ms + duration_ms;

				rv.stop_time_ms = desired_stop_time_ms;
			}
		}
		return rv;
	};
	var at_time = function(callback, time) {
		var curr_time = get_time();
		var time_diff = time - curr_time;
		if(time_diff > 0) {
			setTimeout(callback, time_diff);
		} else {
			callback();
		}
	};

	this.do_at_time = function(callback, time) {
		var at_round = this.get_round(time);
		at_time(function() {
			callback(at_round);
		}, time);
	};

	this.on_player_request = function(player_id, request) {
		var self = this;
		var player = this.get_player(player_id);
		var type = request.type;


		if(type === "action") {
			var request_timing = compute_request_timing(request);
			var action = request.action;
			var options = request.options;
			var action_type = Actions.get_type(action);

			var callback = function() {};

			if(options.callback) {
				var callback_id = options.callback_id;
				callback = function(event) {
					self.broadcast_event({
						event_id: callback_id
						, player_id: player_id
						, event: event
					});
				};
			}

			if(action_type === Actions.move_type ||
				action_type === Actions.rotate_type) {
				var do_action = function(round) {
					player.actions[action_type] = action;
					if(action_type === Actions.move_type) {
						player.set_movement_speed(options.speed);
					} else if(action_type === Actions.rotate_type) {
						player.set_rotation_speed(options.speed);
					}
					self.update_player(player, round);
					callback({
						type: "start"
						, action: action
					});

					if(request_timing.stop_time_ms) {
						var stop_action = function(round) {
							if(player.actions[action_type] !== action) { //The action type has changed...don't do anything
								return;
							}
							if(action_type === Actions.move_type) {
								player.actions[action_type] = Actions.move.stop;
							} else if(action_type === Actions.rotate_type) {
								player.actions[action_type] = Actions.rotate.stop;
							}
							self.update_player(player, round);
							callback({
								type: "stop"
								, action: action
							});
						};
						self.do_at_time(stop_action, request_timing.stop_time_ms);
					}
				};
				this.do_at_time(do_action, request_timing.start_time_ms);
			} else if(action_type === Actions.instantaneous_type) {
				if(action === Actions.fire) {
					var on_weapon_ready = function() {
						callback({
							type: "weapon_ready"
							, action: action
						});
					};
					var do_fire = function() {
						player.auto_fire = options.automatic;
						var projectile = player.fire({
							on_weapon_ready: on_weapon_ready
							, angle_offset: options.angle_offset
						});
						if(projectile) {
							callback({
								type: "fire"
								, fired: false
								, action: action
							});
						} else {
							callback({
								type: "fire"
								, fired: false
								, action: action
							});
						}
					};
					this.do_at_time(do_fire, request_timing.start_time_ms);
				} else if(action === Actions.stop_firing) {
					var do_stop_firing = function() {
						player.auto_fire = false;
					};
					this.do_at_time(do_stop_firing, request_timing.start_time_ms);
				} else if(action === Actions.sense) {
					callback({
						type: "sense"
						, data: this.get_snapshot_data()
					});
				}
			}
		} else if(type === "event_listener") {
			var event_type = request.event_type
				, options = request.options;
			if(event_type === "action_callback") { } //Do nothing...
		} else {
			console.log("Unknown player request type", type);
		}
	};

	this.send_replay = function() {
		var serialized_replay = this.replay.serialize();
		post({type: "replay"
				, replay: serialized_replay
				});
	};
	this.send_replay_chunk = function(from_snapshot) {
		var serialized_replay_chunk = this.replay.serialize(from_snapshot);
		post({type: "replay_chunk"
				, replay_chunk: serialized_replay_chunk
				});
	};

}).call(Brawl.prototype);

var brawl;
self.onmessage = function(event) {
	var data = event.data;
	var type = data.type;
	if(type === "run") {
		brawl.start();
	} else if(type === "get_replay_chunk") {
		brawl.send_replay_chunk(data.from_snapshot);
	} else if(type === "stop") {
		brawl.end_game();
	} else if(type === "initialize") {
		brawl = new Brawl({
			map: data.map
			, teams: data.teams
			, round_limit: data.round_limit
		});
	} else if(type === "player_request") {
		var player_id = data.player_id;
		var request = data.request;

		brawl.on_player_request(player_id, request);
	}
};
