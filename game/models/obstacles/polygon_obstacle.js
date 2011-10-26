define(['game/geometry/paths/movement_path', 'game/models/obstacles/obstacle', 'game/geometry/paths/line', 'game/util/object_oriented'], function(create_movement_path, StaticObstacle, LinePath, oo_utils) {
	var close_to = function(a, b) {
		return Math.abs(a-b) < 0.00001;
	};

	var PolygonObstacle = function(options) {
		PolygonObstacle.superclass.call(this, options);
		this.path = options.path;
	};
	oo_utils.extend(PolygonObstacle, StaticObstacle);

	var line_segment_is_touching_moving_circle = function(line_segment, moving_circle, round) {
		var line_segment_line = LinePath.fromPoints(line_segment.start, line_segment.end);
		var shape = moving_circle.get_shape();
		var position = moving_circle.get_position(round);
		return line_segment_line.distance_to(position) <= shape.get_radius();
	};

	var line_segment_hits_moving_circle = function(line_segment, moving_circle) {
		var rotation_speed = moving_circle.state.path.rotation_speed
			, translational_speed = moving_circle.state.path.translational_speed
			, translational_angle = moving_circle.state.path.translational_angle
			, x0 = moving_circle.state.path.start.x
			, y0 = moving_circle.state.path.start.y
			, theta0 = moving_circle.state.path.start.theta;

		if(close_to(translational_speed, 0)) {
			return false;
		} else if(close_to(rotation_speed, 0)) {
			//debugger;
			var moving_object_line = LinePath.fromPointAndAngle(x0, y0, theta0 + translational_angle);
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
					return delta_t !== false && delta_t >= 0;
				});
				
				if(intersection_times.length === 0) {return false;}
				return Math.min.apply(Math, intersection_times);
			}
		} else {
			console.log("non-linear movement");
		}
	};

	var line_segment_constrained_circle_path = function(line_segment, path, position, radius) {
		var rotation_speed = path.rotation_speed
			, translational_speed = path.translational_speed
			, translational_angle = path.translational_angle
			, x0 = path.start.x
			, y0 = path.start.y
			, theta0 = path.start.theta;

		if(close_to(translational_speed, 0)) {
			return false;
		} else if(close_to(rotation_speed, 0)) {
			var line_segment_line = LinePath.fromPoints(line_segment.start, line_segment.end);
			var line_segment_theta = line_segment_line.get_theta();

			var delta_theta = line_segment_theta - (theta0 + translational_angle);
			var normal = Math.cos(delta_theta);

			var new_translational_speed = translational_speed * Math.cos(delta_theta);
			var new_translational_angle = line_segment_theta - theta0;

			var new_path = create_movement_path({
				x0: position.x, y0: position.y, theta0: position.theta
				, translational_speed: new_translational_speed, translational_angle: new_translational_angle
			}, path);
			return {path: new_path, constrained_until: undefined};
		} else {
			console.log("nl movement");
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
		proto.touching = function(moving_object, round) {
			var shape = moving_object.get_shape();
			var position = moving_object.get_position(round);
			var line_segments = this.get_line_segments();
			if(shape.get_name() === "circle") {
				var intersections = line_segments.map(function(line_segment) {
					return line_segment_is_touching_moving_circle(line_segment, moving_object, round);
				});
				var intersection_signature = get_boolean_signature(intersections);
				return intersection_signature;
			}

			return false;
		};

		proto.constrain_path = function(path, moving_object, round) {
			var line_segments = this.get_line_segments();
			var shape = moving_object.get_shape();

			if(shape.get_name() === "circle") {
				var radius = shape.get_radius();
				var new_path = create_movement_path({}, path);
				var constrained_until = undefined;
				line_segments.forEach(function(line_segment) {
					if(line_segment_is_touching_moving_circle(line_segment, moving_object, round)) {
						var position = moving_object.get_position(round);
						var constraint_info = line_segment_constrained_circle_path(line_segment, new_path, position, radius);

						if(constraint_info !== false) {
							new_path = constraint_info.path;
							if(constraint_info.constrained_until !== undefined) {
								if(constrained_until === undefined) {
									constrained_until = constraint_info.constrained_until;
								} else if(constrained_until > constraint_info.constrained_until) {
									constrained_until = constraint_info.constrained_until;
								}
							}
						}
					}
				});
				//debugger;
				return {path: new_path, constrained_until: constrained_until};
			}
			return {path: create_movement_path({}, path), constrained_until: undefined};
		};
	})(PolygonObstacle);
	var get_boolean_signature = function(arr) {
		var signature = 0;
		for(var i = 0, len = Math.min(arr.length, 32); i<len; i++) {
			if(arr[i]) {
				signature = signature | (1 << i);
			}
		}
		return signature;
	};

	return PolygonObstacle;
});
