(function(BrawlIO) {
	var close_to = BrawlIO.close_to;

	var make_angle_over = function(angle1, angle2) {
		while(angle1 > angle2) {
			angle1 -= 2*Math.PI;
		}
		while(angle1 < angle2) {
			angle1 += 2*Math.PI;
		}
		return angle1;
	};
	var make_angle_under = function(angle1, angle2) {
		while(angle1 < angle2) {
			angle1 += 2*Math.PI;
		}
		while(angle1 > angle2) {
			angle1 -= 2*Math.PI;
		}
		return angle1;
	};

	var MovementPath = function(options) {
		this.x0 = options.x0;
		this.y0 = options.y0;
		this.debug_info = options.debug_info;
		this.type = "generic_movement_path";
	};
	(function(my) {
		var proto = my.prototype;
		proto.get_position = function(rounds) {
			return {x: 0, y: 0};
		};
		proto.is = function(type) { return this.type === type; };
		proto.serialize = function() {
			return {
				type: this.type
				, x0: this.x0
				, y0: this.y0
			};
		};
	}(MovementPath));
	//========================================
	var Stationary;
	Stationary = function(options) {
		Stationary.superclass.call(this, options);
		this.type = "stationary";
	};
	BrawlIO.oo_extend(Stationary, MovementPath);
	(function(my) {
		var proto = my.prototype;
		proto.get_position = function(rounds) {
			return {
				x: this.x0
				, y: this.y0
			};
		};
		proto.serialize = function() {
			var rv = my.superclass.prototype.serialize.call(this);
			return rv;
		};
		my.deserialize = function(obj) {
			return new my(obj);
		};
	}(Stationary));
	//========================================
	var ConstantVelocityLine;
	ConstantVelocityLine = function(options) {
		ConstantVelocityLine.superclass.call(this, options);
		this.angle = options.angle;
		this.speed = options.speed;
		this.init();
		this.type = "constant_velocity_line";
	};
	BrawlIO.oo_extend(ConstantVelocityLine, MovementPath);
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
			return BrawlIO.create("ray_from_point_and_angle", this.x0, this.y0, this.angle);
		};
		proto.get_vector = function() {
			return BrawlIO.create("vector_from_magnitude_and_angle", this.speed, this.angle);
		};
		proto.get_line = function() {
			return BrawlIO.create("line_from_point_and_angle", this.x0, this.y0, this.angle);
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
		proto.serialize = function() {
			var rv = my.superclass.prototype.serialize.call(this);
			rv.angle = this.angle;
			rv.speed = this.speed;
			return rv;
		};
		my.deserialize = function(obj) {
			return new my(obj);
		};
	}(ConstantVelocityLine));
	//========================================
	var ConstantVelocityCircle;
	ConstantVelocityCircle = function(options) {
		ConstantVelocityCircle.superclass.call(this, options);
		this.movement_angle = options.movement_angle;
		this.speed = options.speed;
		this.rotational_speed = options.rotational_speed;
		this.init();
		this.type = "constant_velocity_circle";
	};
	BrawlIO.oo_extend(ConstantVelocityCircle, MovementPath);
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
				end_angle = make_angle_over(end_angle, this.angle);
			} else {
				end_angle = make_angle_under(end_angle, this.angle);
			}

			var angle_diff = end_angle - this.angle;
			var rounds_taken = angle_diff / this.rotational_speed;
			return rounds_taken;
		};
		proto.get_circle = function() {
			return BrawlIO.create("circle_from_center_and_radius", this.center_x, this.center_y, this.r);
		};
		proto.get_vector = function(round) {
			var angle = this.movement_angle + round * this.rotational_speed;
			return BrawlIO.create("vector_from_magnitude_and_angle", this.speed, angle);
		};
		proto.serialize = function() {
			var rv = my.superclass.prototype.serialize.call(this);
			rv.movement_angle = this.movement_angle;
			rv.speed = this.speed;
			rv.rotational_speed = this.rotational_speed;
			return rv;
		};
		my.deserialize = function(obj) {
			return new my(obj);
		};
	}(ConstantVelocityCircle));
	//========================================
	var SinusoidalVelocityLine;
	SinusoidalVelocityLine = function(options) {
		SinusoidalVelocityLine.superclass.call(this, options);
		this.type = "sinusoidal_velocity_line";
		this.movement_angle = options.movement_angle;
		this.rotational_speed = options.rotational_speed;
		this.speed = options.speed;
		this.initial_theta = options.initial_theta;
		this.initial_circle_theta = options.initial_circle_theta;
		this.init();
	};
	BrawlIO.oo_extend(SinusoidalVelocityLine, MovementPath);
	(function(my) {
		var proto = my.prototype;
		proto.init = function() {
			this.clockwise = this.rotational_speed > 0;
			this.cos_movement_angle = Math.cos(this.movement_angle);
			this.sin_movement_angle = Math.sin(this.movement_angle);

			this.initial_distance = (this.speed / this.rotational_speed)*Math.sin(this.initial_theta);
		};
		proto.get_position = function(rounds) {
			var theta = this.initial_theta + rounds * this.rotational_speed;
			var distance = (this.speed / this.rotational_speed)*Math.sin(theta) - this.initial_distance;

			var dx = distance * this.cos_movement_angle;
			var dy = distance * this.sin_movement_angle;
			return {
				x: this.x0 + dx
				, y: this.y0 + dy
			};
		};
		proto.get_line = function() {
			return BrawlIO.create("line_from_point_and_angle", this.x0, this.y0, this.movement_angle);
		};
		proto.get_line_segment_range = function() {
			//Far minimum distance
			var min_dist = - (this.speed / this.rotational_speed) - this.initial_distance;
			var max_dist = (this.speed / this.rotational_speed) - this.initial_distance;

			var min_dx = min_dist * this.cos_movement_angle;
			var min_dy = min_dist * this.sin_movement_angle;

			var max_dx = max_dist * this.cos_movement_angle;
			var max_dy = max_dist * this.sin_movement_angle;

			var p0 = {
				x: this.x0 + min_dx
				, y: this.y0 + min_dy
			};
			var p1 = {
				x: this.x0 + max_dx
				, y: this.y0 + max_dy
			};
			return BrawlIO.create("line_segment_from_points", p0, p1);
		};

		proto.delta_t_until_x_is = function(x) {
			if(close_to(x, this.x0)) {
				return 0;
			}
			var dx = x - this.x0;
			var distance = dx / this.cos_movement_angle;
			var sin_theta = (distance + this.initial_distance)*(this.rotational_speed / this.speed);
			var theta = Math.asin(sin_theta);
			if(this.clockwise) {
				theta = make_angle_over(theta, this.initial_theta);
			} else {
				theta = make_angle_under(theta, this.initial_theta);
			}
			var rounds = (theta - this.initial_theta)/this.rotational_speed;
			return rounds;
		};
		proto.delta_t_until_y_is = function(y) {
			if(close_to(y, this.y0)) {
				return 0;
			}
			var dy = y - this.y0;
			var distance = dy / this.sin_movement_angle;
			var sin_theta = (distance + this.initial_distance)*(this.rotational_speed / this.speed);
			var theta = Math.asin(sin_theta);
			if(this.clockwise) {
				theta = make_angle_over(theta, this.initial_theta);
			} else {
				theta = make_angle_under(theta, this.initial_theta);
			}
			var rounds = (theta - this.initial_theta)/this.rotational_speed;
			return rounds;
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
		proto.get_movement_angle = function() {
			return this.movement_angle;
		};
		proto.get_rotational_speed = function() {
			return this.rotational_speed;
		};
		proto.serialize = function() {
			var rv = my.superclass.prototype.serialize.call(this);
			rv.movement_angle = this.movement_angle;
			rv.rotational_speed = this.rotational_speed;
			rv.speed = this.speed;
			rv.initial_theta = this.initial_theta;
			rv.initial_circle_theta = this.initial_circle_theta;
			return rv;
		};
		my.deserialize = function(obj) {
			return new my(obj);
		};
	}(SinusoidalVelocityLine));
	//========================================
	var RotatingStationary;
	RotatingStationary = function(options) {
		RotatingStationary.superclass.call(this, options);
		this.type = "rotating_stationary";
		this.theta0 = options.theta0;
		this.rotational_speed = options.rotational_speed;
		this.clockwise = this.rotational_speed > 0;
	};
	BrawlIO.oo_extend(RotatingStationary, MovementPath);
	(function(my) {
		var proto = my.prototype;
		proto.get_position = function(rounds) {
			return {
				x: this.x0
				, y: this.y0
			};
		};
		proto.delta_t_until_theta_is = function(theta) {
			if(this.clockwise) {
				theta = make_angle_over(theta, this.theta0);
			} else {
				theta = make_angle_under(theta, this.theta0);
			}
			var delta_theta = theta - this.theta0;
			return delta_theta / this.rotational_speed;
		};
		proto.serialize = function() {
			var rv = my.superclass.prototype.serialize.call(this);
			rv.theta0 = this.theta0;
			rv.rotational_speed = this.rotational_speed;
			return rv;
		};
		my.deserialize = function(obj) {
			return new my(obj);
		};
	}(RotatingStationary));

	BrawlIO.define_factory("stationary_path", function(options) {
		return new Stationary(options);
	});
	BrawlIO.define_factory("constant_velocity_line_path", function(options) {
		return new ConstantVelocityLine(options);
	});
	BrawlIO.define_factory("constant_velocity_circle_path", function(options) {
		return new ConstantVelocityCircle(options);
	});
	BrawlIO.define_factory("sinusoidal_velocity_line_path", function(options) {
		return new SinusoidalVelocityLine(options);
	});
	BrawlIO.define_factory("rotating_stationary_path", function(options) {
		return new RotatingStationary(options);
	});

	BrawlIO.define_factory("deserialized_movement_path", function(obj) {
		if(obj.type === "stationary") {
			return Stationary.deserialize(obj);
		} else if(obj.type === "constant_velocity_line") {
			return ConstantVelocityLine.deserialize(obj);
		} else if(obj.type === "constant_velocity_circle") {
			return ConstantVelocityCircle.deserialize(obj);
		} else if(obj.type === "sinusoidal_velocity_line") {
			return SinusoidalVelocityLine.deserialize(obj);
		} else if(obj.type === "rotating_stationary") {
			return RotatingStationary.deserialize(obj);
		}
	});
}(BrawlIO));
