(function(BrawlIO) {
	var _ = BrawlIO._;
	var Path = BrawlIO.get_type("Path");

	var Vector = function(options) {
		this.super_constructor.call(this, _.extend({type: "vector"}, options));
		this.x = options.x;
		this.y = options.y;
	};
	BrawlIO.oo_extend(Vector, Path);

	(function(my) {
		my.fromComponents = function(x,y) {
			return new Vector({x: x, y: y});
		};
		my.fromMagnitudeAndTheta = function(magnitude, theta) {
			var x = magnitude * Math.cos(theta);
			var y = magnitude * Math.sin(theta);
			return new Vector({x: x, y: y});
		};
		my.fromPoints = function(x0,y0,x1,y1) {
			var x = x1-x0;
			var y = y1-y0;
			return new Vector({x:x, y:y});
		};
		var proto = my.prototype;
		proto.normalize = function(magnitude) {
			if(magnitude === undefined) {
				magnitude = 1;
			}
			return my.fromMagnitudeAndTheta(magnitude, this.get_theta());
		};
		proto.neg = function() {
			return my.fromComponents(-this.x, -this.y);
		};
		proto.get_magnitude = function() {
			return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
		};
		proto.get_theta = function() {
			return Math.atan2(this.y, this.x);
		};
		proto.add = function(other_vector) {
			return my.fromComponents(this.x + other_vector.x, this.y + other_vector.y);
		};
		proto.subtract = function(other_vector) {
			return my.fromComponents(this.x - other_vector.x, this.y - other_vector.y);
		};
		proto.cross = function(other_vector) {
			return this.x * other_vector.y - other_vector.x * this.y;
		};
		proto.dot = function(other_vector) {
			return this.x * other_vector.x + this.y * other_vector.y;
		};
		proto.get_x = function() {
			return this.x;
		};
		proto.get_y = function() {
			return this.y;
		};
	}(Vector));


	BrawlIO.define_type("Vector", Vector);
	BrawlIO.define_factory("line_segment_from_points", function() {
		return Vector.fromMagnitudeAndTheta.apply(Vector, arguments);
	});
	BrawlIO.define_factory("line_segment_from_points", function() {
		return Vector.fromPoints.apply(Vector, arguments);
	});
}(BrawlIO));
