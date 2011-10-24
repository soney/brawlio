define([], function() {
	var close_to = function(a, b) {
		return Math.abs(a-b) < 0.00001;
	};
	var MovingObjectState = function(options) {
		this.start = {
			x: options.start.x
			, y: options.start.y
			, theta: options.start.theta
		};
		this.translational_speed = options.translational_speed;
		this.translational_angle = options.translational_angle;
		this.rotation_speed = options.rotation_speed;
	};

	(function(my) {
		var proto = my.prototype;
		proto.get_position = function(delta_t) {
			if(close_to(this.translational_speed, 0)) {
				return {
					x: this.start.x
					, y: this.start.y
					, theta: this.start.theta + this.rotation_speed * delta_t
				};
			} else if(close_to(this.rotation_speed, 0)) {
				var theta = this.start.theta - this.translational_angle;
				return {
					x: this.start.x + this.translational_speed * delta_t * Math.cos(theta)
					, y: this.start.y - this.translational_speed * delta_t * Math.sin(theta)
					, theta: this.start.theta
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
					, theta: this.start.theta + delta_theta
				};
				return rv;
			}
		};
		proto.delta_t_until_x_is = function(x,from_t) {
			if(close_to(this.translational_speed, 0)) {
				if(close_to(this.start.x, x)) {
					return from_t;
				}
			} else if(close_to(this.rotation_speed, 0)) {
				if(close_to(Math.abs(this.start.theta), Math.PI/2)) {
					if(close_to(this.start.x, x)) {
						return from_t;
					} else {
						return false;
					}
				} else {
					return (x - this.start.x)/(this.translational_speed * Math.cos(this.translational_angle));
				}
			}
			return false;
		};
		proto.delta_t_until_y_is = function(y,from_t) {
		};
		proto.delta_t_until_at = function(x,y,from_t) {
			if(from_t === undefined) {
				from_t = 0;
			}
			return this.delta_t_until_x_is(x, from_t);
		};
	})(MovingObjectState);


	return MovingObjectState;
});
