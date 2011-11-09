define(function(require) {
	require("vendor/underscore");
	var StaticObstacle = require("game/models/obstacles/obstacle");
	var shape_factory = require("game/geometry/shapes/shape_factory");
	var path_utils = require("game/geometry/movement_paths/path_utils");
	var create_movement_path = require("game/geometry/movement_paths/movement_path");
	var oo_utils = require("game/util/object_oriented");

	var error_tolerance = 0.00001;

	var close_to = function(a, b) {
		return Math.abs(a-b) < error_tolerance;
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
			var my_polygon = this.get_shape();
			var touch_events = _.map(line_segments,
										function(line_segment) {
											var normal = my_polygon.get_normal(line_segment);
											var event_info = path_utils.next_event_with_line_segment_and_moving_circle(line_segment, normal, path, shape.get_radius());

											if(event_info === false) {
												return false;
											} else if(event_info === true) {
												return _.extend(event_info, {
													line_segment: line_segment
												});
											} else {
												return _.extend(event_info, {
													line_segment: line_segment
												});
											}
										})
									.filter(function(intersection) {
										return intersection !== false;
									});

			var next_touch_event = false;
			touch_events.forEach(function(touch_event) {
				if(next_touch_event === false || touch_event.time < next_touch_event.time) {
					next_touch_event = touch_event;
				}
			});
			if(next_touch_event === false) { return false; }
			else { return next_touch_event; }
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
				restricted_path = path_utils.restrict_path(line_segment, normal, restricted_path, shape.get_radius());
			});
			return restricted_path;
		};

		proto.is_touching = function(moving_object, position) {
			var shape = moving_object.get_shape();
			if(!shape.is("circle")) {
				console.error("Only circles are supported!");
			}

			var line_segments = this.get_line_segments();
			var radius = shape.get_radius();
			for(var i = 0, len = line_segments.length; i<len; i++) {
				var line_segment = line_segments[i];
				if(line_segment.distance_to(position) <= radius + error_tolerance) { 
					return true;
				}
			}
			return false;
		};
	}(PolygonObstacle));

	return PolygonObstacle;
});
