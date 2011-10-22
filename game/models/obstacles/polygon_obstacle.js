define(['game/models/obstacles/obstacle', 'game/geometry/paths/line', 'game/util/object_oriented'], function(StaticObstacle, LinePath, oo_utils) {
	var close_to = function(a, b) {
		return Math.abs(a-b) < 0.00001;
	};

	var PolygonObstacle = function(options) {
		PolygonObstacle.superclass.call(this, options);
		this.path = options.path;
	};
	oo_utils.extend(PolygonObstacle, StaticObstacle);

	var line_segment_hits_moving_circle = function(line_segment, moving_circle) {
		var rotation_speed = moving_circle.state.rotation_speed
			, translational_speed = moving_circle.state.translational_speed
			, translational_angle = moving_circle.state.translational_angle
			, x0 = moving_circle.state.start.x
			, y0 = moving_circle.state.start.y
			, theta0 = moving_circle.state.start.theta;

		if(close_to(translational_speed, 0)) {
			return false;
		}else if(close_to(rotation_speed, 0)) {
			var moving_object_line = LinePath.fromPointAndAngle(x0, y0, theta0);
			var line_segment_line = LinePath.fromPoints(line_segment.start, line_segment.end);

			console.log("linear movement");
			console.log(line_segment, moving_object_line, line_segment_line);
		} else {
			console.log("non-linear movement");
		}
	};

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

		proto.will_touch = function(moving_object) {
			var moving_object_shape = moving_object.get_shape();
			var moving_object_state = moving_object.get_movement_state();

			var line_segments = this.get_line_segments();
			if(moving_object_shape.get_name() === "circle") {
				var radius = moving_object_shape.get_radius();
				var moving_circle = {
					state: moving_object_state
					, radius: radius
				};
				line_segments.forEach(function(line_segment) {
					var time = line_segment_hits_moving_circle(line_segment, moving_circle);
				});
			}
			return false;
		};
	})(PolygonObstacle);

	return PolygonObstacle;
});
