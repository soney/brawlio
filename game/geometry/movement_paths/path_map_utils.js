define(function(require) {
	require("vendor/underscore");
	var path_factory = require("game/geometry/paths/path_factory");
	var create_movement_path = require("game/geometry/movement_paths/movement_path");
	var error_tolerance = 0.000001;

	var close_to = function(a,b) {
		return Math.abs(a-b) < error_tolerance;
	};
	var make_angle_over = function(angle1, angle2) {
		while(angle1 > angle2) {
			angle1 -= 2*Math.PI;
		}
		while(angle1 < angle2) {
			angle1 += 2*Math.PI;
		}
		return angle1;
	};
	var make_angle_under = function(angle1, angle2) {
		while(angle1 < angle2) {
			angle1 += 2*Math.PI;
		}
		while(angle1 > angle2) {
			angle1 -= 2*Math.PI;
		}
		return angle1;
	};
	var angle_diff = function(angle1, angle2) {
		var angle_1_over_angle_2 = make_angle_over(angle1, angle2);
		var angle_2_over_angle_1 = make_angle_over(angle2, angle1);
		return Math.min(angle_1_over_angle_2 - angle2, angle_2_over_angle_1 - angle1);
	};

	var next_event_with_line_segment_and_moving_circle = function(line_segment, line_segment_normal, circle_path, circle_radius) {
		if(circle_path.is("stationary")) {
			return false;
		} else if(circle_path.is("constant_velocity_line")) {
			var moving_object_ray = circle_path.get_ray();
			var intersection_points = moving_object_ray.intersects_with(line_segment, circle_radius);

			if(intersection_points === true) { //It's already intersecting
				return {time: 0, event_type: "A"};
			} else if(intersection_points === false) { //It will never intersect
				return false;
			} else { //It will intersect at some time..
				var intersection_times = _(intersection_points)	.chain()
																.map(function(intersection_point) {
																	var delta_t = circle_path.delta_t_until_at(intersection_point.x, intersection_point.y);
																	return delta_t;
																})
																.filter(function(delta_t) {
																	return delta_t !== false && delta_t > 0;
																})
																.value();

				if(intersection_times.length === 0) {return false;}
				return {time: Math.min.apply(Math, intersection_times), event_type: "B"};
			}
		} else if(circle_path.is("constant_velocity_circle")) {
			var circle = circle_path.get_circle();
			var proper_magnitude_vector = line_segment_normal.normalize(circle_radius);

			var line_towards_circle = line_segment.shift_by_vector(proper_magnitude_vector);

			var intersection_points = circle.intersects_with_line_segment(line_towards_circle);
			if(intersection_points === false) { return false; }

			var intersection_times = _(intersection_points)	.chain()
															.map(function(intersection_point) {
																var delta_t = circle_path.delta_t_until_at(intersection_point.x, intersection_point.y);
																return delta_t;
															})
															.filter(function(delta_t) {
																return delta_t !== false && delta_t > 0;
															})
															.value();

			if(intersection_times.length === 0) {return false;}
			return {time: Math.min.apply(Math, intersection_times), event_type: "C"};
		} else if(circle_path.is("sinusoidal_velocity_line")) {
			var circle_start = circle_path.get_position(0);
			if(line_is_touching(line_segment, circle_start, circle_radius)) {
				var clockwise = circle_path.clockwise;
				var line_segment_normal_angle = line_segment_normal.get_theta();
				var wait_until_angle = line_segment_normal_angle + (clockwise ? -Math.PI/2 : Math.PI/2);
				if(clockwise) {
					wait_until_angle = make_angle_over(wait_until_angle, circle_path.initial_circle_theta);
				} else {
					wait_until_angle = make_angle_under(wait_until_angle, circle_path.initial_circle_theta);
				}
				var delta_angle = wait_until_angle - circle_path.initial_circle_theta;
				var delta_t = delta_angle / circle_path.rotational_speed;
				if(delta_t <= error_tolerance ) { return false; }
				return {time: delta_t, event_type: "D"};
			} else {
				var moving_circle_movement_range = circle_path.get_line_segment_range();
				var proper_magnitude_vector = line_segment_normal.normalize(circle_radius);
				var line_towards_circle = line_segment.shift_by_vector(proper_magnitude_vector);

				var intersection_points = moving_circle_movement_range.intersects_with(line_towards_circle);
				if(intersection_points === false) {
					return false;
				} else {
					var intersection_times = _(intersection_points)	.chain()
																	.map(function(intersection_point) {
																		var delta_t = circle_path.delta_t_until_at(intersection_point.x, intersection_point.y);
																		return delta_t;
																	})
																	.filter(function(delta_t) {
																		return delta_t !== false && delta_t > 0;
																	})
																	.value();

					if(intersection_times.length === 0) {return false;}
					return {time: Math.min.apply(Math, intersection_times), event_type: "E"};
				}
			}
		} else if(circle_path.is("rotating_stationary")) {
			var circle_start = circle_path.get_position(0);
			if(line_is_touching(line_segment, circle_start, circle_radius)) {
				var clockwise = circle_path.clockwise;
				var line_segment_normal_angle = line_segment_normal.get_theta();
				var wait_until_angle = line_segment_normal_angle + (clockwise ? -Math.PI/2 : Math.PI/2);
				var delta_t = circle_path.delta_t_until_theta_is(wait_until_angle);
				return {time: delta_t, event_type: "F"};
			}
		}
		return false;
	};

	var line_is_touching = function(line, circle_position, circle_radius) {
		var distance = line.distance_to(circle_position);
		return distance <= circle_radius + 0.00001;
	};

	var restrict_path = function(line_segment, line_segment_normal, circle_path, circle_radius) {
		var circle_start = circle_path.get_position(0);
		if(line_is_touching(line_segment, circle_start, circle_radius)) {
			if(circle_path.is("stationary")) {
				return circle_path;
			} else if(circle_path.is("constant_velocity_line")) {
				var circle_path_vector = circle_path.get_vector();
				var normal_magnitude = Math.abs(circle_path_vector.dot(line_segment_normal));
				var proper_normal = line_segment_normal.normalize(normal_magnitude);
				var new_movement_vector = circle_path_vector.add(proper_normal);

				if(close_to(new_movement_vector.get_magnitude(), 0)) {
					return create_movement_path("stationary", {
						x0: circle_start.x
						, y0: circle_start.y
						, debug_info: {name: "Stationary after hit line", wall: line_segment}
					});
				} else {
					return create_movement_path("constant_velocity_line", {
						x0: circle_start.x
						, y0: circle_start.y
						, angle: new_movement_vector.get_theta()
						, speed: new_movement_vector.get_magnitude()
						, debug_info: {name: "Line after hit line", wall: line_segment}
					});
				}
			} else if(circle_path.is("constant_velocity_circle")) {
				var circle_path_vector = circle_path.get_vector(0);
				var circle_theta = circle_path_vector.get_theta();
				var normal_theta = line_segment_normal.get_theta();

				if(angle_diff(normal_theta, circle_theta) <= Math.PI/2 + error_tolerance) { //the circle isn't tring to travel along me
					return circle_path;
				}
				else {
					var rotational_speed = circle_path.get_rotational_speed();
					var speed = circle_path.get_translational_speed();


					var clockwise = rotational_speed > 0;
					var movement_angle = normal_theta + (clockwise ? -Math.PI/2 : Math.PI/2);

					var initial_theta = circle_theta - movement_angle;

					return create_movement_path("sinusoidal_velocity_line", {
						x0: circle_start.x
						, y0: circle_start.y
						, movement_angle: movement_angle
						, rotational_speed: rotational_speed
						, initial_theta: initial_theta
						, initial_circle_theta: circle_theta
						, speed: speed
						, debug_info: {name: "Sinusoidal velocity line after circle hit wall", wall: line_segment}
					});
				}
			} else if(circle_path.is("sinusoidal_velocity_line")) {
				var circle_path_theta = circle_path.get_movement_angle();
				var circle_path_vector = path_factory("vector_from_magnitude_and_angle", circle_path.speed, circle_path_theta);
				var normal_magnitude = Math.abs(circle_path_vector.dot(line_segment_normal));
				var proper_normal = line_segment_normal.normalize(normal_magnitude);
				var new_movement_vector = circle_path_vector.add(proper_normal);
				var normal_theta = line_segment_normal.get_theta();

				var new_movement_angle = new_movement_vector.get_theta();

				if(angle_diff(normal_theta, circle_path.initial_circle_theta) <= Math.PI/2 + error_tolerance) { //the circle isn't tring to travel along me
					return circle_path;
				}

				if(close_to(new_movement_vector.get_magnitude(), 0) || true ) { //TODO FIX
					return create_movement_path("rotating_stationary", {
						x0: circle_start.x
						, y0: circle_start.y
						, theta0: circle_path.initial_circle_theta
						, rotational_speed: circle_path.get_rotational_speed()
						, debug_info: {name: "rotating stationary after sinusoidal circle hit wall", wall: line_segment}
					});
				} else {
					return create_movement_path("sinusoidal_velocity_line", {
						x0: circle_start.x
						, y0: circle_start.y
						, movement_angle: new_movement_angle
						, rotational_speed: circle_path.rotational_speed
						, initial_theta: circle_path.initial_theta
						, initial_circle_theta: circle_path_theta
						, speed: new_movement_vector.get_magnitude()
						, debug_info: {name: "sinusoidal after sinusoidal hit", wall: line_segment}
					});
				}
			}
		}
		return circle_path;
	};

	return {
		next_event_with_line_segment_and_moving_circle: next_event_with_line_segment_and_moving_circle 
		, restrict_path: restrict_path
	};
});
