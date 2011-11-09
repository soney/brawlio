define(function(require) {
	require("vendor/underscore");
	var path_factory = require("game/geometry/paths/path_factory");
	var create_movement_path = require("game/geometry/movement_paths/movement_path");

	var close_to = function(a,b) {
		return Math.abs(a-b) < 0.00001;
	};

	var line_segment_hits_moving_circle = function(line_segment, line_segment_normal, circle_path, circle_radius) {
		if(circle_path.is("stationary")) {
			return false;
		} else if(circle_path.is("constant_velocity_line")) {
			var moving_object_ray = circle_path.get_ray();
			var intersection_points = moving_object_ray.intersects_with(line_segment, circle_radius);

			if(intersection_points === true) { //It's already intersecting
				return 0;
			} else if(intersection_points === false) { //It will never intersect
				return false;
			} else { //It will intersect at some time..
				var intersection_times = _(intersection_points)	.chain()
																.map(function(intersection_point) {
																	var delta_t = circle_path.delta_t_until_at(intersection_point.x, intersection_point.y);
																	return delta_t;
																})
																.filter(function(delta_t) {
																	return delta_t !== false && delta_t >= 0;
																})
																.value();

				if(intersection_times.length === 0) {return false;}
				return Math.min.apply(Math, intersection_times);
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
																return delta_t !== false && delta_t >= 0;
															})
															.value();

			if(intersection_times.length === 0) {return false;}
			return Math.min.apply(Math, intersection_times);
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
					});
				} else {
					return create_movement_path("constant_velocity_line", {
						x0: circle_start.x
						, y0: circle_start.y
						, angle: new_movement_vector.get_theta()
						, speed: new_movement_vector.get_magnitude()
					});
				}
			} else if(circle_path.is("constant_velocity_circle")) {
				var circle_path_vector = circle_path.get_vector(0);
				var circle_theta = circle_path_vector.get_theta();
				var normal_theta = line_segment_normal.get_theta();
				var initial_theta = circle_theta - normal_theta;

				var normal_magnitude = Math.abs(circle_path_vector.dot(line_segment_normal));
				var proper_normal = line_segment_normal.normalize(normal_magnitude);
				var new_movement_vector = circle_path_vector.add(proper_normal);
				var movement_angle = new_movement_vector.get_theta();

				var rotational_speed = circle_path.get_rotational_speed();
				var speed = circle_path.get_translational_speed();

				return create_movement_path("sinusoidal_velocity_line", {
					x0: circle_start.x
					, y0: circle_start.y
					, movement_angle: movement_angle
					, rotational_speed: rotational_speed
					, initial_theta: initial_theta
					, speed: speed
				});
			}
		}
		return circle_path;
	};

	return {
		line_segment_hits_moving_circle: line_segment_hits_moving_circle
		, restrict_path: restrict_path
	};
});
