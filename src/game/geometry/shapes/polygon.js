(function(BrawlIO) {
	var Shape = BrawlIO.get_type("Shape");
	var _ = BrawlIO._;

	var Polygon = function(options) {
		this.super_constructor.call(this, options);
		this.inverted = options.inverted;
		var points = options.points;

		this.line_segments = _.map(points, function(start_point, index) {
			var end_point_index = (index+1) % points.length;
			var end_point = points[end_point_index];
			return BrawlIO.create("line_segment_from_points", start_point, end_point);
		});

		this.name="polygon";
	};
	BrawlIO.oo_extend(Polygon, Shape);

	(function(my) {
		var proto = my.prototype;
		proto.get_line_segments = function() {
			return this.line_segments;
		};
		proto.get_normal = function(line_segment) {
			var other_line_segments = _.without(this.get_line_segments(), line_segment);
			var normals = line_segment.get_line().get_normals();
			var line_center_point = line_segment.get_center_point();
			var normal_rays = _.map(normals, function(normal) {
									return BrawlIO.create("ray_from_point_and_vector", line_center_point.x, line_center_point.y, normal);
								});
			var inverted = this.inverted;
			var outward_facing = _.map(normal_rays, function(normal_ray) {
				var nc = 0;
				_.forEach(other_line_segments, function(segment) {
					if(segment.intersects_with(normal_ray)) {
						nc++;
					}
				});
				var even_crossings = nc%2 === 0;
				if(inverted) {
					return !even_crossings;
				} else {
					return even_crossings;
				}
			});
			//Num crossings should be even headed outside, unless the shape is inverted
			var outward_facing_index = _.indexOf(outward_facing, true);
			return normals[outward_facing_index];
		};
	}(Polygon));

	BrawlIO.define_type("Polygon", Polygon);
	BrawlIO.define_factory("polygon", function(options) {
		return new Polygon(options);
	});
}(BrawlIO));
