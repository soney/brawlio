(function(BrawlIO) {
	var Path = BrawlIO.get_type("Path");
	var Line = BrawlIO.get_type("Line");
	var _ = BrawlIO._;

	var between = function(x, start, end) {
		var et = 0.000001; //error tolerance
		return (x >= start-et && x<=end+et) || (x >= end-et && x<=start+et);
	};

	var LineSegment;
	LineSegment = function(options) {
		LineSegment.superclass.call(this, _.extend({type: "line_segment"}, options));
		this.p0 = options.p0;
		this.p1 = options.p1;
		this.along_line = Line.fromPoints(this.p0, this.p1);
	};
	BrawlIO.oo_extend(LineSegment, Path);


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
		proto.shift_by = function(x,y) {
			var new_p0 = {
				x: this.p0.x + x
				, y: this.p0.y + y
			};
			var new_p1 = {
				x: this.p1.x + x
				, y: this.p1.y + y
			};
			return my.fromPoints(new_p0, new_p1);
		};
		proto.shift_by_vector = function(vector) {
			return this.shift_by(vector.get_x(), vector.get_y());
		};
	}(LineSegment));

	BrawlIO.define_type("LineSegment", LineSegment);
	BrawlIO.define_factory("line_segment_from_points", function() {
		return LineSegment.fromPoints.apply(LineSegment, arguments);
	});
}(BrawlIO));
