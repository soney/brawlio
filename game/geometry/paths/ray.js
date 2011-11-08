define(function(require) {
	var Path = require("game/geometry/paths/path");
	var Line = require("game/geometry/paths/line");
	var oo_utils = require("game/util/object_oriented");

	var between = function(x, start, end) {
		return (x >= start && x<=end) || (x >= end && x<=start);
	};

	var Ray = function(options) {
		Ray.superclass.call(this, _.extend({type: "ray"}, options));
		this.p0 = options.p0;
		this.theta = options.theta;
		this.along_line = Line.fromPointAndAngle(this.p0.x, this.p0.y, this.theta);
	};
	oo_utils.extend(Ray, Path);


	(function(my) {
		my.fromPointAndAngle = function(x, y, theta) {
			return new Ray({p0: {x: x, y: y}, theta: theta});
		};
		var proto = my.prototype;
		proto.intersects_with = function(other, my_radius) {
			return Line.prototype.intersects_with.apply(this, arguments);
		};
		proto.get_theta = function() {
			return this.theta;
		};
		proto.get_line = function() {
			return this.along_line;
		};
		proto.includes_point = function(x,y) {
			var line = this.get_line();
			var theta = this.get_theta();
			if(!line.includes_point(x,y)) {
				return false;
			}
			var point_along_ray = {
				x: this.p0.x + Math.cos(theta)
				, y: this.p0.y + Math.sin(theta)
			};
			var x_direction = point_along_ray.x - this.p0.x; 
			var y_direction = point_along_ray.y - this.p0.y; 
			var pt_x_direction = x - this.p0.x;
			var pt_y_direction = y - this.p0.y;
			var right_x_direction = x_direction * pt_x_direction >= 0; //If they are both positive or both negative
			var right_y_direction = y_direction * pt_y_direction >= 0; //If they are both positive or both negative

			return right_x_direction && right_y_direction;
		};
	}(Ray));

	return Ray;
});
