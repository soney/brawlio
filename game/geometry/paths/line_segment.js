define(function(require) {
	var Path = require("game/geometry/paths/path");
	var Line = require("game/geometry/paths/line");
	var oo_utils = require("game/util/object_oriented");

	var between = function(x, start, end) {
		var et = 0.000001; //error tolerance
		return (x >= start-et && x<=end+et) || (x >= end-et && x<=start+et);
	};

	var LineSegment = function(options) {
		LineSegment.superclass.call(this, _.extend({type: "line_segment"}, options));
		this.p0 = options.p0;
		this.p1 = options.p1;
		this.along_line = Line.fromPoints(this.p0, this.p1);
	};
	oo_utils.extend(LineSegment, Path);


	(function(my) {
		my.fromPoints = function(p0, p1) {
			return new LineSegment({p0: p0, p1: p1});
		};
		var proto = my.prototype;
		proto.intersects_with = function(other, my_radius) {
			return Line.prototype.intersects_with.apply(this, arguments);
		};
		proto.get_theta = function() {
			return this.along_line.get_theta();
		};
		proto.get_line = function() {
			return this.along_line;
		};
		proto.includes_point = function(x,y) {
			var line = this.get_line();
			if(!line.includes_point(x,y)) {
				return false;
			}
			return between(x, this.p0.x, this.p1.x) && between(y, this.p0.y, this.p1.y);
		};
		proto.distance_to = function(point) {
			var line = this.get_line();
			return line.distance_to(point);
		};
		proto.get_center_point = function() {
			return {
				x: (this.p0.x + this.p1.x)/2
				, y: (this.p0.y + this.p1.y)/2
			};
		};
	}(LineSegment));

	return LineSegment;
});
