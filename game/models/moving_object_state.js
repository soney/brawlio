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
		this.translational_speed = options.translational_speed;
		this.translational_angle = options.translational_angle;
		this.rotational_speed = options.rotational_speed;
	};

	(function(my) {
		var proto = my.prototype;
		proto.get_position = function(delta_t) {
			console.log(this.rotational_speed);
			if(close_to(this.translational_speed, 0)) {
				return {
					x: this.start.x
					, y: this.start.y
					, theta: this.start.theta + this.rotational_speed * delta_t
				};
			} else if(close_to(this.rotational_speed, 0)) {
				var theta = this.start.theta - this.translational_angle;
				return {
					x: this.start.x + this.translational_speed * delta_t * Math.cos(theta)
					, y: this.start.y - this.translational_speed * delta_t * Math.sin(theta)
					, theta: this.start.theta
				};
			} else {
				var r = this.translational_speed / (1.0*this.rotational_speed);
				var center_x = this.start.x + r*Math.sin(this.start.theta);
				var center_y = this.start.y + r*Math.cos(this.start.theta);
				return {
					x: center_x + r*Math.sin(this.start.theta + this.rotational_speed*delta_t)
					, y: center_y + r*Math.cos(this.start.theta + this.rotational_speed*delta_t)
					, theta: this.start.theta + this.rotational_speed * delta_t
				};
			}
		};
	})(MovingObjectState);


	return MovingObjectState;
});
