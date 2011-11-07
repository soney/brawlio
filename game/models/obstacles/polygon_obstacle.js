define(function(require) {
	require("vendor/underscore");
	var StaticObstacle = require("game/models/obstacles/obstacle");
	var path_utils = require("game/geometry/movement_paths/path_utils");
	var oo_utils = require("game/util/object_oriented");

	var close_to = function(a, b) {
		return Math.abs(a-b) < 0.00001;
	};

	var PolygonObstacle = function(options) {
		PolygonObstacle.superclass.call(this, options);
		this.path = options.path;
	};
	oo_utils.extend(PolygonObstacle, StaticObstacle);

	(function(my) {
		var proto = my.prototype;

		proto.get_line_segments = function() {
			var path = this.path;
			var rv = path.map(function(start_point, index) {
				var end_point_index = (index+1) % path.length;
				var end_point = path[end_point_index];
				return { start: start_point , end: end_point };
			});
			return rv;
		};

		proto.next_touch_event = function(moving_object, moving_object_state) {
			var shape = moving_object.get_shape();

			if(!shape.is("circle")) {
				console.error("Only circles are supported!");
			}

			var line_segments = this.get_line_segments();
			var path = moving_object_state.get_path();
			var intersections = _.map(line_segments,
										function(line_segment) {
											var time = path_utils.line_segment_hits_moving_circle(line_segment, path, shape.get_radius());
											if(time === false) {
												return false;
											} else if(time === true) {
												return {
													time: 0
													, line_segment: line_segment
												};
											} else {
												return {
													time: time
													, line_segment: line_segment
												};
											}
										})
									.filter(function(intersection) {
										return intersection !== false;
									});

			var next_intersection = false;
			intersections.forEach(function(intersection) {
				if(next_intersection === false || next_intersection.time > intersection.time) {
					next_intersection = intersection;
				}
			});
			if(next_intersection === false) { return false; }
			else { return next_intersection.time; }
		};

	})(PolygonObstacle);

	return PolygonObstacle;
});
