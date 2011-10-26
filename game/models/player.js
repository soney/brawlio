define(['game/geometry/shapes/circle', 'game/models/moving_object', 'game/models/moving_object_state', 'game/util/object_oriented', 'game/util/listenable'], function(Circle, MovingObject, create_movement_state, oo_utils, make_listenable) {
	var Player = function(options) {
		var radius = 2; //Radius in tiles
		if(options == null) {
			options = {};
		}

		Player.superclass.call(this, {
			shape: new Circle({radius: radius})
			, start_state: undefined
		});
		this.attributes = {
			max_movement_speed: 5.0 //Tiles per round
			, max_rotation_speed: 90*Math.PI/180.0 //Radians per round
			, max_health: 10 //Maximum health
			, max_firing_angle_offset: Math.PI/8.0 //Radians
			, shots_per_round: 1.0 //Shots per round
		};
		this.state = {
			health: this.get_max_health()
			, auto_fire: false
			, next_fireable_round: 0
			, last_update_round: 0
		};
		this.touching_obstacles = [];
		this.game = options.game;
		this.options = options;
		make_listenable(this);
	};
	oo_utils.extend(Player, MovingObject);

	(function(my) {
		//Utilities
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
		var proto = my.prototype;
		proto.get_attributes = function() {return this.attributes;};
		proto.get_attribute = function(attr_name) { return this.attributes[attr_name]; };
		proto.set_attribute = function(attr_name, value) {this.attributes[attr_name] = value;};
		proto.get_state = function(state_name) {return this.state[state_name]; };
		proto.set_state = function(state_name, value) {this.state[state_name] = value;};
		proto.get_max_movement_speed = function() {return this.get_attribute("max_movement_speed");};

		proto.set_game = function(game) { this.game = game; };
		proto.get_game = function() { return this.game; };
		proto.set_id = function(id) { this.options.id = id; };
		proto.get_round = function() { var game = this.get_game(); return game.get_round(); };
		proto.get_code = function() { return this.options.code; };
		proto.get_team = function() { return this.options.team; };
		proto.get_number = function() { return this.options.number; };
		proto.get_id = function() { return this.options.id; };

		proto.serialize = function() {
			return {
				code: this.get_code()
				, number: this.get_number()
				, id: this.get_id()
			};
		};

		proto.get_radius = function() { return this.shape.get_radius(); };
		proto.get_max_rotation_speed = function() { return this.get_attribute("max_rotation_speed"); };

		//Health-related
		proto.get_max_health = function() { return this.get_attribute("max_health"); };
		proto.get_health = function() { return this.get_state("health"); };
		proto.is_alive = function() { return this.get_health() > 0; };
		proto.is_dead = function() { return !this.is_alive(); };
		proto.remove_health = function(amount) {
			this.set_state("health", this.get_health() - amount);
			return this.is_alive();
		};

		//Firing-related
		proto.is_auto_fire = function() {
			return this.get_state("auto_fire");
		};
		proto.set_auto_fire = function(auto_fire) {
			return this.set_state("auto_fire", auto_fire);
		};
		proto.can_fire = function() {
			var round = this.get_round();
			return round > this.get_next_fireable_round();
		};
		proto.get_next_fireable_round = function() {
			return this.get_state("next_fireable_round");
		};
		proto.set_next_fireable_round = function() {
			var round = this.get_round();
			var rounds_between_shots = 1.0/this.get_attribute("shots_per_round");
			var next_fireable_round = round + rounds_between_shots;
			this.set_state("next_fireable_round", next_fireable_round);
			return next_fireable_round;
		};
		proto.on_fire = function(options) {
			this.set_next_fireable_round();
			this.emit({
				type: "fire"
				, fired: true
			});
		};
		proto.on_fire_fail = function(options) {
			this.emit({
				type: "fire"
				, fired: false
			});
		};
		proto.fire = function(options) {
			if(this.can_fire()) {
				this.on_fire(options);
			} else {
				this.on_fire_fail();
			}
			var self = this;
			var game = this.get_game();
			game.on_round(function() {
				if(self.is_auto_fire()) {
					self.fire();
				}
			}, this.get_next_fireable_round());
		};

		proto.set_starting_position = function(position) {
			var state = create_movement_state({
				x0: position.x
				, y0: position.y
				, theta0: position.theta
				, touching: this.touching_obstacles
				, moving_object: this
				, round: 0
			});
			this.push_state(state);
		};

		proto.set_velocity = function(speed, angle, round) {
			var game = this.get_game();
			var start_position = this.get_position(round);
			var old_state = this.get_movement_state();
			var state = create_movement_state({
				x0: start_position.x
				, y0: start_position.y
				, theta0: start_position.theta
				, translational_speed: speed, translational_angle: angle
				, touching: this.touching_obstacles
				, moving_object: this
				, round: round
			}, old_state);
			this.push_state(state, round);
			game.update(round);
		};
		proto.set_rotation_speed = function(speed, round) {
			var game = this.get_game();
			var start_position = this.get_position(round);
			var old_state = this.get_movement_state();

			var state = create_movement_state({
				x0: start_position.x
				, y0: start_position.y
				, theta0: start_position.theta
				, rotation_speed: speed
				, touching: this.touching_obstacles
				, moving_object: this
				, round: round
			}, old_state);
			this.push_state(state, round);
			game.update(round);
		};
		proto.set_touching_obstacles = function(touching, round) {
			var something_changed = !order_independent_equality_check(this.touching_obstacles, touching, function(touching_a, touching_b){
				return touching_a.obstacle === touching_b.obstacle && touching_a.signature === touching_b.signature;
			});

			if(something_changed) {
				this.touching_obstacles = touching;
				var start_position = this.get_position(round);
				var old_state = this.get_movement_state();
				var state = create_movement_state({
					start: {
						x: start_position.x, y: start_position.y, theta: start_position.theta
					}
					, touching: this.touching_obstacles
					, moving_object: this
					, round: round
				}, old_state);
				this.push_state(state, round);
			}
		};
	})(Player);


	var order_independent_equality_check = function(arr1, arr2, isEqual) {
		if(arr1.length !== arr2.length) { return false; };
		isEqual = isEqual || function(a,b){return a === b;};
		var contains = function(arr, obj, equalityCheck, ignore_indicies) {
			equalityCheck = equalityCheck || function(a,b){return a===b;};
			ignore_indicies = ignore_indicies || [];
			for(var i = 0, len = arr.length; i<len; i++) {
				var ignore = false;
				for(var j = 0, lenj = ignore_indicies.length; j<lenj; j++) {
					if(ignore_indicies[j] === i) {
						ignore = true;
						break;
					}
				}
				if(!ignore) {
					if(equalityCheck(arr[i], obj)) { return i; }
				}
			}
			return false;
		};

		var used_arr2_indicies = [];

		for(var i = 0, len = arr1.length; i<len; i++) {
			var equiv_obj_index = contains(arr2, arr1[i], isEqual, used_arr2_indicies);
			if(equiv_obj_index === false) { return false; }
			else {
				used_arr2_indicies.push(equiv_obj_index);
			}
		}
		return true;
	};


	return Player;
});
