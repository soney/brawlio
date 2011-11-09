define(function(require) {
	require("vendor/underscore");
	var StaticObstacle = require("game/models/obstacles/obstacle");
	var shape_factory = require("game/geometry/shapes/shape_factory");
	var path_utils = require("game/geometry/movement_paths/path_utils");
	var create_movement_path = require("game/geometry/movement_paths/movement_path");
	var oo_utils = require("game/util/object_oriented");

	var close_to = function(a, b) {
		return Math.abs(a-b) < 0.00001;
	};

	var PolygonObstacle = function(options) {
		var shape = shape_factory("polygon", {points: options.points, inverted: options.inverted});
		PolygonObstacle.superclass.call(this, {shape: shape});
	};
	oo_utils.extend(PolygonObstacle, StaticObstacle);

	(function(my) {
		var proto = my.prototype;
		proto.get_line_segments = function() {
			return this.shape.get_line_segments();
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

		proto.restrict_path = function(moving_object, path) {
			var shape = moving_object.get_shape();
			if(!shape.is("circle")) {
				console.error("Only circles are supported!");
			}

			var restricted_path = path;
			var line_segments = this.get_line_segments();
			var my_polygon = this.get_shape();
			_.forEach(line_segments, function(line_segment) {
				var normal = my_polygon.get_normal(line_segment);
				restricted_path = path_utils.restrict_path(line_segment, restricted_path, shape.get_radius(), normal);
			});
			return restricted_path;
		};
	})(PolygonObstacle);

	return PolygonObstacle;
});
