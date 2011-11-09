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
		proto.get_vector = function() {
			return path_factory("vector_from_magnitude_and_angle", this.speed, this.angle);
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
		this.movement_angle = options.movement_angle;
		this.speed = options.speed;
		this.rotational_speed = options.rotational_speed;
		this.init();
		this.type = "constant_velocity_circle";
	};
	oo_utils.extend(ConstantVelocityCircle, MovementPath);
	(function(my) {
		var proto = my.prototype;
		proto.init = function() {
			this.clockwise = this.rotational_speed > 0;
			this.r = this.speed / this.rotational_speed;
			this.center_x = this.x0 + this.r*Math.sin(-this.movement_angle);
			this.center_y = this.y0 + this.r*Math.cos(-this.movement_angle);
			this.r = Math.abs(this.r);
			if(this.clockwise) {
				this.angle = this.movement_angle - Math.PI/2;
			} else {
				this.angle = this.movement_angle + Math.PI/2;
			}
		};
		proto.get_rotational_speed = function() {
			return this.rotational_speed;
		};
		proto.get_translational_speed = function() {
			return this.speed;
		};
		proto.get_position = function(rounds) {
			var delta_theta = this.rotational_speed * rounds;
			var new_angle = this.angle + delta_theta;

			var rv = {
				x: this.center_x + this.r*Math.cos(new_angle)
				, y: this.center_y + this.r*Math.sin(new_angle)
			};
			return rv;
		};
		proto.delta_t_until_at = function(x,y) {
			var dx_end = x - this.center_x;
			var dy_end = y - this.center_y;
			var end_angle = Math.atan2(dy_end, dx_end);

			if(this.clockwise) {
				while(end_angle > this.angle) {
					end_angle -= 2*Math.PI;
				}
				while(end_angle <= this.angle) {
					end_angle += 2*Math.PI;
				}
			} else {
				while(end_angle < this.angle) {
					end_angle += 2*Math.PI;
				}
				while(end_angle >= this.angle) {
					end_angle -= 2*Math.PI;
				}
			}

			var angle_diff = end_angle - this.angle;
			var rounds_taken = angle_diff / this.rotational_speed;
			return rounds_taken;
		};
		proto.get_circle = function() {
			return path_factory("circle_from_center_and_radius", this.center_x, this.center_y, this.r);
		};
		proto.get_vector = function(round) {
			var angle = this.movement_angle + round * this.rotational_speed;
			return path_factory("vector_from_magnitude_and_angle", this.speed, angle);
		};
	})(ConstantVelocityCircle);
	//========================================
	var SinusoidalVelocityLine = function(options) {
		SinusoidalVelocityLine.superclass.call(this, options);
		this.type = "sinusoidal_velocity_line";
		this.x0 = options.x0;
		this.y0 = options.y0;
		this.movement_angle = options.movement_angle;
		this.rotational_speed = options.rotational_speed;
		this.speed = options.speed;
		this.initial_theta = options.initial_theta;
		this.init();
	};
	oo_utils.extend(SinusoidalVelocityLine, MovementPath);
	(function(my) {
		var proto = my.prototype;
		proto.init = function() {
			this.cos_movement_angle = Math.cos(this.movement_angle);
			this.sin_movement_angle = Math.sin(this.movement_angle);
			this.initial_distance = (this.speed / this.rotational_speed)*Math.sin(this.initial_theta);
		};
		proto.get_position = function(rounds) {
			var theta = this.initial_theta + rounds * this.rotational_speed;
			var velocity = this.speed * Math.cos(theta);
			var distance = (this.speed / this.rotational_speed)*Math.cos(theta);
			var dx = distance * this.cos_movement_angle;
			var dy = distance * this.sin_movement_angle;
			return {
				x: this.x0 + dx
				, y: this.y0 + dy
			};
		};
	})(SinusoidalVelocityLine);

	return function(type, options) {
		if(type === "stationary") {
			return new Stationary(options);
		} else if(type === "constant_velocity_line") {
			return new ConstantVelocityLine(options);
		} else if(type === "constant_velocity_circle") {
			return new ConstantVelocityCircle(options);
		} else if(type === "sinusoidal_velocity_line") {
			return new SinusoidalVelocityLine(options);
		}
	};
});
