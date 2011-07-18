importScripts('game/actions.js');
importScripts('game/util/worker_utils.js');

var post = function() {
	return self.postMessage.apply(self, arguments);
};

var _debug = true;
if(_debug) {
	var ROUNDS_PER_MS = 1/100.0;
	var ROUNDS_PER_UPDATE = 0.001;
}
else {
	var ROUNDS_PER_MS = 1/1000.0;
	var ROUNDS_PER_UPDATE = 0.001;
}

var Player = function(model, game) {
	this.model = model;
	this.game = game;
	this.id = this.model.id;
	this.actions = [];
	this.x = -1;
	this.y = -1;
	this.theta = 0;
	this.health = this.get_max_health();
	this.last_fired_round = null;
};
(function() {
	var ROUNDS_BETWEEN_FIRING = 1;

	this.get_rotation_speed = function() { return this.model.attributes.rotation_speed; };
	this.get_movement_speed = function() { return this.model.attributes.movement_speed; };
	this.get_radius = function() { return this.model.attributes.radius; };
	this.get_max_health = function() { return this.model.attributes.max_health; };
	this.is_alive = function() { return this.health > 0; };
	this.is_dead = function() { return !this.is_alive(); };

	this.set_x = function(x) { this.x = x; };
	this.set_y = function(y) { this.y = y; };
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
				}
				else if(action === Actions.move.forward) {
					dx = distance * cos_theta;
					dy = distance * sin_theta;
				}
				else if(action === Actions.move.backward) {
					dx = -1 * distance * cos_theta;
					dy = -1 * distance * sin_theta;
				}
				else if(action === Actions.move.left) {
					dx = -1 * distance * sin_theta;
					dy = -1 * distance * cos_theta;
				}
				else if(action === Actions.move.right) {
					dx = distance * sin_theta;
					dy = distance * cos_theta;
				}
				
				rv.x += dx;
				rv.y += dy;
			}
			else if(action_type === Actions.rotate_type) {
				var d_theta;
				var rotation_speed = this.get_rotation_speed();
				var distance = delta_rounds * rotation_speed;
				if(action === Actions.rotate.stop) {
					d_theta = 0;
				}
				else if(action === Actions.rotate.clockwise) {
					d_theta = distance;
				}
				else if(action === Actions.rotate.counter_clockwise) {
					d_theta = -distance;
				}

				rv.theta += d_theta;
			}
		}

		return rv;
	};
	this.fire = function(options) {
		var round = this.game.get_round();
		var can_fire = true;
		if(this.last_fired_round !== null) {
			if(round-this.last_fired_round < ROUNDS_BETWEEN_FIRING) {
				can_fire = false;
			}
		}
		if(can_fire) {
			this.game.on_player_fire(this);

			this.last_fired_round = round;
		}
	};
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
			}
			else if(object instanceof Projectile) {
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
	this.teams = options.teams;
	this.round_limit = options.round_limit == null ? -1 : options.round_limit;

	this.initialize();
};

(function() {
	var get_time = function() {
		return (new Date()).getTime();
	};

	this.initialize = function() {
		this.projectiles = [];
		this.players = new Array(this.teams.length * this.teams[0].player_models.length);
		for(var i = 0, leni = this.teams.length; i<leni; i++) {
			var team = this.teams[i];

			for(var j = 0, lenj = team.player_models.length; j<lenj; j++) {
				var player_model = team.player_models[j];
				var player = new Player(player_model, this);

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

			for(var j = 0; j<sp_team.length; j++) {
				var start_position = sp_team[j];
				var player_model = team.player_models[j];
				var player_id = player_model.id;

				var player = this.get_player(player_id);

				player.x = start_position.x;
				player.y = start_position.y;
				player.theta = start_position.theta;
			}
		}

		this.round = 0;
		this.start_time = get_time();

		this.update();

		this.broadcast({
			type: "game_start"
			, message: {
				map: this.map
			}
		});
	};

	this.end_game = function() {
		clearInterval(this.update_timeout);
		post({
			type: "game_over"
		});
	};

	this.get_player = function(player_id) {
		return this.players[player_id];
	};

	this.get_round = function(current_time) {
		if(arguments.length === 0) current_time = get_time();
		var time = current_time - this.start_time;
		return time * ROUNDS_PER_MS;
	};

	this.broadcast = function(message) {
		post({
			type: "broadcast"
			, message: message
		});
	};

	this.update = function() {
		this.do_update();

		var me = this;
		this.update_timeout = setTimeout(function() {
			me.update();
		}, ROUNDS_PER_UPDATE / ROUNDS_PER_MS);
	};

	this.do_update = function() {
		var old_round = this.round;
		this.round = this.get_round();
		if(this.round_limit >= 0 && this.round >= this.round_limit) {
			this.end_game();
		}

		var delta_rounds = this.round - old_round;

		for(var i = 0, len = this.players.length; i<len; i++) {
			var player = this.players[i];
			if(player.is_alive()) {
				this.update_player(player, delta_rounds);
			}
		}
		for(var i = 0, len = this.projectiles.length; i<len; i++) {
			var projectile = this.projectiles[i];
			this.update_projectile(projectile, delta_rounds);
		}
		this.take_snapshot();
	};


	this.on_player_fire = function(player) {
		this.do_update();
		var projectile = new Projectile({
			x: player.get_x()
			, y: player.get_y()
			, theta: player.get_theta()
		});
		this.projectiles.push(projectile);
		this.replay.add_object(projectile);
	};

	this.update_projectile = function(projectile, delta_rounds) {
		var old_pos = {x: projectile.x, y: projectile.y};
		var new_pos = projectile.get_new_position(delta_rounds);

		projectile.set_x(new_pos.x);
		projectile.set_y(new_pos.y);
	};

	this.update_player = function(player, delta_rounds) {
		var old_pos = {x: player.x, y: player.y, theta: player.theta};
		var new_pos = player.get_new_position(delta_rounds);

		new_pos = this.check_map_bounds(player, old_pos, new_pos);
		new_pos = this.check_player_collisions(player, old_pos, new_pos);

		player.set_x(new_pos.x);
		player.set_y(new_pos.y);
		player.set_theta(new_pos.theta);
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
		}
		else if(max_x > map_width) {
			rv.x = map_width - radius;
		}

		if(min_y < 0) {
			rv.y = radius;
		}
		else if(max_y > map_height) {
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

	this.get_snapshot = function() {
		var state = new Hash();

		for(var i = 0, len = this.players.length; i<len; i++) {
			var player = this.players[i];
			var player_state = {x: player.x, y: player.y, theta: player.theta};
			state.set(player, player_state);
		}
		for(var i = 0, len = this.projectiles.length; i<len; i++) {
			var projectile = this.projectiles[i];
			var projectile_state = {x: projectile.x, y: projectile.y};
			state.set(projectile, projectile_state);
		}
		var data = {
			round: this.get_round()
			, state: state
		};
		var snapshot = new Snapshot(data);
		return snapshot;
	};

	this.broadcast_event = function(options) {
		post({
			type: "event"
			, event_id: options.event_id
			, audience: [options.player_id]
		});
	};

	this.on_player_request = function(player_id, request) {
		var player = this.get_player(player_id);
		var type = request.type;

		this.do_update(); //Update immediately before the player's request so that later on, for any action, we can simply look at the last time the user had a particular action

		if(type === "action") {
			var action = request.action;
			var action_type = Actions.get_type(action);

			if(action_type === Actions.move_type ||
				action_type === Actions.rotate_type) {
				player.actions[action_type] = action;
			}
			else if(action_type === Actions.instantaneous_type) {
				var options = request.options;
				if(action === Actions.fire) {
					player.fire(options);
				}
			}
		}
		else if(type === "event_listener") {
			var event_type = request.event_type
				, options = request.options;
			if(event_type === "round") {
				var current_time = get_time()
					, current_round = this.get_round(current_time)
					, round = options.round
					, callback_delay = (round - current_round)/ROUNDS_PER_MS;

				var self = this
					, callback = function() {
						self.broadcast_event({
							event_id: request.id
							, player_id: player_id
						});
					};

				if(callback_delay > 0) {
					var self = this;
					setTimeout(function() {
						callback();
					}, callback_delay);
				}
				else {
					callback();
				}
			}
		}
		else {
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

self.onmessage = function(event) {
	var data = event.data;
	var type = data.type;
	if(type === "run") {
		self.brawl.start();
	}
	else if(type === "get_replay_chunk") {
		self.brawl.send_replay_chunk(data.from_snapshot);
	}
	else if(type === "stop") {
		self.brawl.end_game();
	}
	else if(type === "initialize") {
		self.brawl = new Brawl({
			map: data.map
			, teams: data.teams
			, round_limit: data.round_limit
		});
	}
	else if(type === "player_request") {
		var player_id = data.player_id;
		var request = data.request;

		self.brawl.on_player_request(player_id, request);
	}
};
