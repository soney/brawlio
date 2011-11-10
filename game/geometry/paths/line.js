define(function(require) {
	require("vendor/underscore");
	var Path = require("game/geometry/paths/path");
	var Vector = require("game/geometry/paths/vector");
	var oo_utils = require("game/util/object_oriented");

	var close_to = function(a, b) {
		return Math.abs(a-b) < 0.00001;
	};

	var Line = function(options) {
		Line.superclass.call(this, _.extend({type: "line"}, options));
		this.a = options.a;
		this.b = options.b;
		this.c = options.c;
	};
	oo_utils.extend(Line, Path);

	(function(my) {
		my.fromPointAndAngle = function(x0, y0, theta) {
			return new Line({
				a: Math.sin(theta)
				, b: -Math.cos(theta)
				, c: y0*Math.cos(theta) - x0*Math.sin(theta)
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
		var get_line = function(obj) {
			//This function returns the line of a line segment and ray
			if(obj.is("line")) {
				return obj;
			} else if(obj.is("line_segment")) {
				return obj.get_line();
			} else if(obj.is("ray")) {
				return obj.get_line();
			}
		};
		proto.intersects_with = function(other, my_radius) {
			//TODO: Correct for corner cases in line segments with radiuses
			var my_line = get_line(this);
			var other_line = get_line(other);

			var xi, yi;
			var denom = my_line.a*other_line.b - my_line.b * other_line.a;
			if(denom === 0) {
				if(my_radius === undefined) {
					if(my_line.a===other_line.a && my_line.b===other_line.b && my_line.c===other_line.c) {
						return true;
					} else {
						return false;
					}
				} else {
					var distance = Math.abs(my_line.c - other_line.c);
					if(distance < my_radius) {
						return true;
					} else {
						return false;
					}
				}
			} else {
				xi_numer = (my_line.b*other_line.c - other_line.b*my_line.c);
				yi_numer = (other_line.a*my_line.c - my_line.a*other_line.c);
			}
			var intersection_x = xi_numer/denom;
			var intersection_y = yi_numer/denom;


			if(!this.includes_point(intersection_x, intersection_y) || !other.includes_point(intersection_x, intersection_y)) {
				return false;
			}
			if(my_radius === undefined) {
				return [{
					x: intersection_x
					, y: intersection_y
				}];
			} else {
				var my_theta = this.get_theta();
				var other_theta = other.get_theta();
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
		proto.distance_to = function(point) {
			return Math.abs(this.a*point.x + this.b*point.y + this.c) / Math.sqrt(Math.pow(this.a, 2)+Math.pow(this.b, 2));
		};
		proto.get_theta = function() {
			return this.b === 0 ? (this.a > 0 ? Math.PI/2 : -Math.PI/2) : Math.atan2(-this.a, this.b);
		};
		proto.includes_point = function(x,y) {
			return close_to(this.a * x + this.b * y + this.c, 0);
		};
		proto.get_normals = function() {
			var theta = this.get_theta();
			var theta_1 = theta + Math.PI/2;
			var theta_2 = theta - Math.PI/2;

			return [
				Vector.fromMagnitudeAndTheta(1, theta_1)
				, Vector.fromMagnitudeAndTheta(1, theta_2)
			];
		};
		proto.shift_by = function(x,y) {
			var new_c = this.c + this.a * x + this.b * y;
			return new Line({a: this.a, b: this.b, c: new_c});
		};
	})(Line);

	return Line;
});
