define(function(require) {
	var movement_path_factory = require("game/geometry/movement_paths/movement_path");
	var shape_factory = require("game/geometry/shapes/shape_factory");
	var MovingObject = require("game/models/moving_object/moving_object");
	var oo_utils = require("game/util/object_oriented");

	var error_tolerance = 0.0001;

	var Player = function(options) {
		var radius = 2; //Radius in tiles
		this.code = options.code;

		Player.superclass.call(this, {
			shape: shape_factory("circle", {radius: radius})
			, type: "player"
		});
		this.attributes = {
			max_movement_speed: 5.0 //Tiles per round
			, max_rotation_speed: 90*Math.PI/180.0 //Radians per round
			, max_health: 10 //Maximum health
			, max_firing_angle_offset: Math.PI/8.0 //Radians
			, shots_per_round: 1.0 //Shots per round
		};
		this.health = this.get_max_health();
		this.auto_fire = false;
		this.next_fireable_round = 0;
		this.options = options;
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
		proto.get_max_movement_speed = function() {return this.get_attribute("max_movement_speed");};

		proto.set_game = function(game) { this.game = game; };
		proto.get_game = function() { return this.game; };
		proto.get_round = function() { var game = this.get_game(); return game.get_round(); };
		proto.get_code = function() { return this.options.code; };
		proto.get_team = function() { return this.options.team; };
		proto.get_number = function() { return this.options.number; };

		proto.serialize = function() {
			return {
				code: this.get_code()
				, number: this.get_number()
			};
		};

		proto.get_radius = function() { return this.shape.get_radius(); };
		proto.get_max_rotation_speed = function() { return this.get_attribute("max_rotation_speed"); };

		//Health-related
		proto.get_max_health = function() { return this.get_attribute("max_health"); };
		proto.get_health = function() { return this.health; };
		proto.is_alive = function() { return this.get_health() > 0; };
		proto.is_dead = function() { return !this.is_alive(); };
		proto.remove_health = function(amount) {
			this.health -= amount;
			return this.is_alive();
		};

		//Firing-related
		proto.is_auto_fire = function() {
			return this.auto_fire;
		};
		proto.set_auto_fire = function(auto_fire) {
			this.auto_fire = auto_fire;
		};
		proto.can_fire = function() {
			var game = this.get_game();
			var round = game.get_round();
			return round + error_tolerance > this.get_next_fireable_round();
		};
		proto.get_next_fireable_round = function() {
			return this.next_fireable_round;
		};
		proto.set_next_fireable_round = function() {
			var game = this.get_game();
			var round = game.get_round();
			var rounds_between_shots = 1.0/this.get_attribute("shots_per_round");
			var next_fireable_round = round + rounds_between_shots;
			this.next_fireable_round = next_fireable_round;
			return next_fireable_round;
		};
		proto.on_fire = function(options) {
			this.set_next_fireable_round();
			var game = this.get_game();
			this.emit({
				type: "fire"
				, fired: true
				, round: game.get_round()
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
			var x = game.on_round(function() {
				if(self.is_auto_fire()) {
					self.fire();
				}
			}, this.get_next_fireable_round(), "Fire");
		};
		proto.can_collide_with = function(moving_object) {
			if(moving_object.is("projectile")) {
				return moving_object.get_fired_by() !== this;
			} else if(moving_object.is("player")) {
				return false;
			}
			return true;
		};

		proto.restrict_path = function(moving_object, path) {
			if(moving_object.is("player")) {
				return movement_path_factory("stationary", {
					x0: 0
					, y0: 0
				});
			}
			return path;
		};
	})(Player);

	return function(options) { return new Player(options); };
});
