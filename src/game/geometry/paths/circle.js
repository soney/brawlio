(function(BrawlIO) {
	var _ = BrawlIO._;
	var Path = BrawlIO.get_type("Path");

	var Circle;
	Circle = function(options) {
		Circle.superclass.call(this, _.extend({type: "circle"}, options));
		this.cx = options.center_x;
		this.cy = options.center_y;
		this.r = options.radius;
	};
	BrawlIO.oo_extend(Circle, Path);
	var error_tolerance = 0.000001;

	(function(my) {
		my.fromPointAngleAndVelocity = function(x0, y0, theta0, v_translational, v_theta ) {
			var r = v_translational/v_theta;
			return new Circle({
				center_x: x0 + r*Math.sin(theta0)
				, center_y: y0 + r*Math.cos(theta0)
				, r: v_translational / v_theta
			});
		};
		my.fromCenterAndRadius = function(x,y,radius) {
			return new Circle({center_x: x, center_y: y, radius: radius});
		};
		var proto = my.prototype;
		proto.get_cx = function() {
			return this.cx;
		};
		proto.get_cy = function() {
			return this.cy;
		};
		proto.get_radius = function() {
			return this.r;
		};
		proto.add_radius = function(r) {
			return my.fromCenterAndRadius(this.get_cx(), this.get_cy(), this.get_radius() + r);
		};
		proto.intersects_with_line = function(line) {
			if(line.distance_to({x: this.get_cx(), y: this.get_cy()}) > this.get_radius() + error_tolerance) {
				return false;
			}
			// Pretend my center is at 0,0
			var shifted_line = line.shift_by(this.get_cx(), this.get_cy());
			var a = shifted_line.a
				, b = shifted_line.b
				, c = shifted_line.c
				, r = this.get_radius();
			var discriminant = Math.pow(r, 2) * ( Math.pow(a, 2) + Math.pow(b, 2) ) - Math.pow(c, 2);
			if(discriminant < 0) {
				return false;
			} else {
				var unshifted_points = [];
				var denom = Math.pow(a, 2) + Math.pow(b, 2);
				if(discriminant === 0) {
					var x = -a*c/denom;
					var y = -b*c/denom;
					unshifted_points.push({ x: x, y: y });
				} else if(discriminant > 0) {
					var sqrt_discriminant = Math.sqrt(discriminant);
					var x1 = (-a*c + b * sqrt_discriminant)/denom;
					var y1 = (-b*c + a * sqrt_discriminant)/denom;

					var x2 = (-a*c - b * sqrt_discriminant)/denom;
					var y2 = (-b*c - a * sqrt_discriminant)/denom;
					unshifted_points.push({ x: x1, y: y1 });
					unshifted_points.push({ x: x2, y: y2 });
				}
				var shift_x = this.get_cx();
				var shift_y = this.get_cy();
				return _.map(unshifted_points, function(point) {
					return {
						x: point.x + shift_x
						, y: point.y + shift_y
					};
				});
			}
		};
		proto.intersects_with_line_segment = function(line_segment) {
			var line = line_segment.get_line();
			var intersection_points = this.intersects_with_line(line);
			if(intersection_points === false) { return false; }
			return _.filter(intersection_points, function(intersection_point) {
				return line_segment.includes_point(intersection_point.x, intersection_point.y);
			});
		};
	}(Circle));

	BrawlIO.define_type("Circle", Circle);
	BrawlIO.define_factory("circle_from_center_and_radius", function() {
		return Circle.fromCenterAndRadius.apply(Circle, arguments);
	});
}(BrawlIO));
