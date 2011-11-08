define(function(require) {
	require("vendor/underscore");
	var oo_utils = require("game/util/object_oriented");
	var path_factory = require("game/geometry/paths/path_factory");

	var close_to = function(a,b) {
		return Math.abs(a-b) < 0.0001;
	};

	var MovementPath = function(options) {
		this.x0 = options.x0;
		this.y0 = options.y0;
		this.name = "generic_movement_path";
	};
	(function(my) {
		var proto = my.prototype;
		proto.get_position = function(rounds) {
			return {x: 0, y: 0};
		};
		proto.is = function(type) { return this.type === type; };
	})(MovementPath);
	//========================================
	var Stationary = function(options) {
		Stationary.superclass.call(this, options);
		this.type = "stationary";
	};
	oo_utils.extend(Stationary, MovementPath);
	(function(my) {
		var proto = my.prototype;
		proto.get_position = function(rounds) {
			return {
				x: this.x0
				, y: this.y0
			};
		};
	})(Stationary);
	//========================================
	var ConstantVelocityLine = function(options) {
		ConstantVelocityLine.superclass.call(this, options);
		this.angle = options.angle;
		this.speed = options.speed;
		this.init();
		this.type = "constant_velocity_line";
	};
	oo_utils.extend(ConstantVelocityLine, MovementPath);
	(function(my) {
		var proto = my.prototype;
		proto.init = function() {
			this.cos_angle = Math.cos(this.angle);
			this.sin_angle = Math.sin(this.angle);
		};
		proto.get_position = function(rounds) {
			var distance = rounds * this.speed;
			var dx = distance * this.cos_angle;
			var dy = distance * this.sin_angle;
			return {
				x: this.x0 + dx
				, y: this.y0 + dy
			};
		};
		proto.get_ray = function() {
			return path_factory("ray_from_point_and_angle", this.x0, this.y0, this.angle);
		};
		proto.delta_t_until_x_is = function(x) {
			var vx = this.speed * Math.cos(this.angle);
			if(close_to(vx, 0)) {
				if(close_to(this.x0, x)) {
					return 0;
				} else {
					return false;
				}
			}
			var rv = (x-this.x0)/vx;
			if(rv < 0) { return false; }
			return rv;
		};
		proto.delta_t_until_y_is = function(y) {
			var vy = this.speed * Math.sin(this.angle);
			if(close_to(vy, 0)) {
				if(close_to(this.y0, y)) {
					return 0;
				} else {
					return false;
				}
			}
			var rv = (y-this.y0)/vy;
			if(rv < 0) { return false; }
			return rv;
		};
		proto.delta_t_until_at = function(x,y) {
			var x_delta_t = this.delta_t_until_x_is(x);
			if(x_delta_t === false) { return false; }
			var y_delta_t = this.delta_t_until_y_is(y);
			if(y_delta_t === false) { return false; }
			var rv = Math.max(x_delta_t, y_delta_t);
			if(rv <= 0) {
				return false;
			}
			return rv;
		};
	})(ConstantVelocityLine);
	//========================================
	var ConstantVelocityCircle = function(options) {
		ConstantVelocityCircle.superclass.call(this, options);
		this.angle = options.angle;
		this.speed = options.speed;
		this.rotational_speed = options.rotational_speed;
		this.init();
		this.type = "constant_velocity_circle";
	};
	oo_utils.extend(ConstantVelocityCircle, MovementPath);
	(function(my) {
		var proto = my.prototype;
		proto.init = function() {
			this.r = this.speed / (1.0*this.rotational_speed);
			this.center_x = this.x0 + this.r*Math.sin(-this.angle);
			this.center_y = this.y0 + this.r*Math.cos(-this.angle);
		};
		proto.get_position = function(rounds) {
			var delta_theta = this.rotational_speed * rounds;
			var new_movement_theta = this.angle + delta_theta;

			return {
				x: this.center_x + this.r*Math.cos(new_movement_theta-Math.PI/2)
				, y: this.center_y + this.r*Math.sin(new_movement_theta-Math.PI/2)
			};
		};
	})(ConstantVelocityCircle);
	//========================================

	return function(type, options) {
		if(type === "stationary") {
			return new Stationary(options);
		} else if(type === "constant_velocity_line") {
			return new ConstantVelocityLine(options);
		} else if(type === "constant_velocity_circle") {
			return new ConstantVelocityCircle(options);
		}
	};
});
