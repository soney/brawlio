define(['game/models/shapes/circle', 'game/models/moving_object', 'game/models/moving_object_state', 'game/util/object_oriented', 'game/util/listenable'], function(Circle, MovingObject, MovingObjectState, oo_utils, make_listenable) {
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

		proto.set_game = function(game) { this.game = game; };
		proto.set_id = function(id) { this.options.id = id; };
		proto.get_round = function() { return this.game.get_round(); };
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
			this.game.on_round(function() {
				if(self.is_auto_fire()) {
					self.fire();
				}
			}, this.get_next_fireable_round());
		};

		proto.set_starting_position = function(position) {
			var state = new MovingObjectState({
				start: {
					x: position.x, y: position.y, theta: position.theta
				}, translational_velocity: 0, rotational_velocity: 0
			});
			this.push_state(state, 0);
		};
	})(Player);

	return Player;
});
