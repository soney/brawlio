(function(BrawlIO) {
	var error_tolerance = 0.000001;
	var close_to = BrawlIO.close_to;
	var _ = BrawlIO._;

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

	var line_is_touching = function(line, circle_position, circle_radius) {
		var distance = line.distance_to(circle_position);
		return distance <= circle_radius + 0.00001;
	};

	var next_event_with_line_segment_and_moving_circle = function(line_segment, line_segment_normal, circle_path, circle_radius) {
		var intersection_points, intersection_times, proper_magnitude_vector, line_towards_circle, circle_start, clockwise, line_segment_normal_angle, wait_until_angle, delta_t;
		if(circle_path.is("stationary")) {
			return false;
		} else if(circle_path.is("constant_velocity_line")) {
			var moving_object_ray = circle_path.get_ray();
			intersection_points = moving_object_ray.intersects_with(line_segment, circle_radius);

			if(intersection_points === true) { //It's already intersecting
				return {time: 0, event_type: "A"};
			} else if(intersection_points === false) { //It will never intersect
				return false;
			} else { //It will intersect at some time..
				intersection_times = _(intersection_points)	.chain()
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
			proper_magnitude_vector = line_segment_normal.normalize(circle_radius);

			line_towards_circle = line_segment.shift_by_vector(proper_magnitude_vector);

			intersection_points = circle.intersects_with_line_segment(line_towards_circle);
			if(intersection_points === false) { return false; }

			intersection_times = _(intersection_points)	.chain()
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
			circle_start = circle_path.get_position(0);
			if(line_is_touching(line_segment, circle_start, circle_radius)) {
				clockwise = circle_path.clockwise;
				line_segment_normal_angle = line_segment_normal.get_theta();
				wait_until_angle = line_segment_normal_angle + (clockwise ? -Math.PI/2 : Math.PI/2);
				if(clockwise) {
					wait_until_angle = make_angle_over(wait_until_angle, circle_path.initial_circle_theta);
				} else {
					wait_until_angle = make_angle_under(wait_until_angle, circle_path.initial_circle_theta);
				}
				var delta_angle = wait_until_angle - circle_path.initial_circle_theta;
				delta_t = delta_angle / circle_path.rotational_speed;
				if(delta_t <= error_tolerance ) { return false; }
				return {time: delta_t, event_type: "D"};
			} else {
				var moving_circle_movement_range = circle_path.get_line_segment_range();
				proper_magnitude_vector = line_segment_normal.normalize(circle_radius);
				line_towards_circle = line_segment.shift_by_vector(proper_magnitude_vector);

				intersection_points = moving_circle_movement_range.intersects_with(line_towards_circle);
				if(intersection_points === false) {
					return false;
				} else {
					intersection_times = _(intersection_points)	.chain()
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
			circle_start = circle_path.get_position(0);
			if(line_is_touching(line_segment, circle_start, circle_radius)) {
				clockwise = circle_path.clockwise;
				line_segment_normal_angle = line_segment_normal.get_theta();
				wait_until_angle = line_segment_normal_angle + (clockwise ? -Math.PI/2 : Math.PI/2);
				delta_t = circle_path.delta_t_until_theta_is(wait_until_angle);
				return {time: delta_t, event_type: "F"};
			}
		}
		return false;
	};


	var restrict_path = function(line_segment, line_segment_normal, circle_path, circle_radius) {
		var circle_path_vector, normal_magnitude, proper_normal, new_movement_vector, normal_theta;
		var circle_start = circle_path.get_position(0);
		if(line_is_touching(line_segment, circle_start, circle_radius)) {
			if(circle_path.is("stationary")) {
				return circle_path;
			} else if(circle_path.is("constant_velocity_line")) {
				circle_path_vector = circle_path.get_vector();
				normal_magnitude = Math.abs(circle_path_vector.dot(line_segment_normal));
				proper_normal = line_segment_normal.normalize(normal_magnitude);
				new_movement_vector = circle_path_vector.add(proper_normal);

				if(close_to(new_movement_vector.get_magnitude(), 0)) {
					return BrawlIO.create("stationary_path", {
						x0: circle_start.x
						, y0: circle_start.y
						, debug_info: {name: "Stationary after hit line", wall: line_segment}
					});
				} else {
					return BrawlIO.create("constant_velocity_line_path", {
						x0: circle_start.x
						, y0: circle_start.y
						, angle: new_movement_vector.get_theta()
						, speed: new_movement_vector.get_magnitude()
						, debug_info: {name: "Line after hit line", wall: line_segment}
					});
				}
			} else if(circle_path.is("constant_velocity_circle")) {
				circle_path_vector = circle_path.get_vector(0);
				var circle_theta = circle_path_vector.get_theta();
				normal_theta = line_segment_normal.get_theta();

				if(angle_diff(normal_theta, circle_theta) <= Math.PI/2 + error_tolerance) { //the circle isn't tring to travel along me
					return circle_path;
				}
				else {
					var rotational_speed = circle_path.get_rotational_speed();
					var speed = circle_path.get_translational_speed();


					var clockwise = rotational_speed > 0;
					var movement_angle = normal_theta + (clockwise ? -Math.PI/2 : Math.PI/2);

					var initial_theta = circle_theta - movement_angle;

					return BrawlIO.create("sinusoidal_velocity_line_path", {
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
				circle_path_vector = BrawlIO.create("vector_from_magnitude_and_angle", circle_path.speed, circle_path_theta);
				normal_magnitude = Math.abs(circle_path_vector.dot(line_segment_normal));
				proper_normal = line_segment_normal.normalize(normal_magnitude);
				new_movement_vector = circle_path_vector.add(proper_normal);
				normal_theta = line_segment_normal.get_theta();

				var new_movement_angle = new_movement_vector.get_theta();

				if(angle_diff(normal_theta, circle_path.initial_circle_theta) <= Math.PI/2 + error_tolerance) { //the circle isn't tring to travel along me
					return circle_path;
				}

				if(close_to(new_movement_vector.get_magnitude(), 0) || true ) { //TODO FIX
					return BrawlIO.create("rotating_stationary_path", {
						x0: circle_start.x
						, y0: circle_start.y
						, theta0: circle_path.initial_circle_theta
						, rotational_speed: circle_path.get_rotational_speed()
						, debug_info: {name: "rotating stationary after sinusoidal circle hit wall", wall: line_segment}
					});
				} else {
					return BrawlIO.create("sinusoidal_velocity_line_path", {
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

	BrawlIO.restrict_path = restrict_path;
	BrawlIO.next_segment_path_event = next_event_with_line_segment_and_moving_circle;
}(BrawlIO));
