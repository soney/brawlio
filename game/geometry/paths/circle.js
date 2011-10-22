define(['game/geometry/paths/path'], function(Path) {
	var Circle = function(options) {
		this.cx = options.center_x;
		this.cy = options.center_y;
		this.r = options.radius;
	};

	(function(my) {
		my.fromPointAngleAndVelocity = function(x0, y0, theta0, v_translational, v_theta ) {
			return new Circle({
				center_x: x0 + r*Math.sin(theta0)
				, center_y: y0 + r*Math.cos(theta0)
				, r: v_translational / v_theta
			});
		};
	})(Circle);

	return Circle;
});
