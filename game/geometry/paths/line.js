define(['game/geometry/paths/path'], function(Path) {
	var Line = function(options) {
		this.a = options.a;
		this.b = options.b;
		this.c = options.c;
	};

	(function(my) {
		my.fromPointAndAngle = function(x0, y0, theta) {
			return new Line({
				a: Math.sin(theta)
				, b: Math.cos(theta)
				, c: -y0*Math.cos(theta) - x0*Math.sin(theta)
			});
		};
		my.fromPoints = function(p0, p1) {
			return new Line({
				a: p0.y - p1.y
				, b: p1.x - p0.x
				, c: p0.x*p1.y - p1.x*p0.y
			});
		};

		var proto = my.prototype;
		proto.intersects_with = function(other, my_radius) {
			var xi, yi;
			var denom = this.a*other.b - this.b * other.a;
			if(denom === 0) {
				if(my_radius === undefined) {
					if(this.a===other.a && this.b===other.b && this.c===other.c) {
						return true;
					} else {
						return false;
					}
				} else {
					var distance = Math.abs(this.c - other.c);
					if(distance < my_radius) {
						return true;
					} else {
						return false;
					}
				}
			} else {
				xi_numer = (this.b*other.c - other.b*this.c);
				yi_numer = (other.a*this.c - this.a*other.c);
			}
			var intersection_x = xi_numer/denom;
			var intersection_y = yi_numer/denom;
			if(my_radius === undefined) {
				return {
					x: intersection_x
					, y: intersection_y
				};
			} else {
				var my_theta = this.b === 0 ? (this.a > 0 ? Math.PI/2 : -Math.PI/2) : Math.atan(-this.a/this.b);
				var other_theta = other.b === 0 ? (other.a > 0 ? Math.PI/2 : -Math.PI/2) : Math.atan(-other.a/other.b);
				var delta_denom = Math.sin(my_theta)*Math.cos(other_theta) - Math.sin(other_theta)*Math.cos(my_theta);
				var delta_x = my_radius*Math.cos(my_theta)/delta_denom;
				var delta_y = my_radius*Math.sin(my_theta)/delta_denom;
				return [{
						x: intersection_x - delta_x
						, y: intersection_y - delta_y
					}, {
						x: intersection_x + delta_x
						, y: intersection_y + delta_y
					}];
			}
		};

	})(Line);

	return Line;
});
