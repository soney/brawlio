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
			var radius = moving_circle.radius;

			var intersection_points = moving_object_line.intersects_with(line_segment_line, radius);
			if(intersection_points === true) { //It's already intersecting
				return 0;
			} else if(intersection_points === false) { //It will never intersect
				return false;
			} else { //It will intersect at some time..
				if(!_.isArray(intersection_points)) {
					intersection_points = [intersection_points];
				}
				var moving_object_state = moving_circle.state;
				var intersection_times = intersection_points.map(function(intersection_point) {
					var delta_t = moving_object_state.delta_t_until_at(intersection_point.x, intersection_point.y);
					return delta_t;
				}).filter(function(delta_t) {
					return delta_t >= 0;
				});
				if(intersection_times.length === 0) {return false;}
				return Math.min.apply(Math, intersection_times);
			}
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
				var intersections = line_segments.map(function(line_segment) {
					var time = line_segment_hits_moving_circle(line_segment, moving_circle);
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
				}).filter(function(intersection) {
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
			}
			return false;
		};
	})(PolygonObstacle);

	return PolygonObstacle;
});
