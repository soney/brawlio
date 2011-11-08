define(function(require) {
	var Path = require("game/geometry/paths/path");
	var oo_utils = require("game/util/object_oriented");
	var Circle = function(options) {
		Circle.superclass.call(this, _.extend({type: "Circle"}, options));
		this.cx = options.center_x;
		this.cy = options.center_y;
		this.r = options.radius;
	};
	oo_utils.extend(Circle, Path);

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
