define([], function() {
	var close_to = function(a, b) {
		return Math.abs(a-b) < 0.00001;
	};
	var MovementPath = function(options) {
		this.start = {
			x: options.start.x
			, y: options.start.y
			, theta: options.start.theta
		};
		this.translational_speed = options.translational_speed;
		this.translational_angle = options.translational_angle;
		this.rotation_speed = options.rotation_speed;
		this.movement_angle = options.movement_angle;
	};

	(function(my) {
		var proto = my.prototype;
		proto.get_position = function(delta_t) {
			if(close_to(this.translational_speed, 0)) {
				return {
					x: this.start.x
					, y: this.start.y
					, theta: this.get_theta(delta_t)
				};
			} else if(close_to(this.rotation_speed, 0)) {
				var movement_theta = this.get_movement_theta(delta_t);
				return {
					x: this.start.x + this.translational_speed * delta_t * Math.cos(movement_theta)
					, y: this.start.y + this.translational_speed * delta_t * Math.sin(movement_theta)
					, theta: this.get_theta(delta_t)
				};
			} else {
				var r = this.translational_speed / (1.0*this.rotation_speed);
				var movement_theta = this.start.theta + this.translational_angle;
				var center_x = this.start.x + r*Math.sin(-movement_theta);
				var center_y = this.start.y + r*Math.cos(-movement_theta);
				var delta_theta = this.rotation_speed * delta_t;
				var new_movement_theta = movement_theta + delta_theta;

				return {
					x: center_x + r*Math.cos(new_movement_theta-Math.PI/2)
					, y: center_y + r*Math.sin(new_movement_theta-Math.PI/2)
					, theta: this.get_theta(delta_t)
				};
				return rv;
			}
		};
		proto.get_theta = function(delta_t) {
			return this.start.theta + this.rotation_speed * delta_t;
		};
		proto.get_movement_theta = function(delta_t) {
			return this.movement_angle === undefined ? this.get_theta(delta_t) + this.translational_angle : this.movement_angle;
		};
		proto.delta_t_until_x_is = function(x,from_t) {
			if(close_to(this.translational_speed, 0)) {
				if(close_to(this.start.x, x)) {
					return from_t;
				} else { return false; }
			} else if(close_to(this.rotation_speed, 0)) {
				var angle_multiplier = Math.cos(this.translational_angle + this.start.theta);
				if(close_to(angle_multiplier, 0)) {
					if(close_to(this.start.x, x)) {
						return from_t;
					} else {
						return false;
					}
				} else {
					return (x - this.start.x)/(this.translational_speed * angle_multiplier);
				}
			}
			return false;
		};
		proto.delta_t_until_y_is = function(y,from_t) {
			if(close_to(this.translational_speed, 0)) {
				if(close_to(this.start.y, y)) {
					return from_t;
				} else { return false; }
			} else if(close_to(this.rotation_speed, 0)) {
				var angle_multiplier = Math.sin(this.translational_angle + this.start.theta);
				if(close_to(angle_multiplier, 0)) {
					if(close_to(this.start.y, y)) {
						return from_t;
					} else {
						return false;
					}
				} else {
					return (y - this.start.y)/(this.translational_speed * angle_multiplier);
				}
			}
			return false;
		};
		proto.delta_t_until_at = function(x,y,from_t) {
			if(from_t === undefined) {
				from_t = 0;
			}
			var x_delta_t = this.delta_t_until_x_is(x, from_t);
			if(x_delta_t < 0) { x_delta_t = false; }
			var y_delta_t = this.delta_t_until_y_is(y, from_t);
			if(y_delta_t < 0) { y_delta_t = false; }

			if(x_delta_t === false || y_delta_t === false) { return false; }

			return Math.max(x_delta_t, y_delta_t);
		};
	})(MovementPath);

	var create_movement_path = function(options, based_on) {
		var based_on = based_on|| {start:{x:0,y:0,theta:0},translational_speed:0,translational_angle:0,rotation_speed:0};
		var x0 = from_default(options.x0, based_on.start.x);
		var y0 = from_default(options.y0, based_on.start.y);
		var theta0 = from_default(options.theta0, based_on.start.theta);
		var trans_speed = from_default(options.translational_speed, based_on.translational_speed);
		var trans_angle = from_default(options.translational_angle, based_on.translational_angle);
		var rotation_speed = from_default(options.rotation_speed, based_on.rotation_speed);

		var path = new MovementPath({
			start: {x: x0, y: y0, theta: theta0}
			, translational_speed: trans_speed, translational_angle: trans_angle, rotation_speed: rotation_speed
		});
		return path;
	};
	var from_default = function(specified, def) {
		return specified === undefined ? def : specified;
	};

	return create_movement_path;
});
