define([], function() {
	function close_to(a, b) {
		return Math.abs(a-b) < 0.000000001;
	};
	var MovingObjectState = function(options) {
		this.start = {
			x: options.start.x
			, y: options.start.y
			, theta: options.start.theta
		};
		this.translational_velocity = options.translational_velocity;
		this.rotational_velocity = options.rotational_velocity;
	};

	(function(my) {
		var proto = my.prototype;
		proto.get_position = function(delta_t) {
			if(close_to(this.translational_velocity, 0)) {
				return {
					x: this.start.x
					, y: this.start.y
					, theta: this.start.theta + this.rotational_velocity * delta_t
				};
			} else if(close_to(this.rotational_velocity, 0)) {
				return {
					x: this.start.x + this.translational_velocity * delta_t * Math.cos(this.start.theta)
					, y: this.start.y - this.translational_velocity * delta_t * Math.sin(this.start.theta)
					, theta: this.start.theta
				};
			} else {
				var r = this.translational_velocity / (1.0*this.rotational_velocity);
				var center_x = this.start.x + r*Math.sin(this.start.theta);
				var center_y = this.start.y + r*Math.cos(this.start.theta);
				return {
					x: center_x + r*Math.sin(this.start.theta + this.rotational_velocity*delta_t)
					, y: center_y + r*Math.cos(this.start.theta + this.rotational_velocity*delta_t)
					, theta: this.start.theta + this.rotational_velocity * delta_t
				};
			}
		};
	})(MovingObjectState);


	return MovingObjectState;
});
