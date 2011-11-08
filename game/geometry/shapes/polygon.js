define(function(require) {
	var Shape = require("game/geometry/shapes/shape");
	var oo_utils = require("game/util/object_oriented");
	var path_factory = require("game/geometry/paths/path_factory");

	var Polygon = function(options) {
		Polygon.superclass.call(this, options);
		this.inverted = options.inverted;
		var points = options.points;

		this.line_segments = _.map(points, function(start_point, index) {
			var end_point_index = (index+1) % points.length;
			var end_point = points[end_point_index];
			return path_factory("line_segment_from_points", start_point, end_point);
		});

		this.name="polygon";
	};
	oo_utils.extend(Polygon, Shape);

	(function(my) {
		var proto = my.prototype;
		proto.get_line_segments = function() {
			return this.line_segments;
		};
	})(Polygon);

	return function(options) {
		return new Polygon(options);
	};
});
