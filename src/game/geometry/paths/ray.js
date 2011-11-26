(function(BrawlIO) {
	var Path = BrawlIO.get_type("Path");
	var Line = BrawlIO.get_type("Line");
	var _ = BrawlIO._;

	var Ray;
	Ray = function(options) {
		Ray.superclass.call(this, _.extend({type: "ray"}, options));
		this.p0 = options.p0;
		this.theta = options.theta;
		this.along_line = Line.fromPointAndAngle(this.p0.x, this.p0.y, this.theta);
	};
	BrawlIO.oo_extend(Ray, Path);


	(function(my) {
		my.fromPointAndAngle = function(x, y, theta) {
			return new Ray({p0: {x: x, y: y}, theta: theta});
		};
		my.fromPointAndVector = function(x,y,vector) {
			var theta = vector.get_theta();
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
		proto.distance_to = function(point) {
			var line = this.get_line();
			return line.distance_to(point);
		};
	}(Ray));

	BrawlIO.define_type("Ray", Ray);
	BrawlIO.define_factory("ray_from_point_and_angle", function() {
		return Ray.fromPointAndAngle.apply(Ray, arguments);
	});
	BrawlIO.define_factory("ray_from_point_and_vector", function() {
		return Ray.fromPointAndVector.apply(Ray, arguments);
	});
}(BrawlIO));
